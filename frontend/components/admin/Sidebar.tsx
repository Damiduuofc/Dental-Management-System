"use client";

import React, { useState, useEffect } from 'react';
import { menuItems } from '@/lib/adminsildes';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
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
          height={40} 
          priority
          style={{ width: '100', height: 'auto', justifyContent: 'center' }}
          className="object-contain"
        />
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto">
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

      {/* Logout button */}
      <div className="pt-4 mt-auto border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}