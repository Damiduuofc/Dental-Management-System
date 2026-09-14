"use client";

import React, { useState, useEffect } from "react";
import { 
  Pill, 
  Search, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  User, 
  FileText,
  Sparkles,
  ShieldAlert
} from "lucide-react";
import PatientSidebar from "@/components/patient/Sidebar";
import ProfileDropdown from "@/components/ProfileDropdown";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Dentist {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

interface Prescription {
  _id: string;
  date: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  status: "Active" | "Completed" | "Discontinued";
  dentist?: Dentist;
  createdAt: string;
}

export default function PatientPrescriptions() {
  const [patient, setPatient] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Completed">("ALL");

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";

  const fetchPatientData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, prescriptionsRes] = await Promise.all([
        fetch(`${apiBase}/patient/profile`, { headers }),
        fetch(`${apiBase}/patient/prescriptions`, { headers })
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setPatient(data);
      }
      if (prescriptionsRes.ok) {
        const pData = await prescriptionsRes.json();
        setPrescriptions(pData);
      }
    } catch (error) {
      console.error("Error loading patient prescriptions:", error);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    let result = [...prescriptions];
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.diagnosis.toLowerCase().includes(q) ||
          p.dentist?.fullName?.toLowerCase().includes(q) ||
          p.medications.some((m) => m.name.toLowerCase().includes(q))
      );
    }
    setFilteredPrescriptions(result);
  }, [prescriptions, statusFilter, searchQuery]);

  const activeCount = prescriptions.filter((p) => p.status === "Active").length;
  const completedCount = prescriptions.filter((p) => p.status === "Completed").length;

  const getStatusBadge = (status: Prescription["status"]) => {
    switch (status) {
      case "Active":
        return (
          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 size={13} /> Active Course
          </span>
        );
      case "Completed":
        return (
          <span className="flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Clock size={13} /> Completed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <AlertCircle size={13} /> Discontinued
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <PatientSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 ml-64">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search medication, doctor, diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 w-80 rounded-full border border-slate-200 bg-white py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition font-medium"
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

        {/* Hero Title & Stats Banner */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <Pill className="text-emerald-600" size={32} />
                My Prescriptions
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Your medical prescriptions, pharmaceutical dosages, and dental treatment medication schedules
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex gap-3">
              <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-xs text-center min-w-[110px]">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Active</span>
                <span className="text-2xl font-black text-slate-900">{activeCount}</span>
              </div>
              <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-xs text-center min-w-[110px]">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Past Courses</span>
                <span className="text-2xl font-black text-slate-900">{completedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3">
          {(["ALL", "Active", "Completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab === "ALL" ? `All Prescriptions (${prescriptions.length})` : tab}
            </button>
          ))}
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center max-w-2xl mx-auto shadow-sm flex flex-col items-center justify-center">
            <div className="bg-emerald-50 p-6 rounded-full text-emerald-600 mb-6">
              <Pill size={40} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">No Prescriptions Found</h4>
            <p className="text-slate-500 text-sm max-w-md font-medium leading-relaxed">
              {statusFilter !== "ALL"
                ? `You have no ${statusFilter.toLowerCase()} prescriptions recorded.`
                : "You do not have any active medical prescriptions. Any prescriptions or dosage instructions issued by your dentist during your clinic visits will automatically appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPrescriptions.map((item) => {
              const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              });

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs hover:shadow-md transition"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5 mb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-slate-900">{item.diagnosis}</h3>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400" /> Prescribed: <strong>{formattedDate}</strong>
                        </span>
                        {item.dentist && (
                          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <User size={14} className="text-emerald-600" /> Dr. {item.dentist.fullName}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-sky-700 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/60 text-[11px]">
                          <span>✉️</span> PDF Emailed
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      title="Print / Save Prescription"
                    >
                      <Printer size={15} /> Print Rx
                    </button>
                  </div>

                  {/* Medications List */}
                  <div className="mb-5">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                      Prescribed Medications ({item.medications.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {item.medications.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-slate-150 bg-slate-50/70 hover:bg-slate-50 transition space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-black text-slate-900 text-base block">{med.name}</span>
                              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-block mt-0.5">
                                Dosage: {med.dosage}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                              {med.duration}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-700 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-slate-400 flex-shrink-0" />
                              <span>
                                Schedule: <strong>{med.frequency}</strong>
                              </span>
                            </div>
                            {med.instructions && (
                              <div className="text-[11px] text-slate-500 italic bg-white/80 p-2 rounded-lg border border-slate-100 mt-1">
                                💡 {med.instructions}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doctor's Advice / Notes */}
                  {item.notes && (
                    <div className="p-4 bg-amber-50/80 border border-amber-200/70 rounded-2xl text-xs text-amber-900 leading-relaxed">
                      <span className="font-extrabold text-amber-800 uppercase tracking-wider block text-[10px] mb-0.5">
                        Clinical Instructions & Precautions from Dentist:
                      </span>
                      {item.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
