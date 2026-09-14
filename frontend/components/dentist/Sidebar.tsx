"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Stethoscope, 
  FileHeart, 
  CreditCard, 
  MessageSquare, 
  ClipboardList,
  LogOut
} from 'lucide-react';

export default function DentistSidebar() {
  const pathname = usePathname();

  const dentistMenuItems = [
    { title: "Dashboard", href: "/dentist/dashboard", icon: LayoutDashboard },
    { title: "Appointments", href: "/dentist/appointments", icon: Calendar },
    { title: "Patients", href: "/dentist/patients", icon: Users },
    { title: "Treatments", href: "/dentist/treatments", icon: Stethoscope },
    { title: "X-rays & Docs", href: "/dentist/x-rays", icon: FileHeart },
    { title: "Billing", href: "/dentist/billing", icon: CreditCard },
    { title: "Messages", href: "/dentist/messages", icon: MessageSquare },
    { title: "Supply Request", href: "/dentist/supply", icon: ClipboardList }
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/admin/login";
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
      <nav className="flex-1 space-y-2 overflow-y-auto">
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

