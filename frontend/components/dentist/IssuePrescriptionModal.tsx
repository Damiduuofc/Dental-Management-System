"use client";

import React, { useState, useEffect } from "react";
import { Pill, Plus, Trash2, X, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import PatientSelector, { PatientOption } from "./PatientSelector";

interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface IssuePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PatientOption[];
  preselectedPatient?: PatientOption | null;
  onPrescriptionCreated?: () => void;
}

const DENTAL_PRESETS: { label: string; med: MedicationItem }[] = [
  {
    label: "Amoxicillin 500mg",
    med: {
      name: "Amoxicillin",
      dosage: "500mg",
      frequency: "Every 8 hours (TID)",
      duration: "5 days",
      instructions: "Take after meals. Complete the entire course."
    }
  },
  {
    label: "Augmentin 625mg",
    med: {
      name: "Co-Amoxiclav (Augmentin)",
      dosage: "625mg",
      frequency: "Twice daily (BID)",
      duration: "5 days",
      instructions: "Take with food to minimize stomach upset."
    }
  },
  {
    label: "Ibuprofen 400mg",
    med: {
      name: "Ibuprofen",
      dosage: "400mg",
      frequency: "Every 8 hours (TID) PRN",
      duration: "3-5 days",
      instructions: "Take strictly after meals with plenty of water."
    }
  },
  {
    label: "Paracetamol 500mg",
    med: {
      name: "Paracetamol",
      dosage: "500mg",
      frequency: "Every 6 hours as needed",
      duration: "3-5 days",
      instructions: "Do not exceed 4000mg in 24 hours."
    }
  },
  {
    label: "Metronidazole 400mg",
    med: {
      name: "Metronidazole",
      dosage: "400mg",
      frequency: "Every 8 hours (TID)",
      duration: "5 days",
      instructions: "Do NOT consume alcohol during and 48h after treatment."
    }
  },
  {
    label: "Chlorhexidine 0.12%",
    med: {
      name: "Chlorhexidine Gluconate Oral Rinse",
      dosage: "0.12% (15ml)",
      frequency: "Twice daily (BID)",
      duration: "7-10 days",
      instructions: "Swish around mouth for 30-60 seconds after brushing then spit out."
    }
  }
];

export default function IssuePrescriptionModal({
  isOpen,
  onClose,
  patients,
  preselectedPatient,
  onPrescriptionCreated
}: IssuePrescriptionModalProps) {
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      name: "Amoxicillin",
      dosage: "500mg",
      frequency: "Every 8 hours (TID)",
      duration: "5 days",
      instructions: "Take after meals. Complete the entire course."
    }
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (preselectedPatient) {
        setPatientId(preselectedPatient._id);
      } else {
        setPatientId("");
      }
    }
  }, [isOpen, preselectedPatient]);

  if (!isOpen) return null;

  const currentPatient = patients.find((p) => p._id === patientId) || preselectedPatient;

  const handleAddMedication = () => {
    setMedications((prev) => [
      ...prev,
      {
        name: "",
        dosage: "",
        frequency: "Twice daily (BID)",
        duration: "5 days",
        instructions: "Take after food"
      }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    if (medications.length <= 1) {
      alert("At least one medication is required.");
      return;
    }
    setMedications((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateMedication = (index: number, field: keyof MedicationItem, value: string) => {
    setMedications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleApplyPreset = (presetMed: MedicationItem) => {
    // If the only medication in the list is empty, replace it; otherwise, append
    if (medications.length === 1 && !medications[0].name.trim()) {
      setMedications([presetMed]);
    } else {
      setMedications((prev) => [...prev, presetMed]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      alert("Please select a patient.");
      return;
    }
    if (!diagnosis.trim()) {
      alert("Please enter a clinical diagnosis.");
      return;
    }
    const hasValidMedication = medications.some((m) => m.name.trim() && m.dosage.trim());
    if (!hasValidMedication) {
      alert("Please enter at least one medication name and dosage.");
      return;
    }

    setSubmitting(true);
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${apiBase}/admin/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId,
          date,
          diagnosis: diagnosis.trim(),
          medications: medications.filter((m) => m.name.trim()),
          notes: notes.trim(),
          status: "Active"
        })
      });

      if (res.ok) {
        alert("✅ Prescription issued successfully! An official copy with PDF attachment has been emailed to the patient.");
        onClose();
        if (onPrescriptionCreated) onPrescriptionCreated();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to issue prescription.");
      }
    } catch (error) {
      console.error("Error issuing prescription:", error);
      alert("Network error while issuing prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-3xl p-6 md:p-8 shadow-2xl relative border border-slate-100 max-h-[90vh] modal-scroll">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full cursor-pointer transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <Pill size={26} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">Issue Clinical Prescription</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Prescribe medications, dosage schedules, and clinical instructions for the patient.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <PatientSelector
              patients={patients}
              selectedPatientId={patientId}
              onSelectPatient={(id) => setPatientId(id)}
              label="Select Patient"
              required
              allowChange={true}
            />
          </div>

          {/* Date & Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prescription Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Diagnosis / Purpose *</label>
              <input
                type="text"
                required
                placeholder="Enter diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Dental Quick Presets */}
          <div>
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Sparkles size={13} className="text-amber-500" />
              Quick Presets (Click to add)
            </span>
            <div className="flex flex-wrap gap-2">
              {DENTAL_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset.med)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medications Builder */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-slate-800">
                Prescribed Medications ({medications.length})
              </label>
              <button
                type="button"
                onClick={handleAddMedication}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <Plus size={14} /> Add Medication
              </button>
            </div>

            <div className="space-y-3">
              {medications.map((med, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 relative group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      Medication #{index + 1}
                    </span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition"
                        title="Remove medication"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Medication Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Medicine name"
                        value={med.name}
                        onChange={(e) => handleUpdateMedication(index, "name", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Dosage / Strength *</label>
                      <input
                        type="text"
                        required
                        placeholder="Dosage"
                        value={med.dosage}
                        onChange={(e) => handleUpdateMedication(index, "dosage", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Frequency *</label>
                      <input
                        type="text"
                        required
                        placeholder="Frequency"
                        value={med.frequency}
                        onChange={(e) => handleUpdateMedication(index, "frequency", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Duration *</label>
                      <input
                        type="text"
                        required
                        placeholder="Duration"
                        value={med.duration}
                        onChange={(e) => handleUpdateMedication(index, "duration", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Special Instructions</label>
                    <input
                      type="text"
                      placeholder="Special instructions"
                      value={med.instructions}
                      onChange={(e) => handleUpdateMedication(index, "instructions", e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Advice & Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Advice / Clinical Notes</label>
            <textarea
              rows={2}
              placeholder="Enter general advice for the patient"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Allergy alert check */}
          {currentPatient?.allergies && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-semibold">
              <AlertCircle size={16} className="text-amber-700 flex-shrink-0" />
              <span>
                Safety Alert: Patient has listed allergies: <strong>{currentPatient.allergies}</strong>. Verify contraindications before issuing.
              </span>
            </div>
          )}

          {/* Email notice */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900 font-medium">
            <span className="flex items-center gap-2">
              <span className="text-base">📧</span>
              <span>
                An official PDF copy will be emailed automatically to: <strong>{currentPatient?.email || "patient's email"}</strong>
              </span>
            </span>
            <span className="text-[11px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md font-semibold">
              Automated PDF Email
            </span>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-sm shadow-md shadow-emerald-100 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              {submitting ? "Issuing & Sending Email..." : "Issue & Email Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
