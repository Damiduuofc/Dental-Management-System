"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import PatientSidebar from "@/components/patient/Sidebar";

export default function PatientProfile() {
  const [patient, setPatient] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phoneNumber: "",
    nic: "",
    dob: "",
    gender: "",
    homeAddress: "",
    allergies: ""
  });

  const fetchPatientData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/patient/profile`, {
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }
      fetchPatientData();
    }
  }, []);

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

  const startEditing = () => {
    setEditForm({
      name: patient?.name || '',
      phoneNumber: patient?.phoneNumber || '',
      nic: patient?.nic || '',
      dob: patient?.dob ? new Date(patient.dob).toISOString().split('T')[0] : '',
      gender: patient?.gender || '',
      homeAddress: patient?.homeAddress || '',
      allergies: patient?.allergies || ''
    });
    setIsEditingProfile(true);
  };

  const handlePatientProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/patient/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });
      const data = await response.json();
      if (response.ok) {
        alert("Profile updated successfully!");
        setPatient(data);
        setIsEditingProfile(false);
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating profile.");
    } finally {
      setSavingProfile(false);
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
              placeholder="Search..."
              className="pl-11 w-72 rounded-full border border-slate-200 bg-white py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <img
              src={`https://ui-avatars.com/api/?name=${patient?.name || "User"}&background=2563eb&color=fff`}
              className="w-10 h-10 rounded-full shadow"
              alt="Patient Profile"
            />
            <div>
              <p className="font-semibold text-sm text-slate-800">{patient?.name || "Loading..."}</p>
              <p className="text-[11px] text-slate-500 font-bold uppercase">Patient</p>
            </div>
          </div>
        </header>

        {/* Profile page content */}
        <div className="space-y-6 max-w-3xl animate-fade-in">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">My Profile</h3>
            <p className="text-slate-500 text-sm font-semibold">Personal details and medical record identities</p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b pb-6">
              <img
                src={`https://ui-avatars.com/api/?name=${patient?.name || "User"}&background=2563eb&color=fff`}
                className="w-16 h-16 rounded-full shadow"
                alt="Profile Avatar"
              />
              <div>
                <h4 className="text-xl font-bold text-slate-800">{patient?.name || "Loading..."}</h4>
                <p className="text-sm text-slate-500 font-semibold">{patient?.email}</p>
              </div>
            </div>

            {!isEditingProfile ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Phone Number</p>
                    <p className="font-bold text-slate-800 mt-1">{patient?.phoneNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">National ID Card (NIC)</p>
                    <p className="font-bold text-slate-800 mt-1">{patient?.nic || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Date of Birth</p>
                    <p className="font-bold text-slate-800 mt-1 flex items-center gap-2">
                      {patient?.dob ? new Date(patient.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}
                      {patient?.dob && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-bold">
                          {calculateAge(patient.dob)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Gender</p>
                    <p className="font-bold text-slate-800 mt-1">{patient?.gender || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Home Address</p>
                    <p className="font-bold text-slate-800 mt-1">{patient?.homeAddress || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-xs">Allergies</p>
                    <p className="font-bold text-slate-850 mt-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl px-4 py-2 font-medium">
                      {patient?.allergies || "None declared"}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <button
                    onClick={startEditing}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition cursor-pointer text-sm shadow shadow-blue-100"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePatientProfileUpdate} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      value={editForm.phoneNumber}
                      onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">National ID Card (NIC) *</label>
                    <input
                      type="text"
                      value={editForm.nic}
                      onChange={e => setEditForm({ ...editForm, nic: e.target.value })}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-semibold text-slate-700">Date of Birth *</label>
                      {editForm.dob && (
                        <span className="text-xs text-blue-600 font-bold">
                          Age: {calculateAge(editForm.dob)}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={editForm.dob}
                      onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                    <select
                      value={editForm.gender}
                      onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Home Address *</label>
                    <input
                      type="text"
                      value={editForm.homeAddress}
                      onChange={e => setEditForm({ ...editForm, homeAddress: e.target.value })}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Allergies</label>
                  <textarea
                    value={editForm.allergies}
                    onChange={e => setEditForm({ ...editForm, allergies: e.target.value })}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium h-20 resize-none"
                    placeholder="List any drug or food allergies..."
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="border border-slate-200 px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-blue-100"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
