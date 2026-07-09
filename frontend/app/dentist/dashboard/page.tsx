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

interface Patient {
  _id: string;
  name: string;
  dob: string;
  gender: string;
  phoneNumber: string;
  email: string;
  nic: string;
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

export default function DentistDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Dynamic API state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showOnlyToday, setShowOnlyToday] = useState(true);
  
  // Search state for patients
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Modals state
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

  // Form states for reschedule
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("09:00 AM");

  // Form states for new appointment
  const [newApptPatientId, setNewApptPatientId] = useState("");
  const [newApptDate, setNewApptDate] = useState("");
  const [newApptTime, setNewApptTime] = useState("09:00 AM");
  const [newApptTreatment, setNewApptTreatment] = useState("Regular Checkup");
  const [newApptNotes, setNewApptNotes] = useState("");

  // Cancel Handler
  const handleCancelAppointment = async (apptId: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/appointments/${apptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Cancelled' })
      });

      if (res.ok) {
        alert("Appointment cancelled successfully.");
        fetchData(user?.id || "");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to cancel appointment.");
      }
    } catch (error) {
      console.error("Cancel appointment error:", error);
      alert("Network error cancelling appointment.");
    }
  };

  // Reschedule Submit Handler
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/appointments/${selectedAppt._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: rescheduleDate,
          time: rescheduleTime
        })
      });

      if (res.ok) {
        alert("Appointment rescheduled successfully!");
        setIsRescheduleOpen(false);
        setSelectedAppt(null);
        fetchData(user?.id || "");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to reschedule appointment.");
      }
    } catch (error) {
      console.error("Reschedule error:", error);
      alert("Network error rescheduling appointment.");
    }
  };

  // New Appointment Submit Handler
  const handleNewAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApptPatientId || !newApptDate || !newApptTime || !newApptTreatment) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: newApptPatientId,
          dentistId: user?.id,
          treatment: newApptTreatment,
          date: newApptDate,
          time: newApptTime,
          notes: newApptNotes,
          status: 'Scheduled'
        })
      });

      if (res.ok) {
        alert("Appointment scheduled successfully!");
        setIsNewAppointmentOpen(false);
        setNewApptPatientId("");
        setNewApptDate("");
        setNewApptTime("09:00 AM");
        setNewApptTreatment("Regular Checkup");
        setNewApptNotes("");
        fetchData(user?.id || "");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to schedule appointment.");
      }
    } catch (error) {
      console.error("New appointment booking error:", error);
      alert("Network error scheduling appointment.");
    }
  };

  const fetchData = async (dentistId: string) => {
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
        setFilteredPatients(data);
      }
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
          // If not dentist, redirect to admin dashboard (system_admin or assistant)
          router.push("/admin/dashboard");
          return;
        }
        setUser(parsedUser);
        fetchData(parsedUser.id);
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
    window.location.href = "/";
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return 'N/A';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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

  const dentistAppointments = appointments.filter(appt => {
    const dentistId = typeof appt.dentist === 'string' ? appt.dentist : appt.dentist?._id;
    return dentistId === user?.id;
  });

  const todayStr = new Date().toDateString();
  const todayAppointmentsList = dentistAppointments.filter(appt => {
    return new Date(appt.date).toDateString() === todayStr;
  });

  const appointmentsToRender = showOnlyToday ? todayAppointmentsList : dentistAppointments;

  // Stats computation
  const todaysPatientsCount = todayAppointmentsList.length;
  const completedTodayCount = todayAppointmentsList.filter(appt => appt.status === 'Completed').length;
  const upcomingToday = todayAppointmentsList
    .filter(appt => appt.status !== 'Completed' && appt.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));
  const nextApptTime = upcomingToday.length > 0 ? upcomingToday[0].time : "No more today";
  const totalTreatmentsCount = dentistAppointments.filter(appt => appt.status === 'Completed').length;

  const stats = [
    { label: "Today's Patients", val: todaysPatientsCount, icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Completed Today", val: completedTodayCount, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "Next Appointment", val: nextApptTime, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { label: "Total Treatments Done", val: totalTreatmentsCount, icon: Activity, color: "text-purple-600 bg-purple-50 border-purple-100" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col px-6 py-8 fixed h-screen">
        <div className="text-2xl font-black text-blue-800 mb-10 px-2 flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">D+</div> Dentplus
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
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
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
            <button
              onClick={() => setIsNewAppointmentOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer text-sm"
            >
              <Calendar size={16} /> New Appointment
            </button>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search patients, records..."
                className="pl-11 pr-4 py-2.5 w-72 rounded-full border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-11 h-11 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center shadow">
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
                  <h3 className="text-xl font-bold text-slate-900">
                    {showOnlyToday ? "Today's Appointment Queue" : "All Assigned Appointments"}
                  </h3>
                  <button
                    onClick={() => setShowOnlyToday(!showOnlyToday)}
                    className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-100 transition cursor-pointer"
                  >
                    {showOnlyToday ? "Show Other Days" : "Show Today Only"}
                  </button>
                </div>

                <div className="space-y-4">
                  {appointmentsToRender.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm font-medium">
                      No appointments scheduled.
                    </div>
                  ) : (
                    appointmentsToRender.map((appt) => (
                      <div 
                        key={appt._id} 
                        className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center">
                            {appt.patient?.name ? appt.patient.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{appt.patient?.name || 'Unknown Patient'}</h4>
                            <p className="text-xs text-slate-500 font-medium">{appt.treatment}</p>
                            {!showOnlyToday && (
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                Date: {new Date(appt.date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right min-w-[90px]">
                            <span className="font-bold text-blue-700 text-sm block">{appt.time}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              appt.status === "Completed" ? "bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider" :
                              appt.status === "Scheduled" ? "bg-blue-50 text-blue-700 font-bold uppercase tracking-wider" :
                              appt.status === "Cancelled" ? "bg-red-50 text-red-700 font-bold uppercase tracking-wider" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {appt.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedAppt(appt);
                                setIsDetailsOpen(true);
                              }}
                              className="px-2.5 py-1.5 text-xs bg-white border hover:bg-blue-50 border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 transition font-semibold cursor-pointer"
                            >
                              Details
                            </button>
                            
                            {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedAppt(appt);
                                    const apptDate = new Date(appt.date);
                                    const formattedDate = apptDate.toISOString().substring(0, 10);
                                    setRescheduleDate(formattedDate);
                                    setRescheduleTime(appt.time);
                                    setIsRescheduleOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 text-xs bg-white border hover:bg-amber-50 border-slate-200 rounded-lg text-slate-600 hover:text-amber-600 transition font-semibold cursor-pointer"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancelAppointment(appt._id)}
                                  className="px-2.5 py-1.5 text-xs bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-red-600 transition font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions & Notes */}
              <div className="space-y-8">
                {/* Dentist Tools */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2">
                      <Stethoscope size={16} /> Start Dental Exam
                    </button>
                    <button className="w-full bg-white border hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2">
                      <ClipboardList size={16} /> Write Prescription
                    </button>
                  </div>
                </div>

                {/* Treatment Notes Reminder */}
                <div className="bg-blue-950 text-blue-100 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                    <Stethoscope size={150} />
                  </div>
                  <h4 className="font-bold text-white text-lg mb-2">Did you know?</h4>
                  <p className="text-sm leading-relaxed text-blue-200">
                    Entering clinical and post-op care notes within 1 hour of treatment improves patient compliance by 40% when integrated with automatic SMS instructions.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "patients" && (
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
                        p.nic.toLowerCase().includes(query)
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No patients found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/55 transition">
                        <td className="p-4 pl-0 font-bold text-slate-900">{p.name}</td>
                        <td className="p-4">{calculateAge(p.dob)} yrs</td>
                        <td className="p-4 uppercase text-xs">{p.gender}</td>
                        <td className="p-4 text-xs font-mono">{p.nic}</td>
                        <td className="p-4">{p.phoneNumber}</td>
                        <td className="p-4 text-xs text-slate-500">{p.email}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab !== "dashboard" && activeTab !== "patients" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <Stethoscope className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-900 mb-1">{activeTab.toUpperCase()} Section</h3>
            <p className="text-slate-500 text-sm">This component is under development in this phase.</p>
          </div>
        )}
      </main>

      {/* View Details Modal */}
      {isDetailsOpen && selectedAppt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment Details</h2>
            <p className="text-slate-500 text-sm mb-6">Full summary of the booked treatment session.</p>

            <div className="space-y-4 text-sm text-slate-700 font-medium">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-400 font-normal">Patient Name:</span>
                <span className="text-slate-900 font-bold">{selectedAppt.patient?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-400 font-normal">Patient Email:</span>
                <span className="text-slate-900">{selectedAppt.patient?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-400 font-normal">Phone Number:</span>
                <span className="text-slate-900">{selectedAppt.patient?.phoneNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-400 font-normal">Treatment / Service:</span>
                <span className="text-blue-700 font-bold">{selectedAppt.treatment}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-400 font-normal">Date:</span>
                <span className="text-slate-900">{new Date(selectedAppt.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-400 font-normal">Time Slot:</span>
                <span className="text-slate-900">{selectedAppt.time}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-400 font-normal">Status:</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  selectedAppt.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                  selectedAppt.status === "Scheduled" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                  selectedAppt.status === "Cancelled" ? "bg-red-50 text-red-700 border border-red-100" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {selectedAppt.status}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsDetailsOpen(false);
                setSelectedAppt(null);
              }}
              className="w-full mt-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleOpen && selectedAppt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Reschedule Appointment</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">Choose a new date and time for the treatment.</p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-sm font-bold mb-1.5">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-bold mb-1.5">New Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  required
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:45 AM">10:45 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:15 PM">01:15 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsRescheduleOpen(false);
                    setSelectedAppt(null);
                  }}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-100 cursor-pointer text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {isNewAppointmentOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Book Appointment</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">Schedule a new dental visit for a patient.</p>

            <form onSubmit={handleNewAppointmentSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-sm font-bold mb-1.5">Select Patient</label>
                <select
                  value={newApptPatientId}
                  onChange={(e) => setNewApptPatientId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-bold mb-1.5">Date</label>
                <input
                  type="date"
                  value={newApptDate}
                  onChange={(e) => setNewApptDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-bold mb-1.5">Time Slot</label>
                <select
                  value={newApptTime}
                  onChange={(e) => setNewApptTime(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  required
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:45 AM">10:45 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:15 PM">01:15 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-bold mb-1.5">Treatment / Service</label>
                <select
                  value={newApptTreatment}
                  onChange={(e) => setNewApptTreatment(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  required
                >
                  <option value="Regular Checkup">Regular Checkup</option>
                  <option value="Teeth Cleaning">Teeth Cleaning</option>
                  <option value="Dental Consultation">Dental Consultation</option>
                  <option value="Root Canal">Root Canal</option>
                  <option value="Tooth Extraction">Tooth Extraction</option>
                  <option value="Dental Filling">Dental Filling</option>
                  <option value="Braces Adjustment">Braces Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-bold mb-1.5">Notes (Optional)</label>
                <textarea
                  placeholder="Clinical notes or description..."
                  value={newApptNotes}
                  onChange={(e) => setNewApptNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium h-20"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setIsNewAppointmentOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-100 cursor-pointer text-sm"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
