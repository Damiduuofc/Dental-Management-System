"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  X,
  CheckCircle2,
  Search,
  Plus
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

export default function PatientAppointments() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [bookingForm, setBookingForm] = useState({
    dentistId: '',
    treatment: 'Consultation',
    date: '',
    time: '',
    notes: ''
  });

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
            <div className="hidden sm:block">
              <p className="font-semibold text-sm text-slate-800">{patient?.name || "Loading..."}</p>
              <p className="text-[11px] text-slate-500 font-bold uppercase">Patient</p>
            </div>
          </div>
        </header>

        {/* My Appointments list view */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">My Appointments</h3>
              <p className="text-slate-500 text-sm">Full history and booking controls</p>
            </div>
            <button 
              onClick={() => setIsBookingOpen(true)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-blue-700 transition cursor-pointer"
            >
              <Plus size={16} /> Book Appointment
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border text-center text-slate-500 font-medium shadow-sm">
              No appointments booked yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appointments.map((appt) => {
                const formattedDate = new Date(appt.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                return (
                  <div key={appt._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <img
                          src={`https://ui-avatars.com/api/?name=${appt.dentist?.fullName || "Doctor"}&background=0ea5e9&color=fff`}
                          className="w-12 h-12 rounded-full shadow"
                          alt="Doctor Avatar"
                        />
                        <div>
                          <h3 className="font-bold text-slate-800">Dr. {appt.dentist?.fullName || "General Dentist"}</h3>
                          <p className="text-sm font-semibold text-blue-600">{appt.treatment}</p>
                        </div>
                      </div>
                      {getStatusBadge(appt.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl mb-4 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" /> {appt.time}
                      </div>
                      <div>
                        Date: {formattedDate}
                      </div>
                    </div>
                    
                    {appt.notes && (
                      <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 mb-4 font-medium italic border border-dashed">
                        "{appt.notes}"
                      </div>
                    )}

                    {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleCancelAppointment(appt._id)}
                          className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
    </div>
  );
}
