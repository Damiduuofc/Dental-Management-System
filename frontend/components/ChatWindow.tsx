"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, ArrowLeft, CheckCheck, User } from 'lucide-react';

export interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  model: string;
  lastMessage?: {
    _id: string;
    message: string;
    senderId: string;
    receiverId: string;
    createdAt: string;
    read: boolean;
  } | null;
  unreadCount?: number;
}

export interface MessageItem {
  _id: string;
  senderId: {
    _id: string;
    fullName?: string;
    name?: string;
  } | string;
  senderModel?: string;
  receiverId: {
    _id: string;
    fullName?: string;
    name?: string;
  } | string;
  receiverModel?: string;
  message: string;
  read?: boolean;
  readAt?: string;
  createdAt: string;
}

interface ChatWindowProps {
  currentUserId: string;
  currentUserRole: string;
  activeContact: Contact;
  socket?: Socket | null;
  onBack?: () => void;
  onMessageSent?: (msg: MessageItem) => void;
  onContactRead?: (contactId: string) => void;
}

export default function ChatWindow({
  currentUserId,
  activeContact,
  socket,
  onBack,
  onMessageSent,
  onContactRead
}: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [localSocket, setLocalSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009') + '/api';
  const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009';

  // Determine active socket
  const activeSocket = socket || localSocket;

  // 1. Fetch Chat History & Mark as Read
  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/messages/history/${activeContact.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setMessages(data);
          // Notify parent that this contact's messages were read
          if (onContactRead) {
            onContactRead(activeContact.id);
          }
          // Emit socket markRead
          if (activeSocket) {
            activeSocket.emit('markRead', {
              senderId: activeContact.id,
              readerId: currentUserId
            });
          }
        }
      } catch (err) {
        console.error("Error fetching chat history:", err);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [activeContact.id, apiBase, currentUserId, activeSocket, onContactRead]);

  // 2. Setup Local Socket fallback if not provided by parent
  useEffect(() => {
    if (socket) return;

    const newSocket = io(socketUrl);
    setLocalSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('register', currentUserId);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [socket, socketUrl, currentUserId]);

  // 3. Socket Event Listeners for Messages & Read Receipts
  useEffect(() => {
    if (!activeSocket) return;

    const handleNewMessage = (msg: MessageItem) => {
      const msgSenderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
      const msgReceiverId = typeof msg.receiverId === 'object' ? msg.receiverId._id : msg.receiverId;

      // Check if message belongs to this conversation
      const isFromActiveContact = msgSenderId === activeContact.id && msgReceiverId === currentUserId;
      const isFromMeToActiveContact = msgSenderId === currentUserId && msgReceiverId === activeContact.id;

      if (isFromActiveContact) {
        // Message is incoming in current active conversation -> mark as read immediately
        const readMsg: MessageItem = { ...msg, read: true };
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, readMsg];
        });

        activeSocket.emit('markRead', {
          senderId: activeContact.id,
          readerId: currentUserId
        });

        // Also call REST read endpoint silently
        const token = localStorage.getItem('token');
        fetch(`${apiBase}/messages/read/${activeContact.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {});

        if (onContactRead) {
          onContactRead(activeContact.id);
        }
      } else if (isFromMeToActiveContact) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleMessagesRead = (data: { readerId: string; conversationWith: string }) => {
      // If the other party read our messages in this conversation
      if (data.readerId === activeContact.id || data.conversationWith === activeContact.id) {
        setMessages((prev) =>
          prev.map((m) => {
            const senderIdStr = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
            if (senderIdStr === currentUserId) {
              return { ...m, read: true };
            }
            return m;
          })
        );
      }
    };

    activeSocket.on('newMessage', handleNewMessage);
    activeSocket.on('messagesRead', handleMessagesRead);

    return () => {
      activeSocket.off('newMessage', handleNewMessage);
      activeSocket.off('messagesRead', handleMessagesRead);
    };
  }, [activeSocket, activeContact.id, currentUserId, apiBase, onContactRead]);

  // 4. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    setInputMessage('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${apiBase}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: activeContact.id,
          receiverModel: activeContact.model,
          message: trimmed
        })
      });

      if (res.ok) {
        const sentMessage = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m._id === sentMessage._id)) return prev;
          return [...prev, sentMessage];
        });
        if (onMessageSent) {
          onMessageSent(sentMessage);
        }
      } else {
        console.error("Failed to send message via REST");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Helper for date headers
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-100">
            {activeContact.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-sm">{activeContact.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-blue-600 font-semibold capitalize">{activeContact.role}</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium hidden sm:block">
          {activeContact.email}
        </div>
      </div>

      {/* Messages canvas */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <User size={24} />
            </div>
            <p className="text-slate-700 font-semibold text-sm">No messages yet</p>
            <p className="text-slate-400 text-xs mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const senderIdStr = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
            const isMe = senderIdStr === currentUserId;

            // Date separator
            const currentDateStr = new Date(msg.createdAt).toDateString();
            const prevDateStr = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
            const showDateHeader = currentDateStr !== prevDateStr;

            return (
              <React.Fragment key={msg._id || index}>
                {showDateHeader && (
                  <div className="flex justify-center my-3">
                    <span className="bg-white border border-slate-200/70 shadow-xs text-slate-600 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      {formatDateHeader(msg.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm transition-all ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                    <div
                      className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                        isMe ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <span title={msg.read ? "Read" : "Delivered"}>
                          <CheckCheck
                            size={14}
                            className={msg.read ? "text-sky-300 stroke-[2.5]" : "text-blue-200/80 stroke-[1.8]"}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer / Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-sm text-slate-900 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition active:scale-95 shadow-sm"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

