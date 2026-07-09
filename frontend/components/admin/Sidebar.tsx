"use client";

import React, { useState, useEffect } from 'react';
import { menuItems } from '@/lib/adminsildes';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>("system_admin");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          if (userObj && userObj.role) {
            setUserRole(userObj.role);
          }
        } catch (e) {
          console.error("Error parsing user from localStorage in Sidebar:", e);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col px-6 py-8 fixed h-screen">
      <h1 className="text-3xl font-black text-blue-900 mb-10">Dentplus</h1>

      {/* Menu */}
      <nav className="flex-1 space-y-2">
        {menuItems
          .filter((item) => item.roles.includes(userRole))
          .map((item, i) => {
            const active = pathname === item.href;

            return (
              <a 
                key={i} 
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200
                  ${active 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                    : "text-slate-700 hover:bg-slate-100 hover:text-blue-700"}`}
              >
                <item.icon size={20} />
                <span>{item.title}</span>
              </a>
            );
          })}
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-600 hover:text-white cursor-pointer"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}