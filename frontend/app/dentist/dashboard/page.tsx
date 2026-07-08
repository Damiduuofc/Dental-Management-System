"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ClipboardList, 
  LogOut, 
  Search, 
  Stethoscope,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileHeart,
  CreditCard,
  MessageSquare,
  FileText
} from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function DentistDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

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
          // If not dentist, redirect to admin dashboard (system_admin or assistant)
          router.push("/admin/dashboard");
          return;
        }
        setUser(parsedUser);
        setLoading(false);
      } catch (err) {
        console.error("Error parsing user profile in Dentist Dashboard:", err);
        router.push("/login");
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  const dentistName = user?.fullName || "Dentist";
  const userInitials = user
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "DR";

  const dentistMenuItems = [
    { title: "Dashboard", id: "dashboard", icon: LayoutDashboard },
    { title: "Appointments", id: "appointments", icon: Calendar },
    { title: "Patients", id: "patients", icon: Users },
    { title: "Treatments", id: "treatments", icon: Stethoscope },
    { title: "X-rays & Docs", id: "x-rays", icon: FileHeart },
    { title: "Billing", id: "billing", icon: CreditCard },
    { title: "Messages", id: "messages", icon: MessageSquare },
    { title: "Reports", id: "reports", icon: FileText },
  ];

  const stats = [
    { label: "Today's Patients", val: 8, icon: Users, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "Completed Today", val: 3, icon: CheckCircle2, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Next Appointment", val: "09:30 AM", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { label: "Total Treatments Done", val: 142, icon: Activity, color: "text-purple-600 bg-purple-50 border-purple-100" },
  ];

  const todayAppointments = [
    { name: "John Perera", time: "09:30 AM", type: "Teeth Cleaning", status: "Checked In" },
    { name: "Amanda Silva", time: "10:45 AM", type: "Root Canal", status: "Waiting" },
    { name: "Nimal Fernando", time: "01:15 PM", type: "Dental Consultation", status: "Scheduled" },
    { name: "Suresh Perera", time: "03:00 PM", type: "Tooth Extraction", status: "Scheduled" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col px-6 py-8 fixed h-screen">
        <div className="text-2xl font-black text-emerald-800 mb-10 px-2 flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg text-white">D+</div> Dentplus
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-2">
          {dentistMenuItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                  active
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
                    : "text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                }`}
              >
                <item.icon size={20} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 ml-64 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">
              Welcome back, Dr. {dentistName.replace("Dr. ", "")}
            </h2>
            <p className="text-slate-500 mt-1">Here is your clinical overview for today.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search patients, records..."
                className="pl-11 pr-4 py-2.5 w-72 rounded-full border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="w-11 h-11 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shadow">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Dynamic content rendering based on activeTab */}
        {activeTab === "dashboard" && (
          <>
            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {stats.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition flex items-center gap-4"
                >
                  <div className={`p-4 rounded-2xl border ${item.color}`}>
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{item.val}</h3>
                    <p className="text-sm text-slate-500 font-medium">{item.label}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Core Section */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Daily Queue */}
              <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Today's Appointment Queue</h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    Active
                  </span>
                </div>

                <div className="space-y-4">
                  {todayAppointments.map((patient, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{patient.name}</h4>
                          <p className="text-xs text-slate-500">{patient.type}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="font-bold text-emerald-700 text-sm block">{patient.time}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            patient.status === "Checked In" ? "bg-blue-50 text-blue-700" :
                            patient.status === "Waiting" ? "bg-amber-50 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {patient.status}
                          </span>
                        </div>
                        <button className="h-9 w-9 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 flex items-center justify-center hover:text-emerald-700 transition">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions & Notes */}
              <div className="space-y-8">
                {/* Dentist Tools */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2">
                      <Stethoscope size={16} /> Start Dental Exam
                    </button>
                    <button className="w-full bg-white border hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2">
                      <ClipboardList size={16} /> Write Prescription
                    </button>
                  </div>
                </div>

                {/* Treatment Notes Reminder */}
                <div className="bg-emerald-950 text-emerald-100 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                    <Stethoscope size={150} />
                  </div>
                  <h4 className="font-bold text-white text-lg mb-2">Did you know?</h4>
                  <p className="text-sm leading-relaxed text-emerald-200">
                    Entering clinical and post-op care notes within 1 hour of treatment improves patient compliance by 40% when integrated with automatic SMS instructions.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab !== "dashboard" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <Stethoscope className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-900 mb-1">{activeTab.toUpperCase()} Section</h3>
            <p className="text-slate-500 text-sm">This component is under development in this phase.</p>
          </div>
        )}
      </main>
    </div>
  );
}
