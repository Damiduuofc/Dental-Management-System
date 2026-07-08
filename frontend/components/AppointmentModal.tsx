'use client';

import React, { useState, useEffect } from 'react';

interface Patient {
  _id: string;
  name: string;
  email: string;
}

interface Staff {
  _id: string;
  fullName: string;
  role: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: any;
  onSuccess?: () => void;
}

const treatments = ['Regular Checkup', 'Root Canal', 'Consultation', 'Orthodontics', 'Teeth Cleaning', 'Teeth Whitening'];
const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:30 PM', '03:30 PM'];

export default function AppointmentModal({ isOpen, onClose, appointment, onSuccess }: AppointmentModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDentist, setSelectedDentist] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/patients`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        }
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    };

    const fetchDentists = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/staff`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const filteredDentists = data.filter((d: Staff) => d.role === 'dentist');
          setDentists(filteredDentists);
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
      }
    };

    fetchPatients();
    fetchDentists();

    if (appointment) {
      setSelectedPatient(appointment.patient?._id || '');
      setSelectedDentist(appointment.dentist?._id || '');
      setSelectedTreatment(appointment.treatment || '');
      if (appointment.date) {
        setDate(new Date(appointment.date).toISOString().split('T')[0]);
      }
      setTime(appointment.time || '');
      setNotes(appointment.notes || '');
    } else {
      setSelectedPatient('');
      setSelectedDentist('');
      setSelectedTreatment('');
      setDate('');
      setTime('');
      setNotes('');
    }
  }, [isOpen, appointment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDentist || !selectedTreatment || !date || !time) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = appointment
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/appointments/${appointment._id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/appointments`;
      
      const method = appointment ? 'PUT' : 'POST';
      const body = appointment 
        ? { dentistId: selectedDentist, treatment: selectedTreatment, date, time, notes }
        : { patientId: selectedPatient, dentistId: selectedDentist, treatment: selectedTreatment, date, time, notes };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(appointment ? "Appointment updated successfully!" : "Appointment scheduled successfully!");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to save appointment.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[550px] max-h-[90vh] overflow-y-auto p-8 rounded-3xl shadow-2xl border border-slate-100">
        <h2 className="text-2xl font-bold mb-2 text-slate-800">
          {appointment ? "Reschedule Appointment" : "New Appointment"}
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
          Fill in the details below to schedule or update the appointment.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Patient *</label>
            <select 
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              disabled={!!appointment}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed font-medium transition"
            >
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Dentist *</label>
            <select 
              value={selectedDentist}
              onChange={(e) => setSelectedDentist(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium transition"
            >
              <option value="">Select Doctor</option>
              {dentists.map(d => (
                <option key={d._id} value={d._id}>{d.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Treatment *</label>
            <select 
              value={selectedTreatment}
              onChange={(e) => setSelectedTreatment(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium transition"
            >
              <option value="">Select Treatment</option>
              {treatments.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium transition" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 font-semibold font-medium">Time Slot *</label>
            <div className="flex flex-wrap gap-2">
              {timeSlots.map(slot => {
                const isSelected = time === slot;
                return (
                  <button 
                    type="button"
                    key={slot} 
                    onClick={() => setTime(slot)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition ${
                      isSelected 
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 h-24 font-medium transition resize-none" 
              placeholder="Any details/complaints..." 
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose} 
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg shadow-blue-100 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : appointment ? "Reschedule" : "Confirm booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}