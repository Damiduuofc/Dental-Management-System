"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Search } from "lucide-react";
import { io, Socket } from "socket.io-client";
import ProfileDropdown from "@/components/ProfileDropdown";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export default function Header({ title, subtitle, onSearch, showSearch = true }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userInitials, setUserInitials] = useState("AD");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";

  // Fetch initial assistant notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${apiBase}/inventory/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications in Header:", err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${apiBase}/inventory/notifications/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  useEffect(() => {
    // Fetch initial notifications
    fetchNotifications();

    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          setCurrentUser(userObj);
          if (userObj && userObj.fullName) {
            const initials = userObj.fullName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2);
            setUserInitials(initials || "AD");
          }

          // Socket connection
          const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009";
          const socket = io(socketUrl);
          socketRef.current = socket;

          socket.on("connect", () => {
            console.log("🔌 Connected to socket server in Admin Header");
            socket.emit("register", { userId: userObj.id, role: userObj.role });
          });

          socket.on("newNotification", (newNotif: Notification) => {
            console.log("🔔 Received new notification:", newNotif);
            setNotifications((prev) => [newNotif, ...prev]);
          });

          return () => {
            socket.disconnect();
          };
        } catch (e) {
          console.error("Error setting up socket/initials:", e);
        }
      }
    }
  }, []);

  // Handle click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex items-center justify-between mb-8 relative">
      <div>
        <h2 className="text-3xl font-black text-slate-900">{title}</h2>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="pl-11 pr-4 py-2.5 w-72 rounded-full border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              if (!isNotifOpen && unreadCount > 0) {
                markNotificationsAsRead();
              }
            }}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-fade-in text-left">
              <div className="flex justify-between items-center border-b pb-2 mb-3">
                <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 font-medium">No notifications yet.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        notif.read
                          ? "bg-white border-slate-100 text-slate-600"
                          : "bg-blue-50/50 border-blue-100 text-slate-800 font-medium"
                      }`}
                    >
                      <p className="font-bold text-slate-900 mb-0.5">{notif.title}</p>
                      <p>{notif.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <ProfileDropdown user={currentUser} initials={userInitials} />
      </div>
    </header>
  );
}
