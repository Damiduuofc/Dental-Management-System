"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DentistSidebar from "@/components/dentist/Sidebar";
import PatientDetailsModal from "@/components/PatientDetailsModal";
import { 
  Users, 
  Search, 
  Bell
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
  nic: string;
  homeAddress?: string;
  allergies?: string;
}

export default function DentistPatientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Patient details modal state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

      // Fetch patients
      const patientRes = await fetch(`${apiBase}/api/admin/patients`, { headers });
      if (patientRes.ok) {
        const data = await patientRes.json();
        setPatients(data);
        setFilteredPatients(data);
      }

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

  const calculateAge = (dobString: string) => {
    if (!dobString) return "N/A";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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

      <main className="flex-1 p-8 ml-64 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Patients Directory</h2>
            <p className="text-slate-500 mt-1">View clinic-wide registered patients list</p>
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

        {/* Patients View Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Patients Directory</h3>
              <p className="text-slate-500 text-xs mt-0.5">Total patients registered in clinic database.</p>
            </div>

            {/* Search patients */}
            <div className="flex gap-2">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by Name, Email, NIC..."
                  value={patientSearchQuery}
                  onChange={(e) => {
                    setPatientSearchQuery(e.target.value);
                    if (e.target.value === "") {
                      setFilteredPatients(patients);
                    }
                  }}
                  className="pl-10 pr-4 py-2 w-64 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <button
                onClick={() => {
                  const query = patientSearchQuery.toLowerCase().trim();
                  if (!query) {
                    setFilteredPatients(patients);
                  } else {
                    const filtered = patients.filter(p => 
                      p.name.toLowerCase().includes(query) ||
                      p.email.toLowerCase().includes(query) ||
                      p.nic?.toLowerCase().includes(query)
                    );
                    setFilteredPatients(filtered);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition shadow-sm cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4 pl-0">Patient Name</th>
                  <th className="p-4">Age</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">NIC</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No patients found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/55 transition border-b border-slate-100/50">
                      <td className="p-4 pl-0 font-bold text-slate-900">{p.name}</td>
                      <td className="p-4">{calculateAge(p.dob)} yrs</td>
                      <td className="p-4 uppercase text-xs">{p.gender}</td>
                      <td className="p-4 text-xs font-mono">{p.nic || 'N/A'}</td>
                      <td className="p-4">{p.phoneNumber}</td>
                      <td className="p-4 text-xs text-slate-500">{p.email}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedPatient(p);
                            setIsDetailsOpen(true);
                          }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Patient Details check-in style modal */}
      <PatientDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />
    </div>
  );
}
