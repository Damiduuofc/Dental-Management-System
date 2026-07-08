'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Calendar, Clock, Check, X } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import AppointmentModal from '@/components/AppointmentModal';

interface PatientData {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
}

interface DentistData {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface Appointment {
  _id: string;
  patient: PatientData;
  dentist: DentistData;
  treatment: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
        setFilteredAppointments(data);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        router.push("/admin/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== "assistant" && parsedUser.role !== "system_admin") {
          router.push("/admin/login");
          return;
        }
        fetchAppointments();
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/admin/login");
      }
    }
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAppointments(appointments);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = appointments.filter(appt => 
        appt.patient?.name?.toLowerCase().includes(query) ||
        appt.dentist?.fullName?.toLowerCase().includes(query) ||
        appt.treatment?.toLowerCase().includes(query) ||
        appt.status?.toLowerCase().includes(query)
      );
      setFilteredAppointments(filtered);
    }
  }, [searchQuery, appointments]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAppointments();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating status");
    }
  };

  const handleEditClick = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setIsModalOpen(true);
  };

  const handleNewClick = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Completed': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 md:ml-64">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
            <p className="text-slate-500 mt-1">Manage schedules, patients, and bookings.</p>
          </div>
          <button 
            onClick={handleNewClick}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100 font-semibold cursor-pointer"
          >
            <Plus size={20} /> New Appointment
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8 shadow-sm rounded-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition placeholder:text-slate-400 font-medium" 
            placeholder="Search by Patient name, Doctor name, Treatment, or Status..." 
          />
        </div>

        {/* Grid */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center text-slate-500">
            No appointments found.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredAppointments.map((appt) => {
              const formattedDate = new Date(appt.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              return (
                <div key={appt._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {appt.patient?.name ? appt.patient.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'PT'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{appt.patient?.name || 'Unknown Patient'}</h3>
                        <p className="text-sm font-semibold text-blue-600">{appt.treatment}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border font-bold uppercase tracking-wider ${getStatusStyle(appt.status)}`}>
                      {appt.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl mb-5 text-sm text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-normal">Dentist:</span> {appt.dentist?.fullName || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-slate-400" /> {formattedDate}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-slate-400" /> {appt.time}
                    </div>
                  </div>

                  {appt.notes && (
                    <div className="mb-5 p-3 rounded-xl border border-dashed text-sm text-slate-500 bg-slate-50/50">
                      <span className="font-semibold text-slate-700 block mb-1">Notes:</span>
                      {appt.notes}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-end">
                    <button 
                      onClick={() => handleEditClick(appt)}
                      className="border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Reschedule
                    </button>
                    {appt.status !== 'Confirmed' && appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                      <button 
                        onClick={() => handleUpdateStatus(appt._id, 'Confirmed')}
                        className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={14} /> Confirm
                      </button>
                    )}
                    {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                      <button 
                        onClick={() => handleUpdateStatus(appt._id, 'Cancelled')}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1 cursor-pointer"
                      >
                        <X size={14} /> Cancel
                      </button>
                    )}
                    {appt.status === 'Confirmed' && (
                      <button 
                        onClick={() => handleUpdateStatus(appt._id, 'Completed')}
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={14} /> Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AppointmentModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(null);
          }} 
          appointment={selectedAppointment}
          onSuccess={fetchAppointments}
        />
      </main>
    </div>
  );
}