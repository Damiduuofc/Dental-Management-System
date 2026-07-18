'use client';

import React, { useState, useEffect } from 'react';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
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
  preselectedPatientId?: string;
  onSuccess?: () => void;
}

const treatments = ['Regular Checkup', 'Root Canal', 'Consultation', 'Orthodontics', 'Teeth Cleaning', 'Teeth Whitening'];
const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:30 PM', '03:30 PM'];

export default function AppointmentModal({ isOpen, onClose, appointment, preselectedPatientId, onSuccess }: AppointmentModalProps) {
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

  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDentist, setSelectedDentist] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState('Regular Checkup');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isExisting, setIsExisting] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState<Patient[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // New patient registration form states
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('');
  const [newPatientNic, setNewPatientNic] = useState('');
  const [newPatientAddress, setNewPatientAddress] = useState('');
  const [newPatientAllergies, setNewPatientAllergies] = useState('');

  // Clear time selection if dentist or date changes
  useEffect(() => {
    if (appointment) {
      const origDate = new Date(appointment.date).toISOString().split('T')[0];
      if (selectedDentist !== appointment.dentist?._id || date !== origDate) {
        setTime('');
      }
    } else {
      setTime('');
    }
  }, [selectedDentist, date, appointment]);

  useEffect(() => {
    if (!selectedDentist || !date) {
      setBookedSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/patient/appointments/booked-slots?dentistId=${selectedDentist}&date=${date}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          // If we are editing an appointment, we should exclude its own time slot from being marked as booked
          if (appointment) {
            const origDate = new Date(appointment.date).toISOString().split('T')[0];
            if (selectedDentist === appointment.dentist?._id && date === origDate) {
              const filteredData = data.filter((slot: string) => slot !== appointment.time);
              setBookedSlots(filteredData);
              return;
            }
          }
          setBookedSlots(data);
        }
      } catch (err) {
        console.error("Error fetching booked slots:", err);
      }
    };

    fetchBookedSlots();
  }, [selectedDentist, date, appointment]);

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
      setIsExisting(true);
      setSearchPhone('');
      setSearchResult([]);
      setHasSearched(false);
      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientEmail('');
      setNewPatientDob('');
      setNewPatientGender('');
      setNewPatientNic('');
      setNewPatientAddress('');
      setNewPatientAllergies('');
    } else {
      setSelectedPatient(preselectedPatientId || '');
      setSelectedDentist('');
      setSelectedTreatment('Regular Checkup');
      setDate('');
      setTime('');
      setNotes('');
      setIsExisting(true);
      setSearchPhone('');
      setSearchResult([]);
      setHasSearched(false);
      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientEmail('');
      setNewPatientDob('');
      setNewPatientGender('');
      setNewPatientNic('');
      setNewPatientAddress('');
      setNewPatientAllergies('');
    }
  }, [isOpen, appointment, preselectedPatientId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDentist || !selectedTreatment || !date || !time) {
      alert("Please fill in all required appointment fields.");
      return;
    }

    let patientId = selectedPatient;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // If booking for a new patient, register them first!
      if (!appointment && !isExisting) {
        if (!newPatientName || !newPatientPhone || !newPatientEmail || !newPatientDob || !newPatientGender || !newPatientNic || !newPatientAddress) {
          alert("Please fill in all new patient fields.");
          setLoading(false);
          return;
        }

        const patientRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/patients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newPatientName,
            email: newPatientEmail,
            phoneNumber: newPatientPhone,
            dob: newPatientDob,
            gender: newPatientGender,
            nic: newPatientNic,
            homeAddress: newPatientAddress,
            allergies: newPatientAllergies
          })
        });

        if (!patientRes.ok) {
          const errData = await patientRes.json();
          throw new Error(errData.message || "Failed to register new patient.");
        }

        const patientData = await patientRes.json();
        patientId = patientData.patient._id;
      } else if (!appointment && isExisting && !patientId) {
        alert("Please select or search for an existing patient.");
        setLoading(false);
        return;
      }

      // Now create the appointment
      const url = appointment
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/appointments/${appointment._id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/appointments`;
      
      const method = appointment ? 'PUT' : 'POST';
      const body = appointment 
        ? { dentistId: selectedDentist, treatment: selectedTreatment, date, time, notes }
        : { patientId, dentistId: selectedDentist, treatment: selectedTreatment, date, time, notes };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(appointment ? "Appointment updated successfully!" : "Patient registered and appointment scheduled successfully!");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to save appointment.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Network error.");
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
          {!appointment && (
            <div className="flex items-center gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-2">
              <input 
                type="checkbox"
                id="existingPatientCheckbox"
                checked={isExisting}
                onChange={(e) => {
                  setIsExisting(e.target.checked);
                  setSelectedPatient('');
                  setSearchResult([]);
                  setHasSearched(false);
                }}
                className="w-4 h-4 text-blue-600 border-slate-350 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="existingPatientCheckbox" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                Existing Patient?
              </label>
            </div>
          )}

          <div>
            {appointment ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Patient *</label>
                <select 
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  disabled
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed font-medium transition"
                >
                  <option value="">Select Patient</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>
            ) : isExisting ? (
              <div className="space-y-4">
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Enter Contact Number to Search *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search phone number..."
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="flex-1 p-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-medium transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!searchPhone.trim()) {
                          alert("Please enter a phone number.");
                          return;
                        }
                        const query = searchPhone.trim().toLowerCase();
                        const matches = patients.filter(p => p.phoneNumber && p.phoneNumber.toLowerCase().includes(query));
                        setSearchResult(matches);
                        setHasSearched(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition text-sm cursor-pointer shadow shadow-blue-100"
                    >
                      Search
                    </button>
                  </div>

                  {hasSearched && (
                    <div className="mt-3 space-y-2">
                      {searchResult.length === 0 ? (
                        <p className="text-xs text-rose-500 font-semibold">No registered patients found with this phone number.</p>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Select Registered Patient:</p>
                          <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
                            {searchResult.map(p => (
                              <button
                                type="button"
                                key={p._id}
                                onClick={() => setSelectedPatient(p._id)}
                                className={`w-full text-left p-3 rounded-xl border text-sm font-semibold transition cursor-pointer flex justify-between items-center ${
                                  selectedPatient === p._id
                                    ? "bg-blue-50 border-blue-500 text-blue-700"
                                    : "bg-white border-slate-100 hover:bg-slate-100 text-slate-700"
                                }`}
                              >
                                <div>
                                  <p className="font-bold text-slate-800">{p.name}</p>
                                  <p className="text-xs text-slate-400 font-medium mt-0.5">{p.email} • {p.phoneNumber}</p>
                                </div>
                                {selectedPatient === p._id && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">Selected</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">New Patient Registration Details</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      placeholder="Enter phone number"
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={newPatientEmail}
                      onChange={(e) => setNewPatientEmail(e.target.value)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-600">Date of Birth *</label>
                      {newPatientDob && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                          Age: {calculateAge(newPatientDob)}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={newPatientDob}
                      onChange={(e) => setNewPatientDob(e.target.value)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Gender *</label>
                    <select
                      value={newPatientGender}
                      onChange={(e) => setNewPatientGender(e.target.value)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">NIC Number *</label>
                    <input
                      type="text"
                      placeholder="NIC number"
                      value={newPatientNic}
                      onChange={(e) => setNewPatientNic(e.target.value)}
                      className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Home Address *</label>
                  <input
                    type="text"
                    placeholder="Enter home address"
                    value={newPatientAddress}
                    onChange={(e) => setNewPatientAddress(e.target.value)}
                    className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Allergies (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter drug or food allergies"
                    value={newPatientAllergies}
                    onChange={(e) => setNewPatientAllergies(e.target.value)}
                    className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>
            )}
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
                const isBooked = bookedSlots.includes(slot);
                return (
                  <button 
                    type="button"
                    key={slot} 
                    disabled={isBooked}
                    onClick={() => setTime(slot)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition ${
                      isSelected 
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                        : isBooked
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