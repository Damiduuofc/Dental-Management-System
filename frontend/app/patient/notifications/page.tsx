"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  X,
  CreditCard,
  Bell,
  Search
} from "lucide-react";
import PatientSidebar from "@/components/patient/Sidebar";
import ProfileDropdown from "@/components/ProfileDropdown";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'booking' | 'reschedule' | 'cancel' | 'billing' | 'general';
  read: boolean;
  createdAt: string;
}

export default function PatientNotifications() {
  const [patient, setPatient] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchPatientData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009"}/api/patient/profile`, {
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json" 
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPatient(data);
      }
    } catch (error) {
      console.error("Error loading patient:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009"}/api/patient/notifications`, {
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json" 
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009"}/api/patient/notifications/read`, {
        method: 'PUT',
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json" 
        }
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error reading notifications:", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }
      fetchPatientData();
      fetchNotifications();
      markNotificationsAsRead();
    }
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <CalendarDays className="text-blue-600" size={18} />;
      case 'cancel':
        return <X className="text-red-600" size={18} />;
      case 'reschedule':
        return <Clock className="text-yellow-600" size={18} />;
      case 'billing':
        return <CreditCard className="text-green-600" size={18} />;
      default:
        return <Bell className="text-slate-600" size={18} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <PatientSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 ml-64">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search alerts..."
              className="pl-11 w-72 rounded-full border border-slate-200 bg-white py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <ProfileDropdown user={patient ? { ...patient, role: 'patient' } : null} />
            <div className="hidden sm:block">
              <p className="font-semibold text-sm text-slate-800">{patient?.name || "Loading..."}</p>
              <p className="text-[11px] text-slate-500 font-bold uppercase">Patient</p>
            </div>
          </div>
        </header>

        {/* Notifications page content */}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Alert Notifications</h3>
            <p className="text-slate-500 text-sm">System updates, appointments, and billing statements</p>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border text-center text-slate-500 font-medium max-w-3xl shadow-sm">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl">
              {notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  className={`border rounded-2xl p-5 transition flex gap-4 ${
                    notif.read ? "bg-white border-slate-100 shadow-sm" : "bg-blue-50 border-blue-100 shadow-sm"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{notif.title}</h4>
                    <p className="text-sm text-slate-650 mt-1 font-medium leading-relaxed">{notif.message}</p>
                    <span className="text-xs text-slate-400 block mt-3 font-semibold">
                      Received on {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
