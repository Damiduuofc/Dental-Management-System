"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DentistSidebar from "@/components/dentist/Sidebar";
import PatientSelector from "@/components/dentist/PatientSelector";
import {
  Stethoscope,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  Edit3,
  Trash2,
  RefreshCw,
  X,
  FileText,
  AlertCircle,
  Activity,
  ArrowRight
} from "lucide-react";

interface PatientRef {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
  allergies?: string;
}

interface TreatmentPlanItem {
  _id: string;
  patient: PatientRef;
  dentist: {
    _id: string;
    fullName: string;
    email: string;
  };
  title: string;
  diagnosis?: string;
  treatmentPlan: string;
  treatmentDone?: string;
  status: "Planned" | "In Progress" | "Completed";
  estimatedCost: number;
  startDate: string;
  targetDate?: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
}

export default function DentistTreatmentsPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<TreatmentPlanItem[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<TreatmentPlanItem[]>([]);
  const [patients, setPatients] = useState<PatientRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "In Progress" | "Completed" | "Planned">("ALL");
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlanItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    patientId: "",
    title: "",
    diagnosis: "",
    treatmentPlan: "",
    treatmentDone: "",
    status: "In Progress" as "Planned" | "In Progress" | "Completed",
    estimatedCost: 0,
    targetDate: "",
    notes: ""
  });

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";

  const fetchPlansAndPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [plansRes, patientsRes] = await Promise.all([
        fetch(`${apiBase}/admin/treatment-plans`, { headers }),
        fetch(`${apiBase}/admin/patients`, { headers })
      ]);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData);
      }
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);

        // Check if a patientId was passed in query parameters
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const paramPatientId = urlParams.get("patientId");
          if (paramPatientId && patientsData.some((p: any) => p._id === paramPatientId)) {
            setFormData((prev) => ({ ...prev, patientId: paramPatientId }));
            setSelectedPatientFilter(paramPatientId);
            setIsAddModalOpen(true);
          } else if (patientsData.length > 0 && !formData.patientId) {
            setFormData((prev) => ({ ...prev, patientId: patientsData[0]._id }));
          }
        }
      }
    } catch (err) {
      console.error("Error fetching treatment plans data:", err);
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
        const parsed = JSON.parse(storedUser);
        if (parsed.role !== "dentist" && parsed.role !== "system_admin") {
          router.push("/admin/login");
          return;
        }
        fetchPlansAndPatients();
      } catch (e) {
        console.error("Auth parsing error:", e);
        router.push("/admin/login");
      }
    }
  }, [router]);

  // Filtering
  useEffect(() => {
    let result = [...plans];
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (selectedPatientFilter) {
      result = result.filter((p) => p.patient?._id === selectedPatientFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.patient?.name?.toLowerCase().includes(q) ||
          (p.diagnosis && p.diagnosis.toLowerCase().includes(q))
      );
    }
    setFilteredPlans(result);
  }, [plans, statusFilter, searchQuery, selectedPatientFilter]);

  // Create Treatment Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.title.trim() || !formData.treatmentPlan.trim()) {
      alert("Please select a patient and fill in title and treatment plan.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/treatment-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("✅ Treatment plan formulated and patient notified successfully!");
        setIsAddModalOpen(false);
        setFormData({
          patientId: patients.length > 0 ? patients[0]._id : "",
          title: "",
          diagnosis: "",
          treatmentPlan: "",
          treatmentDone: "",
          status: "In Progress",
          estimatedCost: 0,
          targetDate: "",
          notes: ""
        });
        fetchPlansAndPatients();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to create treatment plan");
      }
    } catch (err) {
      console.error("Error creating treatment plan:", err);
      alert("Failed to submit treatment plan.");
    }
  };

  // Update Treatment Plan
  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/treatment-plans/${selectedPlan._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          diagnosis: formData.diagnosis,
          treatmentPlan: formData.treatmentPlan,
          treatmentDone: formData.treatmentDone,
          status: formData.status,
          estimatedCost: formData.estimatedCost,
          targetDate: formData.targetDate || undefined,
          notes: formData.notes
        })
      });

      if (res.ok) {
        alert("✅ Treatment plan progress updated successfully!");
        setIsEditModalOpen(false);
        setSelectedPlan(null);
        fetchPlansAndPatients();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update treatment plan");
      }
    } catch (err) {
      console.error("Error updating treatment plan:", err);
      alert("Failed to update treatment plan.");
    }
  };

  // Delete Plan
  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this clinical treatment plan?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/treatment-plans/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Treatment plan removed.");
        fetchPlansAndPatients();
      } else {
        alert("Failed to delete treatment plan.");
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
    }
  };

  const inProgressCount = plans.filter((p) => p.status === "In Progress").length;
  const completedCount = plans.filter((p) => p.status === "Completed").length;
  const plannedCount = plans.filter((p) => p.status === "Planned").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DentistSidebar />

      <main className="flex-1 p-8 ml-64 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Stethoscope className="text-blue-600" size={32} />
              Clinical Treatment Plans
            </h2>
            <p className="text-slate-500 mt-1">
              Document diagnoses, plan procedures, log treatments done, and sync with patient mobile app
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchPlansAndPatients}
              className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition cursor-pointer text-slate-600"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div
            onClick={() => setStatusFilter("In Progress")}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:scale-[1.01] transition duration-200 cursor-pointer group flex items-center gap-4"
          >
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 group-hover:scale-110 transition duration-200">
              <Activity size={28} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition">{inProgressCount}</h3>
              <p className="text-slate-500 font-semibold text-sm mt-0.5">In Progress Plans</p>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("Completed")}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 hover:scale-[1.01] transition duration-200 cursor-pointer group flex items-center gap-4"
          >
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:scale-110 transition duration-200">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition">{completedCount}</h3>
              <p className="text-slate-500 font-semibold text-sm mt-0.5">Completed Plans</p>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("Planned")}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-amber-300 hover:scale-[1.01] transition duration-200 cursor-pointer group flex items-center gap-4"
          >
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 group-hover:scale-110 transition duration-200">
              <Clock size={28} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-amber-600 transition">{plannedCount}</h3>
              <p className="text-slate-500 font-semibold text-sm mt-0.5">Planned / Scheduled</p>
            </div>
          </div>
        </section>

        {/* Filters and Search Bar */}
        <section className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 w-full rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Patient Filter Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-64">
              <User size={16} className="text-slate-400 flex-shrink-0" />
              <select
                value={selectedPatientFilter}
                onChange={(e) => setSelectedPatientFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Patients ({patients.length})</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {selectedPatientFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedPatientFilter("")}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                  title="Clear patient filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-xl text-xs font-bold overflow-x-auto w-full lg:w-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === "ALL" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({plans.length})
            </button>
            <button
              onClick={() => setStatusFilter("In Progress")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === "In Progress" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter("Completed")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === "Completed" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter("Planned")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === "Planned" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Planned ({plannedCount})
            </button>
          </div>
        </section>

        {/* Active Patient Filter Banner */}
        {selectedPatientFilter && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between flex-wrap gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {patients.find((p) => p._id === selectedPatientFilter)?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">Filtered Patient</span>
                <span className="font-bold text-slate-900 text-base">
                  {patients.find((p) => p._id === selectedPatientFilter)?.name}
                </span>
                <span className="text-xs text-slate-500 font-medium ml-2">
                  ({patients.find((p) => p._id === selectedPatientFilter)?.phoneNumber || "No phone"})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFormData({
                    patientId: selectedPatientFilter,
                    title: "",
                    diagnosis: "",
                    treatmentPlan: "",
                    treatmentDone: "",
                    status: "In Progress",
                    estimatedCost: 0,
                    targetDate: "",
                    notes: ""
                  });
                  setIsAddModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Plan for {patients.find((p) => p._id === selectedPatientFilter)?.name}
              </button>
              <button
                onClick={() => setSelectedPatientFilter("")}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2.5 py-1.5 rounded-lg hover:bg-white/60 transition"
              >
                Clear Filter
              </button>
            </div>
          </div>
        )}

        {/* Treatment Plans Cards List */}
        <section className="space-y-4">
          {filteredPlans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-semibold shadow-sm">
              <Stethoscope size={40} className="mx-auto mb-2 text-slate-300" />
              <p>No clinical treatment plans found matching filters.</p>
            </div>
          ) : (
            filteredPlans.map((plan) => {
              let statusBadge = "bg-blue-50 text-blue-700 border-blue-200";
              if (plan.status === "Completed") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
              if (plan.status === "Planned") statusBadge = "bg-amber-50 text-amber-700 border-amber-200";

              return (
                <div
                  key={plan._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row justify-between gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="text-xl font-bold text-slate-900">{plan.title}</h4>
                      <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${statusBadge}`}>
                        {plan.status}
                      </span>
                      {plan.estimatedCost > 0 && (
                        <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          Est. Rs. {plan.estimatedCost.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-5 text-xs font-semibold text-slate-500 mb-4 flex-wrap">
                      <span className="flex items-center gap-1.5 text-slate-900">
                        <User size={15} className="text-blue-600" />
                        Patient: <strong>{plan.patient?.name || "Unknown Patient"}</strong>
                      </span>
                      {plan.patient?.phoneNumber && <span>Phone: {plan.patient.phoneNumber}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Started: {new Date(plan.startDate).toLocaleDateString()}
                      </span>
                      {plan.targetDate && (
                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                          <Clock size={13} className="text-amber-500" />
                          Target: {new Date(plan.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {plan.diagnosis && (
                      <div className="mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700 block mb-0.5">Clinical Diagnosis:</span>
                        <p className="text-slate-600">{plan.diagnosis}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                      <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                        <span className="font-bold text-blue-900 block mb-1">Planned Procedures & Steps:</span>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">{plan.treatmentPlan}</p>
                      </div>
                      <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                        <span className="font-bold text-emerald-900 block mb-1">Treatment Done to Date:</span>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {plan.treatmentDone || <span className="italic text-slate-400">No procedures logged yet</span>}
                        </p>
                      </div>
                    </div>

                    {plan.notes && (
                      <p className="text-xs text-slate-500 italic mt-2">
                        <strong>Doctor Notes:</strong> {plan.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col justify-end gap-2 self-end lg:self-center">
                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setFormData({
                          patientId: plan.patient?._id || "",
                          title: plan.title,
                          diagnosis: plan.diagnosis || "",
                          treatmentPlan: plan.treatmentPlan,
                          treatmentDone: plan.treatmentDone || "",
                          status: plan.status,
                          estimatedCost: plan.estimatedCost || 0,
                          targetDate: plan.targetDate ? plan.targetDate.slice(0, 10) : "",
                          notes: plan.notes || ""
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 size={14} />
                      Update Progress
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan._id)}
                      className="px-4 py-2 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Delete Treatment Plan"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* --- CREATE TREATMENT PLAN MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative border border-slate-100 max-h-[90vh] modal-scroll">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full"
            >
              <X size={18} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Stethoscope className="text-blue-600" size={26} />
              Formulate Clinical Treatment Plan
            </h3>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <PatientSelector
                patients={patients}
                selectedPatientId={formData.patientId}
                onSelectPatient={(patientId) => setFormData({ ...formData, patientId })}
                label="Select Patient"
                required
                allowChange={false}
              />

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Treatment Plan Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter treatment title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Diagnosis & Findings</label>
                <input
                  type="text"
                  placeholder="Enter clinical diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Treatment Plan & Steps *</label>
                <textarea
                  required
                  placeholder="Enter the planned treatment steps"
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 h-28 resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Treatment Done (Today / Completed Steps)</label>
                <textarea
                  placeholder="Describe the treatment completed so far"
                  value={formData.treatmentDone}
                  onChange={(e) => setFormData({ ...formData, treatmentDone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Planned">Planned</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Estimated Cost (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter estimated cost"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Doctor Notes</label>
                <input
                  type="text"
                  placeholder="Enter additional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold shadow-md shadow-blue-200 transition cursor-pointer text-sm"
                >
                  Save & Notify Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT TREATMENT PLAN MODAL --- */}
      {isEditModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative border border-slate-100 max-h-[90vh] modal-scroll">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full"
            >
              <X size={18} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Update Treatment Progress</h3>
            <p className="text-slate-500 text-sm mb-6">
              Patient: <strong>{selectedPlan.patient?.name}</strong>
            </p>

            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Treatment Plan Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Planned Procedures</label>
                <textarea
                  required
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Treatment Done to Date</label>
                <textarea
                  value={formData.treatmentDone}
                  onChange={(e) => setFormData({ ...formData, treatmentDone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Planned">Planned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Estimated Cost (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Doctor Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold shadow-md shadow-blue-200 transition cursor-pointer text-sm"
                >
                  Update & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
