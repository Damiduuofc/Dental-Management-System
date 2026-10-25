'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, User, Phone, Mail, FileText, MapPin, X, Clock, HelpCircle, Check, AlertCircle, Pill } from 'lucide-react';
import IssuePrescriptionModal from '@/components/dentist/IssuePrescriptionModal';
import { formatDoctorName } from "@/lib/utils";

interface Patient {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  nic: string;
  homeAddress?: string;
  allergies?: string;
}

interface Appointment {
  _id: string;
  treatment: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Scheduled' | 'Arrived' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
  allergies?: string;
  complains?: string;
  onExamination?: string;
  treatmentPlan?: string;
  treatmentDone?: string;
  dentist?: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
}

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export default function PatientDetailsModal({ isOpen, onClose, patient }: PatientDetailsModalProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !patient) return;

    const fetchPatientAppointments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/appointments?patientId=${patient._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (err) {
        console.error("Error fetching patient appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientAppointments();
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  // Age calculation helper
  const calculateAge = (dobString: string) => {
    const birthday = new Date(dobString);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const getStatusStyle = (status: Appointment['status']) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Scheduled':
        return 'bg-blue-50 text-blue-750 border-blue-100';
      case 'Arrived':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Completed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default: // Pending
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white w-full max-w-[750px] max-h-[90vh] p-8 rounded-3xl shadow-2xl border border-slate-100 relative modal-scroll">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <h2 className="text-2xl font-bold mb-1 text-slate-800">Patient File Details</h2>
        <p className="text-slate-500 mb-6 text-sm">Medical record overview and appointment history.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Patient Info Column 1 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Full Name</p>
                <p className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{patient.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">NIC Number</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{patient.nic}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Gender / Age</p>
              <p className="font-semibold text-slate-700 text-sm mt-0.5">
                {patient.gender} — {calculateAge(patient.dob)} years old
              </p>
            </div>
            
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Date of Birth</p>
              <p className="font-semibold text-slate-700 text-sm mt-0.5">
                {new Date(patient.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Contact Details Column 2 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 md:col-span-2">
            <h3 className="font-bold text-slate-700 text-sm border-b border-slate-200/60 pb-2">Contact & Address</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Phone Number</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{patient.phoneNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Email Address</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5 break-all">{patient.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <MapPin size={18} className="text-slate-400 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Home Address</p>
                <p className="font-semibold text-slate-700 text-sm mt-1 leading-relaxed">
                  {patient.homeAddress || 'No home address provided.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <AlertCircle size={18} className="text-amber-500 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Allergies</p>
                <p className={`font-semibold text-sm mt-1 leading-relaxed ${patient.allergies ? 'text-amber-850 bg-amber-50/70 border border-amber-100/60 rounded-xl px-3 py-1.5 font-medium' : 'text-slate-700'}`}>
                  {patient.allergies || 'None declared.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div>
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            Appointment History ({appointments.length})
          </h3>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              <div className="animate-spin inline-block w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full mb-2"></div>
              <p>Loading patient appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 font-medium text-sm">
              No appointments scheduled for this patient.
            </div>
          ) : (
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="p-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Date & Time</th>
                      <th className="p-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Dentist</th>
                      <th className="p-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Treatment</th>
                      <th className="p-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <React.Fragment key={appt._id}>
                        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                          <td className="p-3 text-sm">
                            <span className="font-bold text-slate-800">
                              {new Date(appt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="block text-xs text-slate-400 mt-0.5">{appt.time}</span>
                          </td>
                          <td className="p-3 text-sm font-semibold text-slate-700">
                            {appt.dentist ? formatDoctorName(appt.dentist.fullName) : 'N/A'}
                          </td>
                          <td className="p-3 text-sm text-slate-600">
                            {appt.treatment}
                          </td>
                          <td className="p-3 text-sm">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(appt.status)}`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                        {(appt.notes || appt.complains || appt.onExamination || appt.treatmentPlan || appt.treatmentDone || appt.allergies) && (
                          <tr className="border-b border-slate-50 bg-slate-50/25">
                            <td colSpan={4} className="p-4 pt-2 text-xs text-slate-600">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                                {appt.complains && (
                                  <div>
                                    <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Complains</span>
                                    <p className="text-slate-700 mt-0.5 font-medium">{appt.complains}</p>
                                  </div>
                                )}
                                {appt.onExamination && (
                                  <div>
                                    <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">On Examination</span>
                                    <p className="text-slate-700 mt-0.5 font-medium">{appt.onExamination}</p>
                                  </div>
                                )}
                                {appt.treatmentPlan && (
                                  <div>
                                    <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Proposed Plan</span>
                                    <p className="text-slate-700 mt-0.5 font-medium">{appt.treatmentPlan}</p>
                                  </div>
                                )}
                                {appt.treatmentDone && (
                                  <div>
                                    <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Treatment Done</span>
                                    <p className="text-slate-700 mt-0.5 font-medium">{appt.treatmentDone}</p>
                                  </div>
                                )}
                                {appt.allergies && (
                                  <div>
                                    <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Allergies</span>
                                    <p className="text-amber-800 mt-0.5 font-semibold bg-amber-50 px-1.5 py-0.5 rounded w-fit border border-amber-100/50">{appt.allergies}</p>
                                  </div>
                                )}
                                {appt.notes && (
                                  <div className="sm:col-span-2 border-t border-slate-200/40 pt-1.5 mt-1">
                                    <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Dentist Notes</span>
                                    <p className="text-slate-700 mt-0.5 font-medium italic">"{appt.notes}"</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap justify-between items-center gap-3 pt-6 mt-6 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrescriptionOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold transition cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Pill size={14} /> + Issue Prescription
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/dentist/treatments?patientId=${patient._id}`);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold transition cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
            >
              + Add Treatment Plan
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/dentist/x-rays?patientId=${patient._id}`);
              }}
              className="px-4 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-600 hover:text-white text-violet-700 font-bold transition cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
            >
              + Upload X-Ray
            </button>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="px-6 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      </div>

      {/* Issue Prescription Modal inside Patient Details */}
      <IssuePrescriptionModal
        isOpen={isPrescriptionOpen}
        onClose={() => setIsPrescriptionOpen(false)}
        patients={patient ? [patient] : []}
        preselectedPatient={patient}
      />
    </div>
  );
}
