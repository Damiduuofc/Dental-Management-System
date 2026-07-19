"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Stethoscope, 
  FileHeart, 
  CreditCard, 
  MessageSquare, 
  FileText, 
  User,
  Lock,
  LogOut
} from 'lucide-react';
import ChangePasswordModal from '@/components/ChangePasswordModal';

export default function DentistSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [userInitials, setUserInitials] = useState("DR");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          if (userObj && userObj.fullName) {
            const initials = userObj.fullName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2);
            setUserInitials(initials || "DR");
          }
        } catch (e) {
          console.error("Error parsing user from localStorage in Sidebar:", e);
        }
      }
    }
  }, []);

  const dentistMenuItems = [
    { title: "Dashboard", href: "/dentist/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/dentist/appointments", icon: Calendar },
    { title: "Patients", href: "/dentist/patients", icon: Users },
    { title: "Treatments", href: "/dentist/treatments", icon: Stethoscope },
    { title: "X-rays & Docs", href: "/dentist/x-rays", icon: FileHeart },
    { title: "Billing", href: "/dentist/billing", icon: CreditCard },
    { title: "Messages", href: "/dentist/messages", icon: MessageSquare },
    { title: "My Profile", href: "/dentist/profile", icon: User },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col px-6 py-8 fixed h-screen">
      <div className="mb-10 px-2 flex justify-start">
        <Image 
          src="/logo.png" 
          alt="Dentplus Logo" 
          width={100} 
          height={50} 
          priority
          style={{ width: '100', height: 'auto' }}
          className="object-contain"
        />
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2">
        {dentistMenuItems.map((item) => {
          const active = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
              }`}
            >
              <item.icon size={20} />
              <span>{item.title}</span>
            </a>
          );
        })}
      </nav>

      {/* Update Password Button */}
      <button
        onClick={() => setIsChangePasswordOpen(true)}
        className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white cursor-pointer"
      >
        <Lock size={18} />
        Update Password
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-600 hover:text-white cursor-pointer"
      >
        <LogOut size={18} />
        Logout
      </button>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </aside>
  );
}
