"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PatientSidebar from "@/components/patient/Sidebar";
import ProfileDropdown from "@/components/ProfileDropdown";
import {
  Stethoscope,
  Activity,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  RefreshCw,
  FileText
} from "lucide-react";

interface TreatmentPlanItem {
  _id: string;
  dentist: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
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

export default function PatientTreatmentsPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<TreatmentPlanItem[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("patientToken");
      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [profileRes, plansRes] = await Promise.all([
        fetch(`${apiBase}/patient/profile`, { headers }),
        fetch(`${apiBase}/patient/treatment-plans`, { headers })
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
        setPatient(pData);
      }
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching patient treatment plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token") || localStorage.getItem("patientToken");

      if (!token) {
        window.location.href = "/";
        return;
      }
      fetchData();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PatientSidebar />

      <main className="flex-1 p-8 ml-64 min-h-screen">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Stethoscope className="text-blue-600" size={32} />
              My Clinical Treatment Plans
            </h2>
            <p className="text-slate-500 mt-1">Review procedure timelines, clinical findings, and completed treatment steps</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-600 shadow-sm"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <ProfileDropdown user={patient ? { ...patient, role: 'patient' } : null} />
          </div>
        </header>

        {plans.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-slate-400 font-semibold shadow-sm max-w-2xl mx-auto mt-12">
            <Stethoscope size={48} className="mx-auto mb-3 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Active Treatment Plans</h3>
            <p className="text-slate-500 text-sm">
              Your attending dentist has not formulated any ongoing treatment plans yet. Once documented during your visits, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {plans.map((plan) => {
              let statusBadge = "bg-blue-50 text-blue-700 border-blue-200";
              let statusIcon = <Activity size={15} />;
              if (plan.status === "Completed") {
                statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                statusIcon = <CheckCircle2 size={15} />;
              } else if (plan.status === "Planned") {
                statusBadge = "bg-purple-50 text-purple-700 border-purple-200";
                statusIcon = <Clock size={15} />;
              }

              return (
                <div
                  key={plan._id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Treatment Plan
                      </span>
                      <h3 className="text-2xl font-black text-slate-900">{plan.title}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusBadge}`}>
                        {statusIcon}
                        {plan.status}
                      </span>
                      {plan.estimatedCost > 0 && (
                        <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                          Est: Rs. {plan.estimatedCost.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs font-semibold text-slate-500 mb-6 flex-wrap">
                    <span className="flex items-center gap-1.5 text-slate-900">
                      <User size={15} className="text-blue-600" />
                      Doctor: <strong>Dr. {plan.dentist?.fullName || "Attending Dentist"}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Date Started: {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : "N/A"}
                    </span>
                    {plan.targetDate && (
                      <span className="flex items-center gap-1 text-purple-600 font-bold">
                        Target Completion: {new Date(plan.targetDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {plan.diagnosis && (
                    <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">Doctor&apos;s Diagnosis:</span>
                      <p className="text-slate-600 leading-relaxed">{plan.diagnosis}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                    <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                      <span className="font-bold text-blue-900 block mb-1.5">Planned Procedures &amp; Steps:</span>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">{plan.treatmentPlan}</p>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                      <span className="font-bold text-emerald-900 block mb-1.5">Procedures Performed So Far:</span>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                        {plan.treatmentDone || <span className="italic text-slate-400">No procedures logged yet</span>}
                      </p>
                    </div>
                  </div>

                  {plan.notes && (
                    <p className="text-xs text-slate-500 italic mt-3 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                      <strong>Post-Treatment Care Instructions:</strong> {plan.notes}
                    </p>
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
