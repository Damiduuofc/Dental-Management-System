"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PatientSidebar from "@/components/patient/Sidebar";
import ProfileDropdown from "@/components/ProfileDropdown";
import {
  FileHeart,
  Calendar,
  User,
  RefreshCw,
  Eye,
  ZoomIn,
  SunMedium,
  X
} from "lucide-react";

interface XRayItem {
  _id: string;
  dentist: {
    _id: string;
    fullName: string;
    email: string;
  };
  title: string;
  category: "Panoramic" | "Bitewing" | "Periapical" | "Cephalometric" | "CBCT 3D" | "Other";
  imageUrl: string;
  date: string;
  findings?: string;
  notes?: string;
  createdAt: string;
}

export default function PatientXRaysPage() {
  const router = useRouter();
  const [xrays, setXrays] = useState<XRayItem[]>([]);
  const [filteredXrays, setFilteredXrays] = useState<XRayItem[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Lightbox view state
  const [lightboxXray, setLightboxXray] = useState<XRayItem | null>(null);
  const [invertContrast, setInvertContrast] = useState(false);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("patientToken");
      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [profileRes, xraysRes] = await Promise.all([
        fetch(`${apiBase}/patient/profile`, { headers }),
        fetch(`${apiBase}/patient/xrays`, { headers })
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
        setPatient(pData);
      }
      if (xraysRes.ok) {
        const data = await xraysRes.json();
        const list = Array.isArray(data) ? data : [];
        setXrays(list);
        setFilteredXrays(list);
      }
    } catch (err) {
      console.error("Error fetching patient X-rays:", err);
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

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredXrays(xrays);
    } else {
      setFilteredXrays(xrays.filter((x) => x.category === selectedCategory));
    }
  }, [selectedCategory, xrays]);

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
              <FileHeart className="text-blue-600" size={32} />
              My Diagnostic X-Rays &amp; Images
            </h2>
            <p className="text-slate-500 mt-1">View digital radiographs and official radiological findings from your dental care team</p>
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

        {/* Filter Chips */}
        {xrays.length > 0 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {["All", "Panoramic", "Periapical", "Bitewing", "Cephalometric", "CBCT 3D"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filteredXrays.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-slate-400 font-semibold shadow-sm max-w-2xl mx-auto mt-12">
            <FileHeart size={48} className="mx-auto mb-3 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Diagnostic X-Rays Found</h3>
            <p className="text-slate-500 text-sm">
              Any dental radiographs or 3D scans taken during your clinic visits will be accessible here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredXrays.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                {/* Image Container */}
                <div
                  onClick={() => {
                    setLightboxXray(item);
                    setInvertContrast(false);
                  }}
                  className="relative h-48 bg-slate-950 flex items-center justify-center cursor-pointer overflow-hidden group/img"
                  title="Click to zoom radiograph"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-contain group-hover/img:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center gap-2 text-white">
                    <span className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                      <ZoomIn size={20} />
                    </span>
                    <span className="text-xs font-bold">Inspect Image</span>
                  </div>

                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-white/20">
                    {item.category}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">{item.title}</h4>

                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1 text-slate-800 font-semibold">
                        <User size={14} className="text-blue-600" />
                        Dr. {item.dentist?.fullName || "Dentist"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {item.date ? new Date(item.date).toLocaleDateString() : "N/A"}
                      </span>
                    </div>

                    {item.findings ? (
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs mb-3">
                        <span className="font-bold text-slate-700 block mb-0.5">Doctor&apos;s Interpretation:</span>
                        <p className="text-slate-600 line-clamp-3 leading-relaxed">{item.findings}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mb-3">Routine diagnostic record.</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setLightboxXray(item);
                      setInvertContrast(false);
                    }}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <Eye size={14} /> Full Radiograph View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- FULLSCREEN LIGHTBOX MODAL --- */}
      {lightboxXray && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl w-full max-w-4xl p-6 md:p-8 shadow-2xl relative border border-slate-800 text-white max-h-[95vh] flex flex-col">
            <button
              onClick={() => setLightboxXray(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between mb-4 pr-12 flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">{lightboxXray.category} Radiograph</span>
                <h3 className="text-2xl font-black">{lightboxXray.title}</h3>
                <p className="text-slate-400 text-xs">
                  Attending Doctor: Dr. {lightboxXray.dentist?.fullName || "Attending Dentist"} | Date: {lightboxXray.date ? new Date(lightboxXray.date).toLocaleDateString() : "N/A"}
                </p>
              </div>

              <button
                onClick={() => setInvertContrast(!invertContrast)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  invertContrast
                    ? "bg-amber-400 text-slate-950 font-extrabold shadow-md shadow-amber-400/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <SunMedium size={14} />
                {invertContrast ? "Normal Radiograph" : "Invert Contrast"}
              </button>
            </div>

            <div className="flex-1 bg-black rounded-2xl flex items-center justify-center p-4 border border-slate-800 overflow-hidden min-h-[320px]">
              <img
                src={lightboxXray.imageUrl}
                alt={lightboxXray.title}
                className={`max-w-full max-h-[55vh] object-contain rounded transition duration-200 ${
                  invertContrast ? "invert hue-rotate-180" : ""
                }`}
              />
            </div>

            {lightboxXray.findings && (
              <div className="mt-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs">
                <span className="font-bold text-sky-400 block mb-1">Clinical Findings:</span>
                <p className="text-slate-300 leading-relaxed">{lightboxXray.findings}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
