"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Pill, 
  CreditCard, 
  Bell, 
  UserCircle,
  Lock,
  LogOut
} from 'lucide-react';
import ChangePasswordModal from '@/components/ChangePasswordModal';

export default function PatientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadNotificationsCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/patient/notifications`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (response.ok) {
          const data = await response.json();
          const unread = data.filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Error loading notifications in sidebar:", error);
      }
    };

    fetchUnreadNotificationsCount();
    const interval = setInterval(fetchUnreadNotificationsCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const patientMenuItems = [
    { title: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
    { title: "My Appointments", href: "/patient/appointments", icon: CalendarDays },
    { title: "Prescriptions", href: "/patient/prescriptions", icon: Pill },
    { title: "Billing & Balance", href: "/patient/billing", icon: CreditCard },
    { title: "Notifications", href: "/patient/notifications", icon: Bell, badge: unreadCount },
    { title: "My Profile", href: "/patient/profile", icon: UserCircle },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patient");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col px-6 py-8 fixed h-screen z-10">
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
        {patientMenuItems.map((item) => {
          const active = pathname === item.href;
          const showBadge = item.badge !== undefined && item.badge > 0;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`w-full flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-sm transition-all duration-200 cursor-pointer ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span>{item.title}</span>
              </div>
              {showBadge && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  active ? "bg-white text-blue-600" : "bg-red-500 text-white"
                }`}>
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Update Password Button */}
      <button
        onClick={() => setIsChangePasswordOpen(true)}
        className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white cursor-pointer w-full text-sm"
      >
        <Lock size={18} />
        Update Password
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-600 hover:text-white cursor-pointer w-full text-sm"
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
