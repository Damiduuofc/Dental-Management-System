"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DentistSidebar from "@/components/dentist/Sidebar";
import PatientDetailsModal from "@/components/PatientDetailsModal";
import { 
  Calendar, 
  Search, 
  Bell,
  X,
  Clock,
  ClipboardList
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
    allergies?: string;
  } | null;
  dentist: {
    _id: string;
    name: string;
  } | string | null;
  date: string;
  time: string;
  treatment: string;
  status: string;
  notes?: string;
  allergies?: string;
  complains?: string;
  onExamination?: string;
  treatmentPlan?: string;
  treatmentDone?: string;
}

export default function DentistAppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // States specific to Appointments
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Reschedule states
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("09:00 AM");

  // New Appointment states
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
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

  const getLocalDateString = (utcDateStr: string) => {
    if (!utcDateStr) return '';
    return new Date(utcDateStr).toISOString().substring(0, 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const dentistAppointments = appointments.filter(appt => {
    const dId = typeof appt.dentist === 'string' ? appt.dentist : appt.dentist?._id;
    return dId === user?.id;
  });

  const filteredDentistAppointments = dentistAppointments.filter(appt => {
    if (!filterDate) return true;
    return getLocalDateString(appt.date) === filterDate;
  });

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
            <h2 className="text-3xl font-black text-slate-900">Appointments Schedule</h2>
            <p className="text-slate-500 mt-1">Manage and reschedule patient bookings</p>
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

        {/* Schedule Listing View */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Appointments Schedule</h3>
              <p className="text-slate-500 text-xs mt-0.5">Filter and manage your assigned appointments.</p>
            </div>

            {/* Date Filter Picker */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-500">Select Date:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-700 bg-slate-55 bg-slate-50"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition cursor-pointer border border-red-100"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold">
                  <th className="p-4 pl-0">Time</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Treatment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDentistAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-medium text-sm">
                      No appointments found for the selected date.
                    </td>
                  </tr>
                ) : (
                  filteredDentistAppointments.map((appt) => {
                    return (
                      <tr key={appt._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="p-4 pl-0 font-bold text-blue-700 text-sm">{appt.time}</td>
                        <td className="p-4 text-slate-600 text-sm">
                          {new Date(appt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 block">{appt.patient?.name || 'Unknown'}</span>
                            {(appt.allergies || appt.patient?.allergies) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-extrabold uppercase tracking-wider">
                                ⚠️ Allergy: {appt.allergies || appt.patient?.allergies}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">{appt.patient?.email}</span>
                        </td>
                        <td className="p-4 text-slate-600 text-sm font-medium">{appt.treatment}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                            appt.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            appt.status === "Scheduled" || appt.status === "Confirmed" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            appt.status === "Cancelled" ? "bg-red-50 text-red-700 border-red-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                const pId = typeof appt.patient === 'string' ? appt.patient : appt.patient?._id;
                                const fullPatient = patients.find(p => p._id === pId);
                                if (fullPatient) {
                                  setSelectedPatient(fullPatient);
                                  setIsDetailsOpen(true);
                                } else {
                                  alert("Patient details not found.");
                                }
                              }}
                              className="px-2.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-pointer"
                            >
                              Details
                            </button>
                            {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedAppt(appt);
                                    setRescheduleDate(getLocalDateString(appt.date));
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
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
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

      {/* Patient Details Check-In Style Modal */}
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
