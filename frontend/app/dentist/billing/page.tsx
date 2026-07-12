"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DentistSidebar from "@/components/dentist/Sidebar";
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  FileText, 
  Bell, 
  Search,
  DollarSign
} from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Patient {
  _id: string;
  name: string;
  dob: string;
  gender: string;
  phoneNumber: string;
  email: string;
}

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
  } | null;
  dentist: {
    _id: string;
    name: string;
  } | string | null;
  date: string;
  time: string;
  treatment: string;
  status: string;
}

export default function DentistBillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/dentist/notifications`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/dentist/notifications/read`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { 'Authorization': `Bearer ${token}` };
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      // 1. Fetch appointments
      const apptRes = await fetch(`${apiBase}/api/admin/appointments`, { headers });
      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(data);
      }

      // 2. Fetch patients
      const patientRes = await fetch(`${apiBase}/api/admin/patients`, { headers });
      if (patientRes.ok) {
        const data = await patientRes.json();
        setPatients(data);
      }

      // 3. Fetch bills
      const billingRes = await fetch(`${apiBase}/api/admin/billing`, { headers });
      if (billingRes.ok) {
        const data = await billingRes.json();
        setBills(data);
      }

      // 4. Fetch notifications
      fetchNotifications();
    } catch (error) {
      console.error("Error loading dentist portal data:", error);
    }
  };

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
        if (parsedUser.role !== "dentist") {
          router.push("/admin/dashboard");
          return;
        }
        setUser(parsedUser);
        fetchData();
        setLoading(false);
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/login");
      }
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculations
  const dentistId = user?.id;
  const todayStr = new Date().toDateString();

  const dentistAppointments = appointments.filter(appt => {
    const dId = typeof appt.dentist === 'string' ? appt.dentist : appt.dentist?._id;
    return dId === dentistId;
  });

  const dentistBills = bills.filter(b => {
    const bDentistId = typeof b.dentist === 'string' ? b.dentist : b.dentist?._id;
    return bDentistId === dentistId;
  });

  // 1. Today's Revenue
  const todayPaidBills = dentistBills.filter(b => b.status === 'Paid' && new Date(b.date).toDateString() === todayStr);
  const todayRevenue = todayPaidBills.reduce((sum, b) => sum + b.amount, 0);

  // 2. Appointments Today
  const todayAppointmentsCount = dentistAppointments.filter(appt => new Date(appt.date).toDateString() === todayStr).length;

  // 3. Completed Today
  const completedTodayCount = dentistAppointments.filter(appt => appt.status === 'Completed' && new Date(appt.date).toDateString() === todayStr).length;

  // 4. Total Revenue of the Month
  const now = new Date();
  const thisMonthPaidBills = dentistBills.filter(b => b.status === 'Paid' && new Date(b.date).getMonth() === now.getMonth() && new Date(b.date).getFullYear() === now.getFullYear());
  const totalRevenueMonth = thisMonthPaidBills.reduce((sum, b) => sum + b.amount, 0);

  // Paid bills list for related dentist
  const dentistPaidBills = dentistBills.filter(b => b.status === 'Paid');

  const userInitials = user
    ? user.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
    : "DR";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DentistSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 ml-64 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Earning Summary & Reports</h2>
            <p className="text-slate-500 mt-1">Track payments and daily practice stats</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) {
                    markNotificationsAsRead();
                  }
                }}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer relative"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-85 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-fade-in text-left">
                  <div className="flex justify-between items-center border-b pb-2 mb-3">
                    <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
                    <button 
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4 font-medium">No notifications yet.</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif._id} className={`p-3 rounded-xl border text-xs leading-relaxed ${notif.read ? 'bg-white border-slate-100 text-slate-600' : 'bg-blue-50/50 border-blue-100 text-slate-800 font-medium'}`}>
                          <p className="font-bold text-slate-900 mb-0.5">{notif.title}</p>
                          <p>{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-11 h-11 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center shadow">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="space-y-8">
          {/* Stats Cards Grid (White Cards with Borders) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Today's Revenue */}
            <div className="bg-white border border-slate-200 text-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[135px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={16} /></span>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-3">Rs. {todayRevenue.toLocaleString()}</div>
            </div>

            {/* Appointments Today */}
            <div className="bg-white border border-slate-200 text-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[135px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Appointments Today</span>
                <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg"><Calendar size={16} /></span>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-3">{todayAppointmentsCount}</div>
            </div>

            {/* Completed Appointments Today */}
            <div className="bg-white border border-slate-200 text-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[135px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Completed Today</span>
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={16} /></span>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-3">{completedTodayCount}</div>
            </div>

            {/* Total Revenue of the Month */}
            <div className="bg-white border border-slate-200 text-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[135px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Rev (Month)</span>
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><TrendingUp size={16} /></span>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-3">Rs. {totalRevenueMonth.toLocaleString()}</div>
            </div>
          </div>

          {/* Recent Reports section: showing list of bills that are paid specifically for this dentist */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Recent Settled Payments</h3>
                <p className="text-slate-500 text-xs mt-0.5">List of paid patient invoices for your treatments</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              {dentistPaidBills.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-semibold">
                  No settled payments found.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-700">
                    <tr>
                      <th className="p-4 rounded-l-2xl">Date</th>
                      <th className="p-4">Patient</th>
                      <th className="p-4">Treatments</th>
                      <th className="p-4">Method</th>
                      <th className="p-4 text-right rounded-r-2xl">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dentistPaidBills.map((bill) => (
                      <tr key={bill._id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition">
                        <td className="p-4 text-slate-600 font-medium">
                          {new Date(bill.date || bill.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {bill.patient?.name || 'N/A'}<br/>
                          <span className="text-xs text-slate-400 font-normal">{bill.patient?.email}</span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{bill.treatment}</td>
                        <td className="p-4 text-slate-600 font-semibold">{bill.paymentMethod || 'N/A'}</td>
                        <td className="p-4 text-right font-black text-blue-600">
                          Rs. {bill.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
