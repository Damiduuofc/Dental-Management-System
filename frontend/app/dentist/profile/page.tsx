"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DentistSidebar from "@/components/dentist/Sidebar";
import { 
  User, 
  Bell
} from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function DentistProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePhone, setProfilePhone] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: ""
  });

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/dentist/notifications`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/dentist/notifications/read`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const fetchProfilePhone = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/staff/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfilePhone(data.phoneNumber || "");
      }
    } catch (err) {
      console.error("Error fetching profile phone:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        router.push("/login");
        return;
      }

      try {
        const parsedUser: UserProfile = JSON.parse(storedUser);
        if (parsedUser.role !== "dentist") {
          router.push("/admin/dashboard");
          return;
        }
        setUser(parsedUser);
        fetchProfilePhone();
        fetchNotifications();
        setLoading(false);
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/login");
      }
    }
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/staff/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email,
          phoneNumber: editForm.phoneNumber
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        
        // Update user state and localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.fullName = updatedUser.fullName;
          userObj.email = updatedUser.email;
          localStorage.setItem("user", JSON.stringify(userObj));
          setUser(userObj);
        }
        
        setProfilePhone(updatedUser.phoneNumber || "");
        setIsEditingProfile(false);
        alert("Profile details updated successfully!");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const userInitials = user
    ? user.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
    : "DR";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DentistSidebar />

      <main className="flex-1 p-8 ml-64 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">My Profile</h2>
            <p className="text-slate-500 mt-1">Manage your account information and credentials</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) {
                    markNotificationsAsRead();
                  }
                }}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer relative"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-85 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-fade-in text-left">
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
                      notifications.map(notif => (
                        <div key={notif._id} className={`p-3 rounded-xl border text-xs leading-relaxed ${notif.read ? 'bg-white border-slate-100 text-slate-600' : 'bg-blue-50/50 border-blue-100 text-slate-800 font-medium'}`}>
                          <p className="font-bold text-slate-900 mb-0.5">{notif.title}</p>
                          <p>{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-11 h-11 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center shadow">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Profile Card Layout */}
        <div className="space-y-6 max-w-3xl animate-fade-in">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b pb-6">
              <div className="w-16 h-16 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xl shadow-inner">
                {userInitials}
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">{user?.fullName}</h4>
                <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Dentist
                </span>
              </div>
            </div>

            {!isEditingProfile ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Full Name</p>
                    <p className="font-bold text-slate-800 mt-1">{user?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Email Address</p>
                    <p className="font-bold text-slate-800 mt-1">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Phone Number</p>
                    <p className="font-bold text-slate-800 mt-1">{profilePhone || "N/A"}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditForm({
                        fullName: user?.fullName || '',
                        email: user?.email || '',
                        phoneNumber: profilePhone || ''
                      });
                      setIsEditingProfile(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition cursor-pointer text-sm shadow shadow-blue-100"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-5 text-sm">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input 
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-350 border-slate-205 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input 
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-350 border-slate-205 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input 
                    type="text"
                    required
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-350 border-slate-205 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 bg-slate-50/50"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="py-3 px-5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-100 cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
