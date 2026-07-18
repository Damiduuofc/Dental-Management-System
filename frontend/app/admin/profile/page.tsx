"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { User, Phone, Mail, Loader2, Save, X, Edit2 } from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFullName(data.fullName || "");
        setEmail(data.email || "");
        setPhoneNumber(data.phoneNumber || "");
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load profile.");
      }
    } catch (err) {
      console.error("Error fetching staff profile:", err);
      setError("Network error loading profile.");
    } finally {
      setLoading(false);
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
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== "assistant" && parsedUser.role !== "system_admin") {
          router.push("/login");
          return;
        }
        fetchProfile();
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/login");
      }
    }
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setError("Name and Email are required fields.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, email, phoneNumber })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setIsEditing(false);
        setProfile(data);
        // Sync with localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.fullName = data.fullName;
          userObj.email = data.email;
          localStorage.setItem("user", JSON.stringify(userObj));
        }
        // Force refresh or reload state to update any other sidebar/header components
        setTimeout(() => {
          setSuccess(false);
          window.location.reload();
        }, 1000);
      } else {
        setError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Network error saving profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const userInitials = profile
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "AD";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium font-sans">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 p-8 md:ml-64">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Account Settings</h2>
          <p className="text-slate-500 mt-1">Manage your administrator details and staff preferences.</p>
        </header>

        <section className="max-w-3xl">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            
            {/* Header / Avatar */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-16 h-16 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xl shadow-inner">
                {userInitials}
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">{profile?.fullName}</h4>
                <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {profile?.role === "system_admin" ? "System Admin" : "Assistant"}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium">
                Profile updated successfully! Refreshing...
              </div>
            )}

            {!isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Full Name</p>
                    <p className="font-bold text-slate-800 mt-1">{profile?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Email Address</p>
                    <p className="font-bold text-slate-800 mt-1">{profile?.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Phone Number</p>
                    <p className="font-bold text-slate-800 mt-1">{profile?.phoneNumber || "N/A"}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition cursor-pointer text-sm shadow shadow-blue-100"
                  >
                    <Edit2 size={16} />
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-5 text-sm">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400">
                      <User size={18} />
                    </span>
                    <input 
                      type="text"
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-400">
                        <Mail size={18} />
                      </span>
                      <input 
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-400">
                        <Phone size={18} />
                      </span>
                      <input 
                        type="text"
                        placeholder="Enter contact number"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError("");
                      setFullName(profile?.fullName || "");
                      setEmail(profile?.email || "");
                      setPhoneNumber(profile?.phoneNumber || "");
                    }}
                    className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition cursor-pointer"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg shadow-blue-100 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </section>
      </main>
    </div>
  );
}
