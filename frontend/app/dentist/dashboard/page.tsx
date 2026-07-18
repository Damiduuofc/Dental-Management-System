"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DentistSidebar from "@/components/dentist/Sidebar";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Bell, 
  Search,
  Lock,
  LogOut,
  X
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

export default function DentistDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic API state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showOnlyToday, setShowOnlyToday] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

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

  const fetchData = async (dentistId: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { 'Authorization': `Bearer ${token}` };
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      // Fetch appointments
      const apptRes = await fetch(`${apiBase}/api/admin/appointments`, { headers });
      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(data);
      }

      // Fetch patients
      const patientRes = await fetch(`${apiBase}/api/admin/patients`, { headers });
      if (patientRes.ok) {
        const data = await patientRes.json();
        setPatients(data);
      }

      fetchNotifications();
    } catch (error) {
      console.error("Error loading dentist dashboard data:", error);
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
        fetchData(parsedUser.id);
        setLoading(false);
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/login");
      }
    }
  }, [router]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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

  const dentistAppointments = appointments.filter(appt => {
    const dId = typeof appt.dentist === 'string' ? appt.dentist : appt.dentist?._id;
    return dId === user?.id;
  });

  const todayStr = new Date().toDateString();
  const todayAppointmentsList = dentistAppointments.filter(appt => {
    return new Date(appt.date).toDateString() === todayStr;
  });

  const appointmentsToRender = showOnlyToday ? todayAppointmentsList : dentistAppointments;

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
      <DentistSidebar />

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
        <section className="space-y-8">
          {/* Daily Queue */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          appt.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-255 border-emerald-200" :
                          appt.status === "Scheduled" || appt.status === "Confirmed" ? "bg-blue-50 text-blue-700 border-blue-255 border-blue-200" :
                          appt.status === "Cancelled" ? "bg-red-50 text-red-700 border-red-255 border-red-200" :
                          "bg-amber-50 text-amber-700 border-amber-255 border-amber-200"
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
                        
                        {appt.status === 'Completed' && (
                          <button
                            onClick={() => {
                              setNewApptPatientId(appt.patient?._id || "");
                              setIsNewAppointmentOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-xs bg-blue-50 border hover:bg-blue-600 hover:text-white border-blue-250 rounded-lg text-blue-600 transition font-semibold cursor-pointer"
                          >
                            New Appointment (Next Visit)
                          </button>
                        )}
                        
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
        </section>
      </main>

      {/* Reschedule Modal */}
      {isRescheduleOpen && selectedAppt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Reschedule Appointment</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">Select a new date and time slot for this session.</p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-sm font-bold mb-1.5">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-bold mb-1.5">New Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
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
                  onClick={() => setIsRescheduleOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-100 cursor-pointer text-sm"
                >
                  Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Session Modal */}
      {isNewAppointmentOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Book Appointment</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">Create a new treatment session appointment.</p>

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
                <label className="block text-slate-700 text-sm font-bold mb-1.5">Appointment Date</label>
                <input
                  type="date"
                  value={newApptDate}
                  onChange={(e) => setNewApptDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
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
                  "bg-amber-50 text-amber-700 border border-amber-100"
                }`}>{selectedAppt.status}</span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setIsDetailsOpen(false);
                  setSelectedAppt(null);
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
