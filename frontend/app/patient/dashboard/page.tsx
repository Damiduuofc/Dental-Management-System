"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock,
  FileText,
  X,
  CheckCircle2,
  Bell,
  Search,
  Plus,
  CreditCard,
  Activity,
  Film
} from "lucide-react";
import PatientSidebar from "@/components/patient/Sidebar";
import ProfileDropdown from "@/components/ProfileDropdown";

interface Appointment {
  _id: string;
  treatment: string;
  dentist: {
    _id: string;
    fullName: string;
  };
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Scheduled' | 'Arrived' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
  allergies?: string;
  complains?: string;
  onExamination?: string;
  treatmentPlan?: string;
  treatmentDone?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'booking' | 'reschedule' | 'cancel' | 'billing' | 'general';
  read: boolean;
  createdAt: string;
}

const treatments = ['Regular Checkup', 'Root Canal', 'Consultation', 'Orthodontics', 'Teeth Cleaning', 'Teeth Whitening'];
const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:30 PM', '03:30 PM'];

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSlotInPast = (selectedDateStr: string, slotStr: string): boolean => {
  if (!selectedDateStr) return false;
  const todayStr = getTodayString();
  if (selectedDateStr < todayStr) return true;
  if (selectedDateStr > todayStr) return false;

  const now = new Date();
  const parts = slotStr.trim().split(' ');
  if (parts.length < 2) return false;
  const timePart = parts[0];
  const modifier = parts[1];
  let [hours, minutes] = timePart.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const slotDate = new Date();
  slotDate.setHours(hours, minutes, 0, 0);

  return slotDate.getTime() <= now.getTime();
};

export default function PatientDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isMedicalRecordsOpen, setIsMedicalRecordsOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [bookingForm, setBookingForm] = useState({
    dentistId: '',
    treatment: 'Consultation',
    date: '',
    time: '',
    notes: ''
  });

  const calculateAge = (dobString: string) => {
    if (!dobString) return "";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} years` : "";
  };

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

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009"}/api/patient/appointments`, {
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json" 
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
    }
  };

  const fetchDentists = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009"}/api/patient/dentists`, {
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json" 
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDentists(data);
      }
    } catch (error) {
      console.error("Error loading dentists:", error);
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

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!bookingForm.dentistId || !bookingForm.date) {
        setBookedSlots([]);
        return;
      }
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009"}/api/patient/appointments/booked-slots?dentistId=${bookingForm.dentistId}&date=${bookingForm.date}`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json"
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setBookedSlots(data);
        }
      } catch (err) {
        console.error("Error fetching booked slots:", err);
      }
    };

    fetchBookedSlots();
  }, [bookingForm.dentistId, bookingForm.date]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }
      setIsAuthorized(true);
      fetchPatientData();
      fetchAppointments();
      fetchDentists();
      fetchNotifications();
    }
  }, []);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const handleCancelAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009"}/api/patient/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json" 
        }
      });
      if (response.ok) {
        alert("Appointment cancelled successfully.");
        fetchAppointments();
        fetchNotifications();
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to cancel appointment.");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Network error.");
    }
  };

  const handleBookAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = getTodayString();
    if (bookingForm.date && bookingForm.date < todayStr) {
      alert("Cannot select a past date.");
      return;
    }
    if (isSlotInPast(bookingForm.date, bookingForm.time)) {
      alert("Cannot select a past time slot.");
      return;
    }
    if (!bookingForm.dentistId || !bookingForm.date || !bookingForm.time) {
      alert("Please fill in all required fields.");
      return;
    }
    setBookingLoading(true);
    try {
      const payload = {
        ...bookingForm,
        treatment: bookingForm.treatment || 'Consultation'
      };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009"}/api/patient/appointments`, {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert("Appointment booked successfully! PDF Receipt confirmation has been emailed.");
        setIsBookingOpen(false);
        setBookingForm({ dentistId: '', treatment: 'Consultation', date: '', time: '', notes: '' });
        fetchAppointments();
        fetchNotifications();
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to book appointment.");
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    } finally {
      setBookingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <span className="flex items-center gap-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider h-fit"><CheckCircle2 size={14} /> Confirmed</span>;
      case 'Scheduled':
        return <span className="flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider h-fit"><Clock size={14} /> Scheduled</span>;
      case 'Arrived':
        return <span className="flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider h-fit"><CheckCircle2 size={14} /> Arrived</span>;
      case 'Cancelled':
        return <span className="flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider h-fit"><X size={14} /> Cancelled</span>;
      case 'Completed':
        return <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider h-fit"><CheckCircle2 size={14} /> Completed</span>;
      default:
        return <span className="flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider h-fit"><Clock size={14} /> Pending</span>;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <CalendarDays className="text-blue-600" size={18} />;
      case 'cancel':
        return <X className="text-red-600" size={18} />;
      case 'reschedule':
        return <Clock className="text-yellow-600" size={18} />;
      case 'billing':
        return <CreditCardIcon className="text-green-600" size={18} />;
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
              placeholder="Search appointments, doctor..."
              className="pl-11 w-72 rounded-full border border-slate-200 bg-white py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <ProfileDropdown user={patient ? { ...patient, role: 'patient' } : null} />
          </div>
        </header>

        {/* Overview dashboard */}
        <div>
          {/* Hero Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div 
              onClick={() => setIsBookingOpen(true)}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition duration-200 cursor-pointer"
            >
              <CalendarDays className="mb-5 text-blue-600" size={32} />
              <h3 className="text-lg font-bold text-slate-800">Book Appointment</h3>
              <p className="text-slate-500 mt-1.5 text-xs font-semibold">Schedule your next dental visit.</p>
            </div>
            <div 
              onClick={() => router.push("/patient/treatments")}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition duration-200 cursor-pointer group"
            >
              <Activity className="mb-5 text-teal-600 group-hover:scale-110 transition" size={32} />
              <h3 className="text-lg font-bold text-slate-800">Treatment Plans</h3>
              <p className="text-slate-500 mt-1.5 text-xs font-semibold">Track your active plans & procedures.</p>
            </div>
            <div 
              onClick={() => router.push("/patient/x-rays")}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition duration-200 cursor-pointer group"
            >
              <Film className="mb-5 text-violet-600 group-hover:scale-110 transition" size={32} />
              <h3 className="text-lg font-bold text-slate-800">X-Rays & Scans</h3>
              <p className="text-slate-500 mt-1.5 text-xs font-semibold">View dental radiographs & findings.</p>
            </div>
            <div 
              onClick={() => setIsMedicalRecordsOpen(true)}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition duration-200 cursor-pointer"
            >
              <FileText className="mb-5 text-indigo-600" size={32} />
              <h3 className="text-lg font-bold text-slate-800">Medical Records</h3>
              <p className="text-slate-500 mt-1.5 text-xs font-semibold">Access past notes and allergies.</p>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Upcoming Appointments</h3>
                <button 
                  onClick={() => router.push("/patient/appointments")} 
                  className="text-blue-600 text-sm font-semibold hover:underline"
                >
                  View All
                </button>
              </div>
              
              {appointments.filter(a => a.status !== 'Cancelled' && a.status !== 'Completed').length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border text-center text-slate-500 font-medium shadow-sm">
                  No upcoming appointments. Click "Book Appointment" to schedule one.
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.filter(a => a.status !== 'Cancelled' && a.status !== 'Completed').slice(0, 2).map((appt) => {
                    const formattedDate = new Date(appt.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });

                    return (
                      <div key={appt._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition duration-200">
                        <div className="flex justify-between flex-wrap gap-4">
                          <div className="flex gap-4">
                            <img
                              src={`https://ui-avatars.com/api/?name=${appt.dentist?.fullName || "Doctor"}&background=0ea5e9&color=fff`}
                              className="w-12 h-12 rounded-full shadow-inner"
                              alt="Doctor Avatar"
                            />
                            <div>
                              <h3 className="font-bold text-slate-800">Dr. {appt.dentist?.fullName || "General Dentist"}</h3>
                              <p className="text-slate-500 text-sm font-semibold text-blue-600">{appt.treatment}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
                                <Clock size={14} />
                                {formattedDate} • {appt.time}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(appt.status)}
                        </div>
                        
                        {appt.notes && (
                          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-dashed border-slate-200">
                            <span className="font-bold text-slate-700 block mb-0.5">My Notes:</span>
                            {appt.notes}
                          </div>
                        )}

                        <div className="mt-6 flex gap-3">
                          <button 
                            onClick={() => handleCancelAppointment(appt._id)}
                            className="rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold px-4 py-2 text-xs hover:bg-red-600 hover:text-white transition cursor-pointer"
                          >
                            Cancel Booking
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Side notifications column */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Recent Alerts</h3>
                <button 
                  onClick={() => router.push("/patient/notifications")} 
                  className="text-blue-600 text-sm font-semibold hover:underline"
                >
                  View All
                </button>
              </div>
              
              {notifications.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 border text-center text-slate-400 text-sm font-medium shadow-sm">
                  No recent alerts.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notif) => (
                    <div 
                      key={notif._id} 
                      className={`border rounded-2xl p-4 transition ${
                        notif.read ? "bg-white border-slate-100 shadow-sm" : "bg-blue-50 border-blue-100 shadow-sm"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">{notif.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 block mt-2 font-semibold">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Patient Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white w-[500px] max-h-[90vh] overflow-y-auto p-8 rounded-3xl shadow-2xl border">
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Book Appointment</h2>
            <p className="text-slate-500 mb-6 text-sm">Select doctor, date, and choose a time slot.</p>

            <form onSubmit={handleBookAppointmentSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Dentist *</label>
                <select 
                  value={bookingForm.dentistId}
                  onChange={(e) => setBookingForm({ ...bookingForm, dentistId: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                >
                  <option value="">Choose Dentist</option>
                  {dentists.map(d => (
                    <option key={d._id} value={d._id}>Dr. {d.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
                <input 
                  type="date"
                  min={getTodayString()}
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Time Slot *</label>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map(slot => {
                    const isSelected = bookingForm.time === slot;
                    const isBooked = bookedSlots.includes(slot);
                    const isPast = isSlotInPast(bookingForm.date, slot);
                    const isDisabled = isBooked || isPast;

                    return (
                      <button
                        type="button"
                        key={slot}
                        disabled={isDisabled}
                        onClick={() => setBookingForm({ ...bookingForm, time: slot })}
                        className={`px-4 py-2.5 rounded-full text-xs font-bold border transition ${
                          isSelected 
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                            : isDisabled
                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Note (Optional)</label>
                <textarea 
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 h-24 font-medium transition resize-none" 
                  placeholder="Enter details/complaints..." 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg shadow-blue-100 disabled:opacity-50 cursor-pointer"
                >
                  {bookingLoading ? "Booking..." : "Book Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical Records Modal */}
      {isMedicalRecordsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsMedicalRecordsOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">My Medical & Clinical Records</h2>
            <p className="text-slate-500 text-sm mb-6 font-semibold">Historical list of dental check-in clinical notes, complaints, and completed treatments.</p>

            {appointments.filter(appt => appt.complains || appt.onExamination || appt.treatmentPlan || appt.treatmentDone || appt.allergies).length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium text-sm border rounded-2xl bg-slate-50">
                No clinical medical records found.
              </div>
            ) : (
              <div className="space-y-4">
                {appointments
                  .filter(appt => appt.complains || appt.onExamination || appt.treatmentPlan || appt.treatmentDone || appt.allergies)
                  .map((appt) => {
                    const formattedDate = new Date(appt.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    return (
                      <div key={appt._id} className="border border-slate-150 p-5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                          <div>
                            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">{appt.treatment}</span>
                            <span className="block text-slate-900 font-bold text-sm mt-0.5">{formattedDate} • {appt.time}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                            Dr. {appt.dentist?.fullName || "General Dentist"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {appt.onExamination && (
                            <div>
                              <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">On Examination Findings</span>
                              <p className="text-slate-700 mt-0.5 font-medium">{appt.onExamination}</p>
                            </div>
                          )}
                          {appt.treatmentPlan && (
                            <div>
                              <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Proposed Treatment Plan</span>
                              <p className="text-slate-700 mt-0.5 font-medium">{appt.treatmentPlan}</p>
                            </div>
                          )}
                          {appt.treatmentDone && (
                            <div>
                              <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Treatment Done</span>
                              <p className="text-slate-700 mt-0.5 font-medium">{appt.treatmentDone}</p>
                            </div>
                          )}
                          {appt.allergies && (
                            <div className="sm:col-span-2">
                              <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Allergies & Medical Warnings</span>
                              <p className="text-amber-850 mt-0.5 font-semibold bg-amber-50 border border-amber-100/50 px-2.5 py-1 rounded-xl w-fit">{appt.allergies}</p>
                            </div>
                          )}
                          {appt.notes && (
                            <div className="sm:col-span-2 border-t border-slate-100 pt-2 mt-1">
                              <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Clinical Notes</span>
                              <p className="text-slate-600 mt-0.5 font-medium italic">"{appt.notes}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <button
              onClick={() => setIsMedicalRecordsOpen(false)}
              className="w-full mt-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Small custom Icon wrapper for CreditCard to avoid duplicate names in imports
function CreditCardIcon(props: any) {
  return <CreditCard {...props} />;
}