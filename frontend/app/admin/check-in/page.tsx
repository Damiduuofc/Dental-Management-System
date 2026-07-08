'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import AddPatientModal from '@/components/AddPatientModal';
import Sidebar from '@/components/admin/Sidebar';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  nic: string;
  createdAt: string;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        setFilteredPatients(data);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
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
        fetchPatients();
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/admin/login");
      }
    }
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.phoneNumber?.toLowerCase().includes(query) ||
        p.nic?.toLowerCase().includes(query)
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const calculateAge = (dobString: string) => {
    if (!dobString) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading patients record...</p>
        </div>
      </div>
    );
  }

  const totalCount = patients.length;
  const activeCount = patients.length;
  const newThisMonth = patients.filter(p => {
    const createdDate = new Date(p.createdAt);
    const today = new Date();
    return createdDate.getMonth() === today.getMonth() && createdDate.getFullYear() === today.getFullYear();
  }).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 md:ml-64">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
            <p className="text-slate-500 mt-1">Manage and track clinic patient records.</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[ 
            { val: totalCount, label: 'Total Patients', bg: 'bg-blue-600' }, 
            { val: activeCount, label: 'Active Patients', bg: 'bg-sky-500' }, 
            { val: newThisMonth, label: 'New this month', bg: 'bg-teal-600' }
          ].map((s, i) => (
            <div key={i} className={`${s.bg} text-white p-6 rounded-2xl shadow-sm hover:shadow-md transition duration-200`}>
              <div className="text-3xl font-bold">{s.val}</div>
              <div className="text-sm opacity-90 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-between flex-wrap gap-4 mb-6">
          <div className="relative w-96 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-medium" 
              placeholder="Search by Name, Email, Phone, or NIC..." 
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-md shadow-blue-100 transition cursor-pointer">
            <Plus size={20} /> Add New Patients
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">No patient records found.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Patient</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Contact</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">NIC Number</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Gender</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Date Registered</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Status</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(p => (
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="p-4 font-medium text-slate-900 text-sm">
                        {p.name}<br/>
                        <span className="text-xs text-slate-400 font-normal">{calculateAge(p.dob)} years old</span>
                      </td>
                      <td className="p-4 text-slate-600 text-sm">
                        {p.phoneNumber}<br/>
                        <span className="text-xs text-slate-400 font-normal">{p.email}</span>
                      </td>
                      <td className="p-4 text-slate-600 text-sm font-semibold">{p.nic}</td>
                      <td className="p-4 text-slate-600 text-sm">{p.gender}</td>
                      <td className="p-4 text-slate-600 text-sm">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                          Active
                        </span>
                      </td>
                      <td className="p-4 flex gap-3">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold cursor-pointer">View</button>
                        <button className="text-slate-500 hover:text-slate-700 text-sm font-semibold cursor-pointer">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <AddPatientModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchPatients}
        />
      </main>
    </div>
  );
}