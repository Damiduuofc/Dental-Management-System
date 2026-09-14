"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { AlertTriangle } from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function Dashboard() {
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
        if (parsedUser.role === "dentist") {
          router.push("/dentist/dashboard");
          return;
        } else if (parsedUser.role !== "assistant" && parsedUser.role !== "system_admin") {
          router.push("/login");
          return;
        }
        setUser(parsedUser);
        fetchDashboardData();
        setLoading(false);
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/login");
      }
    }
  }, [router]);

  const [appointments, setAppointments] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009'}/api/admin/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const todayAppointments = appointments.filter(appt => {
    if (!appt.date) return false;
    const apptDateObj = new Date(appt.date);
    return apptDateObj.getFullYear() === todayYear &&
           apptDateObj.getMonth() === todayMonth &&
           apptDateObj.getDate() === todayDate;
  });

  const scheduledToday = todayAppointments.length;
  const checkIn = todayAppointments.filter(appt => appt.status === 'Confirmed' || appt.status === 'In Progress' || appt.status === 'Arrived').length;
  const pendingTasks = appointments.filter(appt => appt.status === 'Pending').length;

  const stats = [
    {
      label: "Scheduled Today",
      val: scheduledToday,
      href: "/admin/appointments"
    },
    {
      label: "Check In",
      val: checkIn,
      href: "/admin/check-in"
    },
    {
      label: "Low Stock Items",
      val: 5,
      href: "/admin/inventory"
    },
    {
      label: "Pending Tasks",
      val: pendingTasks,
      href: "/admin/appointments"
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="flex-1 p-8 md:ml-64">
        <Header 
          title={`Welcome back, ${user?.fullName || "User"}`} 
          subtitle="Here's what's happening today." 
          showSearch={true}
        />

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {stats.map((item, index) => (
            <div
              key={index}
              onClick={() => router.push(item.href)}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:scale-[1.02] active:scale-[0.99] transition duration-200 cursor-pointer group"
            >
              <h3 className="text-4xl font-bold text-slate-900 group-hover:text-blue-600 transition">{item.val}</h3>
              <p className="mt-2 text-slate-600 font-medium">{item.label}</p>
            </div>
          ))}
        </section>

        {/* Content */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Schedule */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                Today's Schedule
              </h3>
              <button
                onClick={() => router.push('/admin/appointments')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                View All Appointments →
              </button>
            </div>

            <div className="space-y-4">
              {todayAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  No appointments scheduled for today.
                </div>
              ) : (
                todayAppointments.map((appt) => (
                  <div
                    key={appt._id}
                    onClick={() => router.push('/admin/appointments')}
                    className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border hover:bg-slate-100/80 hover:border-blue-200 transition cursor-pointer"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-900">{appt.patient?.name || 'Unknown Patient'}</h4>

                      <p className="text-sm text-slate-500">{appt.treatment}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-blue-700 block">{appt.time}</span>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{appt.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                <h3 className="text-xl font-bold text-slate-900">Inventory Alerts</h3>
              </div>
              <button
                onClick={() => router.push('/admin/inventory')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                View Inventory →
              </button>
            </div>

            <div className="space-y-4">
              <div 
                onClick={() => router.push('/admin/inventory')}
                className="border rounded-xl p-4 hover:border-blue-200 hover:bg-slate-50/50 transition cursor-pointer"
              >
                <h4 className="font-semibold text-slate-900">Gloves</h4>
                <p className="text-sm text-red-500">Only 12 remaining</p>
              </div>

              <div 
                onClick={() => router.push('/admin/inventory')}
                className="border rounded-xl p-4 hover:border-blue-200 hover:bg-slate-50/50 transition cursor-pointer"
              >
                <h4 className="font-semibold text-slate-900">Dental Masks</h4>
                <p className="text-sm text-red-500">Only 8 remaining</p>
              </div>

              <div 
                onClick={() => router.push('/admin/inventory')}
                className="border rounded-xl p-4 hover:border-blue-200 hover:bg-slate-50/50 transition cursor-pointer"
              >
                <h4 className="font-semibold text-slate-900">Syringes</h4>
                <p className="text-sm text-red-500">Only 20 remaining</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/admin/supply')}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition cursor-pointer shadow-sm hover:shadow"
            >
              Order Supplies
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}