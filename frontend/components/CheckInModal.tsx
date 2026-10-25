'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Stethoscope, AlertTriangle, FileText, Clipboard } from 'lucide-react';
import { getAdminToken } from '@/lib/adminSession';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  nic: string;
}

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

export default function CheckInModal({ isOpen, onClose, patient, onSuccess }: CheckInModalProps) {
  const [allergies, setAllergies] = useState('');
  const [complains, setComplains] = useState('');
  const [onExamination, setOnExamination] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [treatmentDone, setTreatmentDone] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !patient) return;

    const fetchLatestClinical = async () => {
      setFetching(true);
      setError('');
      try {
        const token = getAdminToken() || localStorage.getItem('token');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/patients/${patient._id}/latest-clinical-details`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-auth-token': token || ''
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setAllergies(data.allergies || '');
          setComplains(data.complains || '');
          setOnExamination(data.onExamination || '');
          setTreatmentPlan(data.treatmentPlan || '');
          setTreatmentDone(data.treatmentDone || '');
        }
      } catch (err) {
        console.error("Error fetching latest clinical details:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchLatestClinical();
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = getAdminToken() || localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/patients/${patient._id}/check-in`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-auth-token': token || ''
          },
          body: JSON.stringify({
            allergies,
            complains,
            onExamination,
            treatmentPlan,
            treatmentDone
          })
        }
      );

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
          setSuccess(false);
        }, 1500);
      } else {
        setError(data.message || "Failed to check in patient.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error checking in patient.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white w-full max-w-[600px] max-h-[90vh] p-8 rounded-3xl shadow-2xl border border-slate-100 relative modal-scroll">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-1 text-slate-800">Clinical Check-in</h2>
        <p className="text-slate-500 mb-6 text-sm">Pre-visit medical profile for patient <strong className="text-slate-700">{patient.name}</strong>.</p>

        {fetching && (
          <div className="p-8 text-center text-slate-500 font-medium">
            <div className="animate-spin inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mb-1"></div>
            <p className="text-xs">Loading previous clinical history...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle size={18} className="text-emerald-600" />
            Patient successfully checked in!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Allergies */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-500" />
              Allergies & Medical Warnings
            </label>
            <textarea
              placeholder="List allergies or medical conditions"
              value={allergies}
              onChange={e => setAllergies(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium text-sm h-18 resize-none"
            />
          </div>

          {/* Complains */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={14} className="text-blue-500" />
              Patient Complains
            </label>
            <textarea
              placeholder="What concerns or issues did the patient present?"
              value={complains}
              onChange={e => setComplains(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium text-sm h-18 resize-none"
              required
            />
          </div>

          {/* On Examination */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Stethoscope size={14} className="text-teal-500" />
              On Examination Findings
            </label>
            <textarea
              placeholder="Objective findings from initial visual assessment..."
              value={onExamination}
              onChange={e => setOnExamination(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium text-sm h-18 resize-none"
            />
          </div>

          {/* Treatment Plan */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clipboard size={14} className="text-indigo-500" />
              Proposed Treatment Plan
            </label>
            <textarea
              placeholder="Planned clinical steps"
              value={treatmentPlan}
              onChange={e => setTreatmentPlan(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium text-sm h-18 resize-none"
            />
          </div>

          {/* Treatment Done */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              Treatment Done / Procedures Handled
            </label>
            <textarea
              placeholder="Any immediate treatments completed during this check-in..."
              value={treatmentDone}
              onChange={e => setTreatmentDone(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium text-sm h-18 resize-none"
            />
          </div>

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
              disabled={loading || fetching}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg shadow-blue-100 disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? "Checking in..." : "Check In Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
