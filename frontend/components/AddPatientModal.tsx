'use client';

import React, { useState, useEffect } from 'react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  patient?: any;
}

export default function AddPatientModal({ isOpen, onClose, onSuccess, patient }: AddPatientModalProps) {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [nic, setNic] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [allergies, setAllergies] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setName(patient.name || '');
      setDob(patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '');
      setGender(patient.gender || '');
      setPhoneNumber(patient.phoneNumber || '');
      setEmail(patient.email || '');
      setNic(patient.nic || '');
      setHomeAddress(patient.homeAddress || '');
      setAllergies(patient.allergies || '');
    } else {
      setName('');
      setDob('');
      setGender('');
      setPhoneNumber('');
      setEmail('');
      setNic('');
      setHomeAddress('');
      setAllergies('');
    }
  }, [isOpen, patient]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob || !gender || !phoneNumber || !email || !nic || !homeAddress) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const method = patient ? 'PUT' : 'POST';
      const url = patient 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/patients/${patient._id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/patients`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          phoneNumber,
          dob,
          gender,
          nic,
          homeAddress,
          allergies
        })
      });

      if (res.ok) {
        alert(patient ? "Patient details updated successfully!" : "Patient registered successfully! A welcome email with credentials has been sent.");
        if (!patient) {
          setName('');
          setDob('');
          setGender('');
          setPhoneNumber('');
          setEmail('');
          setNic('');
          setHomeAddress('');
          setAllergies('');
        }
        
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save patient record.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error saving patient.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] max-h-[90vh] overflow-y-auto p-8 rounded-3xl shadow-2xl border border-slate-100">
        <h2 className="text-2xl font-bold mb-1 text-slate-800">{patient ? "Edit Patient Details" : "Add New Patient"}</h2>
        <p className="text-slate-500 mb-6 text-sm">
          {patient ? "Modify patient details below." : "Create a new patient record and auto-generate credentials."}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input 
              type="text"
              placeholder="Enter patient full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label>
            <input 
              type="email"
              placeholder="Enter patient email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-slate-700">Date of Birth *</label>
                {dob && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                    Age: {calculateAge(dob)}
                  </span>
                )}
              </div>
              <input 
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
            <input 
              type="text"
              placeholder="Enter contact number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">NIC Number <span className="text-red-500">*</span></label>
            <input 
              type="text"
              placeholder="Enter national identity card number"
              value={nic}
              onChange={(e) => setNic(e.target.value)}
              className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Home Address <span className="text-red-500">*</span></label>
            <input 
              type="text"
              placeholder="Enter patient home address"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Allergies</label>
            <input 
              type="text"
              placeholder="Enter drug or food allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose} 
              className="flex-1 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg shadow-blue-100 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : patient ? "Save Changes" : "Save Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}