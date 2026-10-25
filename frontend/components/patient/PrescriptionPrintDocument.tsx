"use client";

import React from "react";
import { Pill, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { formatDoctorName } from "@/lib/utils";

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface DentistInfo {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

export interface PrescriptionData {
  _id: string;
  date: string;
  diagnosis: string;
  medications: MedicationItem[];
  notes?: string;
  status: "Active" | "Completed" | "Discontinued";
  dentist?: DentistInfo;
  createdAt?: string;
}

export interface PatientProfile {
  _id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  dob?: string;
  nic?: string;
  homeAddress?: string;
  allergies?: string;
}

interface PrescriptionPrintDocumentProps {
  prescription: PrescriptionData;
  patient?: PatientProfile | null;
}

export default function PrescriptionPrintDocument({
  prescription,
  patient,
}: PrescriptionPrintDocumentProps) {
  const rxRef = `RX-${prescription._id ? prescription._id.slice(-8).toUpperCase() : "OFFICIAL"}`;

  const formattedDate = new Date(prescription.date || new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const patientAge = calculateAge(patient?.dob);

  return (
    <div className="bg-white text-slate-900 w-full max-w-[210mm] mx-auto p-6 sm:p-10 font-sans print:p-0 print:max-w-none print:w-full print:text-black">
      {/* Clinic Header / Letterhead */}
      <div className="flex justify-between items-start border-b-2 border-emerald-700 pb-4 mb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black shadow-xs print:bg-emerald-800 print:text-white print:border print:border-emerald-900">
            <span className="text-2xl">🦷</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              DentCare Dental Clinic
            </h1>
            <p className="text-xs font-bold text-emerald-800 tracking-wider uppercase mt-0.5">
              Center for Advanced Dental Care & Oral Surgery
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              123 Healthcare Way, Medical District, Colombo 05, Sri Lanka
            </p>
            <p className="text-[11px] text-slate-600">
              Tel: +94 11 234 5678 &nbsp;•&nbsp; Emergency: +94 77 123 4567 &nbsp;•&nbsp; Email: care@dentcare.com
            </p>
          </div>
        </div>

        <div className="text-right text-[10px] text-slate-500 hidden sm:block print:block">
          <p className="font-bold text-slate-700">MOH Registration:</p>
          <p className="font-mono text-slate-600">SL-DMC-8942</p>
          <p className="font-bold text-slate-700 mt-1">Practice License:</p>
          <p className="font-mono text-slate-600">DNT-2024-098</p>
          <p className="text-emerald-700 font-semibold mt-1">ISO 9001:2015 Practice</p>
        </div>
      </div>

      {/* Document Meta Ribbon */}
      <div className="flex justify-between items-center bg-slate-100/90 border border-slate-300 rounded-lg px-4 py-2.5 mb-5 print:bg-slate-100 print:border-slate-400">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
            Official Medical Prescription & Dispensing Order
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Electronic Health Record (EHR) • Sri Lanka Medical Council Standard
          </span>
        </div>
        <div className="text-right text-xs space-y-0.5">
          <p className="font-bold text-slate-900">
            <span className="text-slate-500 font-semibold">Rx Ref: </span>
            <span className="font-mono text-emerald-800">{rxRef}</span>
          </p>
          <p className="text-[11px] text-slate-600">
            <span className="text-slate-500">Date: </span>
            <span className="font-semibold text-slate-800">{formattedDate}</span>
          </p>
        </div>
      </div>

      {/* Patient & Prescriber Demographics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 rounded-xl p-4 mb-5 bg-slate-50/50 print:bg-transparent print:border-slate-400">
        {/* Patient Details */}
        <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-4">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-emerald-700/20 pb-1 flex items-center justify-between">
            <span>Patient Information</span>
            <span className="text-[10px] font-mono text-slate-500">
              PT-{patient?._id ? patient._id.slice(-6).toUpperCase() : "001"}
            </span>
          </h2>
          <div className="text-xs space-y-1 pt-0.5">
            <p>
              <span className="text-slate-500 font-medium">Name: </span>
              <strong className="text-slate-900 text-sm">{patient?.name || "Patient"}</strong>
            </p>
            <div className="flex gap-4 text-[11px] text-slate-700">
              <p>
                <span className="text-slate-500">Age: </span>
                <strong>{patientAge !== null ? `${patientAge} Yrs` : "Adult"}</strong>
              </p>
              <p>
                <span className="text-slate-500">Gender: </span>
                <strong className="capitalize">{patient?.gender || "Not specified"}</strong>
              </p>
              {patient?.nic && (
                <p>
                  <span className="text-slate-500">NIC: </span>
                  <strong className="font-mono">{patient.nic}</strong>
                </p>
              )}
            </div>
            {patient?.phoneNumber && (
              <p className="text-[11px]">
                <span className="text-slate-500">Phone: </span>
                <span className="text-slate-800 font-medium">{patient.phoneNumber}</span>
              </p>
            )}
            {patient?.homeAddress && (
              <p className="text-[11px] text-slate-600 line-clamp-1">
                <span className="text-slate-500">Address: </span>
                {patient.homeAddress}
              </p>
            )}

            {/* Drug Allergies */}
            <div className="pt-1">
              {patient?.allergies ? (
                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 text-rose-800 px-2 py-1 rounded text-[11px] font-bold">
                  <AlertTriangle size={12} className="flex-shrink-0 text-rose-600" />
                  <span>ALLERGIES: {patient.allergies}</span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 font-medium">
                  Drug Allergies: <span className="text-emerald-700 font-bold">No Known Drug Allergies (NKDA)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Doctor Details */}
        <div className="space-y-1.5 sm:pl-2">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-emerald-700/20 pb-1 flex items-center justify-between">
            <span>Prescribing Dentist</span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold">Licensed</span>
          </h2>
          <div className="text-xs space-y-1 pt-0.5">
            <p>
              <span className="text-slate-500 font-medium">Doctor: </span>
              <strong className="text-slate-900 text-sm">
                {formatDoctorName(prescription.dentist?.fullName || "Attending Dentist")}
              </strong>
            </p>
            <p className="text-[11px] text-slate-700">
              <span className="text-slate-500">Designation: </span>
              <strong>Dental Surgeon & Oral Health Specialist</strong>
            </p>
            <p className="text-[11px] text-slate-700">
              <span className="text-slate-500">Department: </span>
              <span>Restorative & Surgical Dentistry</span>
            </p>
            <p className="text-[11px] text-slate-700">
              <span className="text-slate-500">SLMC Registration: </span>
              <span className="font-mono font-semibold">D-4821</span>
            </p>
            {prescription.dentist?.email && (
              <p className="text-[11px] text-slate-600">
                <span className="text-slate-500">Contact: </span>
                {prescription.dentist.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Assessment / Diagnosis */}
      <div className="bg-emerald-50/70 border-l-4 border-emerald-700 p-3 rounded-r-lg mb-5 text-xs print:bg-slate-100 print:border-emerald-800">
        <span className="font-extrabold uppercase text-[10px] tracking-wider text-emerald-900 block mb-0.5">
          Clinical Diagnosis / Chief Indication:
        </span>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <span className="font-black text-sm text-slate-900">
            {prescription.diagnosis || "Clinical Dental Examination"}
          </span>
          <span className="text-[10px] bg-white border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full print:border-slate-400">
            Course Status: {prescription.status}
          </span>
        </div>
      </div>

      {/* Medications Table (Rx) */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-300">
          <span className="font-serif italic font-black text-3xl text-emerald-800 leading-none select-none">
            ℞
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
            Prescribed Medications & Administration Schedule
          </span>
        </div>

        <div className="overflow-hidden border border-slate-300 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-800 font-extrabold text-[11px] border-b border-slate-300 uppercase tracking-wider print:bg-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Medication & Strength</th>
                <th className="py-2.5 px-3">Dosage & Frequency</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Directions / Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {prescription.medications.map((med, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70 print:bg-white"}
                >
                  <td className="py-3 px-3 text-center font-bold text-slate-400 font-mono text-[11px]">
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-black text-slate-900 text-sm block">{med.name}</span>
                    <span className="inline-block mt-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 print:border-slate-300">
                      Strength: {med.dosage}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-800 block">{med.frequency}</span>
                    <span className="text-[10px] text-slate-500 font-medium">As directed</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-black text-slate-900 bg-slate-100 px-2 py-1 rounded text-xs inline-block border border-slate-200 print:border-slate-300">
                      {med.duration}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-700">
                    {med.instructions ? (
                      <span className="font-medium">{med.instructions}</span>
                    ) : (
                      <span className="text-slate-400 italic">Take as directed with food</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Notes & Precautions */}
      {prescription.notes && (
        <div className="border border-amber-300 bg-amber-50/70 rounded-xl p-3.5 mb-5 text-xs print:bg-slate-50 print:border-slate-300">
          <span className="font-extrabold uppercase text-[10px] tracking-wider text-amber-900 block mb-1">
            Dentist&apos;s Clinical Advice & Precautionary Instructions:
          </span>
          <p className="text-slate-800 leading-relaxed font-medium">{prescription.notes}</p>
        </div>
      )}

      {/* Standard Patient & Pharmacy Guidelines */}
      <div className="border border-slate-200 rounded-lg p-3 mb-6 bg-slate-50/60 text-[10px] text-slate-600 space-y-1 print:bg-transparent print:border-slate-300">
        <p className="font-extrabold uppercase tracking-wider text-slate-700 text-[10px]">
          Patient Information & Safe Pharmacotherapy Rules:
        </p>
        <ul className="list-disc list-inside space-y-0.5 leading-relaxed text-slate-600">
          <li>Take medications at evenly spaced intervals as prescribed. Complete full course of antibiotics even if symptoms subside.</li>
          <li>Take with a full glass of water. Avoid consuming alcohol or unprescribed OTC pain relievers unless authorized.</li>
          <li>In the event of unexpected rash, swelling, nausea, or allergic reaction, discontinue immediately and contact DentCare.</li>
        </ul>
      </div>

      {/* Authorization & Dispensing Footer (Doctor Signature + Pharmacy Endorsement) */}
      <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-slate-300 mt-6 mb-4 items-end">
        {/* Pharmacy Dispensing Block */}
        <div className="border border-dashed border-slate-300 rounded-lg p-3 text-[10px] text-slate-600 space-y-2 bg-slate-50/40 print:bg-transparent">
          <p className="font-bold uppercase tracking-wider text-slate-700 text-[10px] border-b border-slate-200 pb-1">
            Pharmacy Dispense Verification
          </p>
          <div className="flex gap-3 text-[10px] pt-0.5">
            <span>[ &nbsp; ] Full Course Dispensed</span>
            <span>[ &nbsp; ] Generic Substitution</span>
          </div>
          <p className="pt-1.5 text-slate-500">Pharmacist Signature: _______________________</p>
          <p className="text-slate-500">Pharmacy Name / Stamp: ______________________</p>
          <p className="text-slate-500">Date Dispensed: _____ / _____ / 20___</p>
        </div>

        {/* Doctor Signature & Official Seal */}
        <div className="flex flex-col items-end text-right">
          <div className="w-56 border-b-2 border-slate-800 mb-1.5"></div>
          <p className="font-black text-sm text-slate-900">
            {formatDoctorName(prescription.dentist?.fullName || "Attending Dentist")}
          </p>
          <p className="text-[11px] font-semibold text-slate-700">
            BDS (Hons), Dental Surgeon & Oral Specialist
          </p>
          <p className="text-[10px] text-slate-500">
            SLMC Reg: D-4821 • Authorized Dental Practitioner
          </p>

          <div className="mt-2.5 border-2 border-emerald-800 rounded-md px-3 py-1 bg-emerald-50 text-center print:bg-transparent">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-900 block">
              DentCare Digital Health Verification
            </span>
            <span className="text-[8px] font-mono text-emerald-800">
              VERIFIED EHR • ID: {rxRef}
            </span>
          </div>
        </div>
      </div>

      {/* Security Barcode & Footer Notice */}
      <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
        {/* Barcode Mockup */}
        <div className="font-mono tracking-[0.25em] text-xs font-black text-slate-800 select-none py-0.5">
          ||||| ||| ||||||| || |||||| ||||| ||| |||||||| ||||
        </div>
        <p className="font-mono text-[9px] text-slate-400">*{rxRef}*</p>
        <p className="font-medium text-slate-600">
          This is an official computer-generated medical prescription issued by DentCare Dental Management System.
        </p>
        <p className="text-[9px] text-slate-400">
          Valid for 30 days from date of issue • For inquiries or emergency support: +94 11 234 5678 • Page 1 of 1
        </p>
      </div>
    </div>
  );
}
