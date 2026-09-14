"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, LogOut, ChevronDown } from "lucide-react";
import ChangePasswordModal from "@/components/ChangePasswordModal";

interface UserInfo {
  id?: string;
  _id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface ProfileDropdownProps {
  user?: UserInfo | null;
  initials?: string;
  profileUrl?: string;
  logoutUrl?: string;
  size?: "sm" | "md" | "lg";
}

export default function ProfileDropdown({
  user: initialUser,
  initials: initialInitials,
  profileUrl: customProfileUrl,
  logoutUrl: customLogoutUrl,
  size = "md"
}: ProfileDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(initialUser || null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      return;
    }

    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      const storedPatient = localStorage.getItem("patient");

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      } else if (storedPatient) {
        try {
          const parsed = JSON.parse(storedPatient);
          setUser({ ...parsed, role: "patient" });
        } catch (e) {
          console.error("Error parsing patient from localStorage:", e);
        }
      }
    }
  }, [initialUser]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Compute initials
  const displayName = user?.fullName || user?.name || "User";
  const userInitials =
    initialInitials ||
    (displayName
      ? displayName
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
      : "AD");

  // Determine role
  const role = user?.role || "system_admin";

  // Determine URLs
  const profileUrl =
    customProfileUrl ||
    (role === "dentist"
      ? "/dentist/profile"
      : role === "patient"
      ? "/patient/profile"
      : "/admin/profile");

  const logoutUrl =
    customLogoutUrl || (role === "patient" ? "/" : "/admin/login");

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = logoutUrl;
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push(profileUrl);
  };

  const handleChangePasswordClick = () => {
    setIsOpen(false);
    setIsChangePasswordOpen(true);
  };

  const sizeClasses = {
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-12 h-12 text-base"
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`${sizeClasses[size]} rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center justify-center shadow-sm hover:shadow transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 select-none group relative`}
        title={displayName}
      >
        <span>{userInitials}</span>
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200">
          <ChevronDown size={10} className={`text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in text-left">
          {/* User Info Header */}
          <div className="px-3.5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
                <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                  {role.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1.5 space-y-0.5">
            {/* Edit Profile */}
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition cursor-pointer"
            >
              <User size={17} className="text-slate-400" />
              <span>Edit Profile</span>
            </button>

            {/* Change Password */}
            <button
              onClick={handleChangePasswordClick}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition cursor-pointer"
            >
              <Lock size={17} className="text-slate-400" />
              <span>Change Password</span>
            </button>
          </div>

          {/* Logout */}
          <div className="pt-1.5 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              <LogOut size={17} className="text-red-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
