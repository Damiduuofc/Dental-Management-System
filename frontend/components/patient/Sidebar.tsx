"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Pill, 
  CreditCard, 
  Bell, 
  Stethoscope, 
  FileHeart, 
  MessageSquare,
  LogOut
} from 'lucide-react';

export default function PatientSidebar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadNotificationsCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009"}/api/patient/notifications`, {
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
    { title: "Treatments", href: "/patient/treatments", icon: Stethoscope },
    { title: "X-rays & Records", href: "/patient/x-rays", icon: FileHeart },
    { title: "Prescriptions", href: "/patient/prescriptions", icon: Pill },
    { title: "Billing & Balance", href: "/patient/billing", icon: CreditCard },
    { title: "Messages", href: "/patient/messages", icon: MessageSquare },
    { title: "Notifications", href: "/patient/notifications", icon: Bell, badge: unreadCount },
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
      <nav className="flex-1 space-y-2 overflow-y-auto">
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

      {/* Logout button */}
      <div className="pt-4 mt-auto border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
