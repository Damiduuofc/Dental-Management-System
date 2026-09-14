"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import PatientSidebar from "@/components/patient/Sidebar";
import ChatWindow, { Contact, MessageItem } from "@/components/ChatWindow";
import ProfileDropdown from "@/components/ProfileDropdown";
import { MessageSquare, Search, CheckCheck } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface PatientProfile {
  _id: string;
  name: string;
  email: string;
}

function formatMessageTime(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function PatientMessagesPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const activeContactRef = useRef<Contact | null>(null);
  activeContactRef.current = activeContact;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";
  const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009";

  // 1. Patient Authentication
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const fetchProfile = async () => {
        try {
          const res = await fetch(`${apiBase}/patient/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          if (res.ok) {
            const data = await res.json();
            setPatient(data);
            setLoading(false);
          } else {
            router.push("/");
          }
        } catch (err) {
          console.error("Error fetching patient profile:", err);
          router.push("/");
        }
      };

      fetchProfile();
    }
  }, [router, apiBase]);

  // 2. Fetch Contacts Callback
  const fetchContacts = useCallback(async () => {
    if (!patient) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/messages/contacts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data: Contact[] = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    }
  }, [patient, apiBase]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // 3. Setup Socket Connection at Page Level
  useEffect(() => {
    if (!patient) return;

    const s = io(socketUrl);
    setSocket(s);

    s.on("connect", () => {
      s.emit("register", patient._id);
    });

    const handleNewMessage = (msg: MessageItem) => {
      const msgSenderId = typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
      const msgReceiverId = typeof msg.receiverId === "object" ? msg.receiverId._id : msg.receiverId;
      const isIncoming = msgReceiverId === patient._id;
      const otherPersonId = isIncoming ? msgSenderId : msgReceiverId;

      setContacts((prevContacts) => {
        const contactIndex = prevContacts.findIndex((c) => c.id === otherPersonId);
        if (contactIndex === -1) {
          fetchContacts();
          return prevContacts;
        }

        const existingContact = prevContacts[contactIndex];
        const isCurrentlyActive = activeContactRef.current?.id === otherPersonId;

        const updatedContact: Contact = {
          ...existingContact,
          lastMessage: {
            _id: msg._id,
            message: msg.message,
            senderId: msgSenderId,
            receiverId: msgReceiverId,
            createdAt: msg.createdAt,
            read: isCurrentlyActive ? true : (msg.read || false)
          },
          unreadCount:
            isIncoming && !isCurrentlyActive
              ? (existingContact.unreadCount || 0) + 1
              : isCurrentlyActive
              ? 0
              : existingContact.unreadCount || 0
        };

        // Pop contact to top (index 0)
        const remaining = prevContacts.filter((_, idx) => idx !== contactIndex);
        return [updatedContact, ...remaining];
      });
    };

    const handleMessagesRead = (data: { readerId: string; conversationWith: string }) => {
      setContacts((prevContacts) =>
        prevContacts.map((c) => {
          if (c.id === data.readerId || c.id === data.conversationWith) {
            return {
              ...c,
              lastMessage: c.lastMessage ? { ...c.lastMessage, read: true } : c.lastMessage
            };
          }
          return c;
        })
      );
    };

    s.on("newMessage", handleNewMessage);
    s.on("messagesRead", handleMessagesRead);

    return () => {
      s.off("newMessage", handleNewMessage);
      s.off("messagesRead", handleMessagesRead);
      s.disconnect();
    };
  }, [patient, socketUrl, fetchContacts]);

  // 4. Handle Search & Filtering
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredContacts(
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.role.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          (c.lastMessage?.message && c.lastMessage.message.toLowerCase().includes(term))
      )
    );
  }, [searchTerm, contacts]);

  // 5. Select Contact Handler
  const handleSelectContact = (contact: Contact) => {
    setActiveContact(contact);

    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, unreadCount: 0 } : c))
    );

    const token = localStorage.getItem("token");
    fetch(`${apiBase}/messages/read/${contact.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }).catch(() => {});

    if (socket && patient) {
      socket.emit("markRead", { senderId: contact.id, readerId: patient._id });
    }
  };

  // 6. Callback when active contact's messages are read
  const handleContactRead = (contactId: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, unreadCount: 0 } : c))
    );
  };

  // 7. Callback when a message is sent from ChatWindow
  const handleMessageSent = (sentMsg: MessageItem) => {
    const receiverIdStr =
      typeof sentMsg.receiverId === "object" ? sentMsg.receiverId._id : sentMsg.receiverId;

    setContacts((prev) => {
      const index = prev.findIndex((c) => c.id === receiverIdStr);
      if (index === -1) return prev;

      const updated: Contact = {
        ...prev[index],
        lastMessage: {
          _id: sentMsg._id,
          message: sentMsg.message,
          senderId: patient?._id || "",
          receiverId: receiverIdStr,
          createdAt: sentMsg.createdAt,
          read: false
        }
      };

      const remaining = prev.filter((_, idx) => idx !== index);
      return [updated, ...remaining];
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const patientInitials = patient?.name
    ? patient.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "PT";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PatientSidebar />

      <main className="flex-1 p-8 ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 flex-shrink-0">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Messages</h2>
            <p className="text-slate-500 mt-1">Communicate with your dentist, clinic assistants, and doctors</p>
          </div>

          <div className="flex items-center gap-4">
            <ProfileDropdown user={patient ? { ...patient, role: 'patient' } : null} initials={patientInitials} />
          </div>
        </header>

        {/* Messaging Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
          {/* Contacts Sidebar */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-[600px]">
            {/* Search */}
            <div className="p-4 border-b border-slate-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search clinic staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No contacts found</div>
              ) : (
                filteredContacts.map((contact) => {
                  const isActive = activeContact?.id === contact.id;
                  const hasUnread = (contact.unreadCount || 0) > 0;
                  const lastMsg = contact.lastMessage;
                  const isLastMsgFromMe = lastMsg && lastMsg.senderId === patient?._id;

                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition relative ${
                        isActive
                          ? "bg-blue-50/60 border-l-4 border-blue-600"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200/60">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        {hasUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Top Row: Name & Time */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4
                            className={`text-sm truncate ${
                              hasUnread ? "font-bold text-slate-950" : "font-semibold text-slate-800"
                            }`}
                          >
                            {contact.name}
                          </h4>
                          {lastMsg?.createdAt && (
                            <span
                              className={`text-[11px] flex-shrink-0 ${
                                hasUnread ? "font-bold text-blue-600" : "text-slate-400"
                              }`}
                            >
                              {formatMessageTime(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>

                        {/* Bottom Row: Message snippet & Unread pill */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            {isLastMsgFromMe && (
                              <CheckCheck
                                size={14}
                                className={`flex-shrink-0 ${
                                  lastMsg?.read ? "text-sky-500 stroke-[2.5]" : "text-slate-400"
                                }`}
                              />
                            )}
                            {lastMsg ? (
                              <p
                                className={`text-xs truncate ${
                                  hasUnread ? "font-semibold text-slate-900" : "text-slate-500"
                                }`}
                              >
                                {lastMsg.message}
                              </p>
                            ) : (
                              <span className="text-[11px] text-blue-600/80 font-medium capitalize bg-blue-50/70 px-2 py-0.5 rounded-md">
                                {contact.role}
                              </span>
                            )}
                          </div>

                          {hasUnread && (
                            <span className="flex-shrink-0 bg-blue-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-xs">
                              {contact.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Conversation or Placeholder */}
          <div className="md:col-span-2">
            {activeContact && patient ? (
              <ChatWindow
                currentUserId={patient._id}
                currentUserRole="patient"
                activeContact={activeContact}
                socket={socket}
                onBack={() => setActiveContact(null)}
                onContactRead={handleContactRead}
                onMessageSent={handleMessageSent}
              />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center h-[600px] flex flex-col justify-center items-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Select a Conversation</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  Choose a doctor or clinic staff member to ask questions or get assistance in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
