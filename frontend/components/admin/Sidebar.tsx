"use client";

import React, { useState, useEffect } from 'react';
import { menuItems } from '@/lib/adminsildes';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

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
    </aside>
  );
}