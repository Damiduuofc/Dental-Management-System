"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DentistSidebar from "@/components/dentist/Sidebar";
import { FileHeart } from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function DentistXRaysPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/login");
      }
    }
  }, [router]);

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
            <h2 className="text-3xl font-black text-slate-900">X-rays & Docs</h2>
            <p className="text-slate-500 mt-1">Manage and store diagnostic imaging files</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center shadow">
              {userInitials}
            </div>
          </div>
        </header>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center max-w-3xl">
          <FileHeart className="mx-auto text-slate-350 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-900 mb-1">X-rays & Docs Section</h3>
          <p className="text-slate-500 text-sm">This component is under development in this phase.</p>
        </div>
      </main>
    </div>
  );
}
