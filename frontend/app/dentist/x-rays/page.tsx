"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DentistSidebar from "@/components/dentist/Sidebar";
import PatientSelector from "@/components/dentist/PatientSelector";
import {
  FileHeart,
  Plus,
  Search,
  Calendar,
  User,
  Trash2,
  RefreshCw,
  X,
  Eye,
  ZoomIn,
  SunMedium,
  Download,
  Upload,
  Camera,
  Layers,
  Edit3
} from "lucide-react";

interface PatientRef {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
}

interface XRayItem {
  _id: string;
  patient: PatientRef;
  dentist: {
    _id: string;
    fullName: string;
    email: string;
  };
  title: string;
  category: "Panoramic" | "Bitewing" | "Periapical" | "Cephalometric" | "CBCT 3D";
  imageUrl: string;
  date: string;
  findings?: string;
  notes?: string;
  createdAt: string;
}

// Preset clinical X-ray sample SVGs / data URIs for instant realistic testing
const SAMPLE_XRAYS = [
  {
    name: "Panoramic OPG (Sample)",
    category: "Panoramic",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300' viewBox='0 0 600 300' style='background:%23050b14'><rect width='600' height='300' fill='%23050b14'/><path d='M80,180 Q300,240 520,180' stroke='%2338bdf8' stroke-width='4' fill='none' opacity='0.7'/><path d='M100,140 Q300,200 500,140' stroke='%23bae6fd' stroke-width='3' fill='none' opacity='0.8'/><text x='300' y='50' fill='%2394a3b8' font-size='16' text-anchor='middle' font-family='sans-serif'>DENTAL CLINICAL PANORAMIC RADIOGRAPH (OPG)</text><g fill='%23e2e8f0' opacity='0.85'><rect x='130' y='145' width='16' height='28' rx='4'/><rect x='155' y='143' width='18' height='30' rx='4'/><rect x='180' y='140' width='20' height='32' rx='4'/><rect x='210' y='138' width='22' height='34' rx='4'/><rect x='240' y='135' width='24' height='36' rx='4'/><rect x='270' y='133' width='26' height='38' rx='4'/><rect x='304' y='133' width='26' height='38' rx='4'/><rect x='336' y='135' width='24' height='36' rx='4'/><rect x='368' y='138' width='22' height='34' rx='4'/><rect x='398' y='140' width='20' height='32' rx='4'/><rect x='425' y='143' width='18' height='30' rx='4'/><rect x='450' y='145' width='16' height='28' rx='4'/></g><circle cx='409' cy='154' r='8' fill='%23ef4444' opacity='0.6'/><text x='409' y='190' fill='%23f87171' font-size='11' text-anchor='middle' font-family='sans-serif'>Impaction #48</text><text x='30' y='280' fill='%23475569' font-size='11' font-family='monospace'>SCALE: 1:1 CALIBRATED | kVp: 72 | mA: 10</text></svg>"
  },
  {
    name: "Periapical View #14 (Sample)",
    category: "Periapical",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400' style='background:%23020617'><rect width='400' height='400' fill='%23020617'/><text x='200' y='40' fill='%2394a3b8' font-size='14' text-anchor='middle' font-family='sans-serif'>PERIAPICAL RADIOGRAPH #14</text><path d='M150,120 Q200,80 250,120 L240,280 Q200,320 160,280 Z' fill='%23cbd5e1' opacity='0.85'/><path d='M190,140 L210,140 L205,270 L195,270 Z' fill='%230f172a'/><circle cx='200' cy='300' r='18' fill='%23f43f5e' opacity='0.6'/><text x='200' y='350' fill='%23f43f5e' font-size='12' text-anchor='middle' font-family='sans-serif'>Apical Radiolucency (Lesion)</text><text x='30' y='380' fill='%23475569' font-size='10' font-family='monospace'>EXPOSURE: 0.16s | D-SPEED SENSOR</text></svg>"
  },
  {
    name: "Bitewing Left Premolars (Sample)",
    category: "Bitewing",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='500' height='350' viewBox='0 0 500 350' style='background:%23090d16'><rect width='500' height='350' fill='%23090d16'/><text x='250' y='35' fill='%2394a3b8' font-size='14' text-anchor='middle' font-family='sans-serif'>BITEWING RADIOGRAPH (CORONAL VIEW)</text><rect x='100' y='80' width='60' height='70' rx='10' fill='%23e2e8f0' opacity='0.85'/><rect x='180' y='75' width='65' height='75' rx='10' fill='%23e2e8f0' opacity='0.85'/><rect x='260' y='70' width='70' height='80' rx='10' fill='%23e2e8f0' opacity='0.85'/><rect x='100' y='190' width='60' height='70' rx='10' fill='%23e2e8f0' opacity='0.85'/><rect x='180' y='185' width='65' height='75' rx='10' fill='%23e2e8f0' opacity='0.85'/><rect x='260' y='180' width='70' height='80' rx='10' fill='%23e2e8f0' opacity='0.85'/><path d='M160,110 L160,130' stroke='%23ef4444' stroke-width='4'/><text x='160' y='165' fill='%23ef4444' font-size='11' text-anchor='middle' font-family='sans-serif'>Interproximal Caries</text><text x='30' y='330' fill='%23475569' font-size='10' font-family='monospace'>BITESHEET POSITION: POSTERIOR LEFT</text></svg>"
  }
];

export default function DentistXRaysPage() {
  const router = useRouter();
  const [xrays, setXrays] = useState<XRayItem[]>([]);
  const [filteredXrays, setFilteredXrays] = useState<XRayItem[]>([]);
  const [patients, setPatients] = useState<PatientRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>("");

  // Lightbox view state
  const [lightboxXray, setLightboxXray] = useState<XRayItem | null>(null);
  const [invertContrast, setInvertContrast] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedXray, setSelectedXray] = useState<XRayItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    patientId: "",
    title: "",
    category: "Panoramic" as XRayItem["category"],
    imageUrl: SAMPLE_XRAYS[0].url,
    date: new Date().toISOString().slice(0, 10),
    findings: "",
    notes: ""
  });

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";

  const fetchXRaysAndPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [xraysRes, patientsRes] = await Promise.all([
        fetch(`${apiBase}/admin/xrays`, { headers }),
        fetch(`${apiBase}/admin/patients`, { headers })
      ]);

      if (xraysRes.ok) {
        const xraysData = await xraysRes.json();
        setXrays(xraysData);
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
      console.error("Error fetching X-rays:", err);
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
        fetchXRaysAndPatients();
      } catch (e) {
        console.error("Auth parsing error:", e);
        router.push("/admin/login");
      }
    }
  }, [router]);

  // Filtering
  useEffect(() => {
    let result = [...xrays];
    if (selectedPatientFilter) {
      result = result.filter((x) => x.patient?._id === selectedPatientFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          x.patient?.name?.toLowerCase().includes(q) ||
          (x.findings && x.findings.toLowerCase().includes(q))
      );
    }
    setFilteredXrays(result);
  }, [xrays, searchQuery, selectedPatientFilter]);

  // File picker handler converts to base64 data url and optimizes large radiograph files
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If SVG or small file (<1MB), read directly
    if (file.type === "image/svg+xml" || file.size < 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // For larger files, optimize using canvas to maintain diagnostic quality while keeping payload size lean
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_WIDTH = 2048;
        const MAX_HEIGHT = 2048;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
          setFormData((prev) => ({ ...prev, imageUrl: optimizedDataUrl }));
        } else {
          setFormData((prev) => ({ ...prev, imageUrl: event.target?.result as string }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Add X-Ray Record
  const handleAddXRay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.title.trim() || !formData.imageUrl) {
      alert("Please select patient, title, and upload an image.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/xrays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("✅ Diagnostic X-Ray record saved and added to patient records!");
        setIsAddModalOpen(false);
        setFormData({
          patientId: patients.length > 0 ? patients[0]._id : "",
          title: "",
          category: "Panoramic",
          imageUrl: SAMPLE_XRAYS[0].url,
          date: new Date().toISOString().slice(0, 10),
          findings: "",
          notes: ""
        });
        fetchXRaysAndPatients();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to add X-ray record");
      }
    } catch (err) {
      console.error("Error adding X-ray:", err);
      alert("Error adding X-ray record.");
    }
  };

  // Edit X-Ray
  const handleEditXRay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedXray) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/xrays/${selectedXray._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          date: formData.date,
          findings: formData.findings,
          notes: formData.notes
        })
      });

      if (res.ok) {
        alert("✅ X-Ray findings updated successfully!");
        setIsEditModalOpen(false);
        setSelectedXray(null);
        fetchXRaysAndPatients();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update X-ray record");
      }
    } catch (err) {
      console.error("Error updating X-ray:", err);
    }
  };

  // Delete X-Ray
  const handleDeleteXRay = async (id: string) => {
    if (!confirm("Are you sure you want to delete this X-Ray record?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/xrays/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert("X-Ray record deleted.");
        fetchXRaysAndPatients();
      } else {
        alert("Failed to delete X-Ray record.");
      }
    } catch (err) {
      console.error("Error deleting X-ray:", err);
    }
  };

  const panoramicCount = xrays.filter((x) => x.category === "Panoramic").length;
  const bitewingCount = xrays.filter((x) => x.category === "Bitewing").length;
  const periapicalCount = xrays.filter((x) => x.category === "Periapical").length;

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
              <FileHeart className="text-blue-600" size={32} />
              Diagnostic X-Rays & Imaging
            </h2>
            <p className="text-slate-500 mt-1">
              Upload radiographs, document radiological findings, and provide instant image access to patients
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setFormData({
                  patientId: patients.length > 0 ? patients[0]._id : "",
                  title: "",
                  category: "Panoramic",
                  imageUrl: SAMPLE_XRAYS[0].url,
                  date: new Date().toISOString().slice(0, 10),
                  findings: "",
                  notes: ""
                });
                setIsAddModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition cursor-pointer"
            >
              <Plus size={18} />
              + Upload X-Ray Record
            </button>
            <button
              onClick={fetchXRaysAndPatients}
              className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition cursor-pointer text-slate-600"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-8">
          <div
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition duration-200 group flex items-center gap-4"
          >
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 group-hover:scale-110 transition duration-200">
              <FileHeart size={26} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition">{xrays.length}</h3>
              <p className="text-slate-500 font-semibold text-sm mt-0.5">Total Radiographs</p>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-sky-400 transition duration-200 group flex items-center gap-4"
          >
            <div className="p-3.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100 group-hover:scale-110 transition duration-200">
              <Layers size={26} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-sky-600 transition">{panoramicCount}</h3>
              <p className="text-slate-500 font-semibold text-sm mt-0.5">Panoramic (OPG)</p>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-400 transition duration-200 group flex items-center gap-4"
          >
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 group-hover:scale-110 transition duration-200">
              <Camera size={26} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition">{periapicalCount}</h3>
              <p className="text-slate-500 font-semibold text-sm mt-0.5">Periapical Views</p>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-amber-400 transition duration-200 group flex items-center gap-4"
          >
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 group-hover:scale-110 transition duration-200">
              <ZoomIn size={26} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-amber-600 transition">{bitewingCount}</h3>
              <p className="text-slate-500 font-semibold text-sm mt-0.5">Bitewings</p>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, findings..."
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
                    category: "Panoramic",
                    imageUrl: SAMPLE_XRAYS[0].url,
                    date: new Date().toISOString().slice(0, 10),
                    findings: "",
                    notes: ""
                  });
                  setIsAddModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} /> Upload X-Ray for {patients.find((p) => p._id === selectedPatientFilter)?.name}
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

        {/* X-Rays Grid Gallery */}
        <section>
          {filteredXrays.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-semibold shadow-sm">
              <FileHeart size={40} className="mx-auto mb-2 text-slate-300" />
              <p>No X-ray records found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredXrays.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-400 hover:scale-[1.01] transition duration-200 flex flex-col justify-between group"
                >
                  {/* Image Preview Box */}
                  <div
                    onClick={() => {
                      setLightboxXray(item);
                      setInvertContrast(false);
                    }}
                    className="relative h-48 bg-slate-950 flex items-center justify-center cursor-pointer overflow-hidden group/img"
                    title="Click to view full-screen radiograph"
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
                      <span className="text-xs font-bold">Inspect Radiograph</span>
                    </div>

                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-white/20">
                      {item.category}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg mb-1">{item.title}</h4>

                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1 text-slate-800 font-semibold">
                          <User size={14} className="text-blue-600" />
                          {item.patient?.name || "Patient"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>

                      {item.findings ? (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs mb-3">
                          <span className="font-bold text-slate-700 block mb-0.5">Radiological Findings:</span>
                          <p className="text-slate-600 line-clamp-3 leading-relaxed">{item.findings}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic mb-3">No specific findings logged.</p>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                      <button
                        onClick={() => {
                          setLightboxXray(item);
                          setInvertContrast(false);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={14} /> Full View
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedXray(item);
                            setFormData({
                              patientId: item.patient?._id || "",
                              title: item.title,
                              category: item.category,
                              imageUrl: item.imageUrl,
                              date: item.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
                              findings: item.findings || "",
                              notes: item.notes || ""
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="px-2 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1"
                          title="Edit Record"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteXRay(item._id)}
                          className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1"
                          title="Delete Record"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* --- HIGH-RES LIGHTBOX VIEWER MODAL --- */}
      {lightboxXray && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in backdrop-blur-md">
          <div className="bg-slate-900 rounded-2xl w-full max-w-4xl p-6 md:p-8 shadow-2xl relative border border-slate-800 text-white max-h-[95vh] flex flex-col">
            <button
              onClick={() => setLightboxXray(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full transition"
            >
              <X size={20} />
            </button>

            {/* Lightbox Header */}
            <div className="flex items-center justify-between mb-4 pr-12 flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{lightboxXray.category} Radiograph</span>
                <h3 className="text-2xl font-black">{lightboxXray.title}</h3>
                <p className="text-slate-400 text-xs">
                  Patient: <strong className="text-slate-200">{lightboxXray.patient?.name}</strong> | Date: {new Date(lightboxXray.date).toLocaleDateString()}
                </p>
              </div>

              {/* Contrast Invert Button */}
              <button
                onClick={() => setInvertContrast(!invertContrast)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  invertContrast
                    ? "bg-amber-400 text-slate-950 font-extrabold shadow-md shadow-amber-400/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <SunMedium size={14} />
                {invertContrast ? "Normal View" : "Invert Contrast"}
              </button>
            </div>

            {/* Display Image */}
            <div className="flex-1 bg-black rounded-xl flex items-center justify-center p-4 border border-slate-800 overflow-hidden min-h-[320px]">
              <img
                src={lightboxXray.imageUrl}
                alt={lightboxXray.title}
                className={`max-w-full max-h-[55vh] object-contain rounded transition duration-200 ${
                  invertContrast ? "invert hue-rotate-180" : ""
                }`}
              />
            </div>

            {/* Findings & Notes Footer */}
            {lightboxXray.findings && (
              <div className="mt-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs">
                <span className="font-bold text-blue-400 block mb-1">Radiologist / Doctor Findings:</span>
                <p className="text-slate-300 leading-relaxed">{lightboxXray.findings}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ADD X-RAY RECORD MODAL --- */}
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
              <FileHeart className="text-blue-600" size={26} />
              Upload Diagnostic X-Ray
            </h3>

            <form onSubmit={handleAddXRay} className="space-y-4">
              <PatientSelector
                patients={patients}
                selectedPatientId={formData.patientId}
                onSelectPatient={(patientId) => setFormData({ ...formData, patientId })}
                label="Select Patient"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">X-Ray Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter X-ray title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Panoramic">Panoramic</option>
                    <option value="Periapical">Periapical</option>
                    <option value="Bitewing">Bitewing</option>
                    <option value="Cephalometric">Cephalometric</option>
                    <option value="CBCT 3D">CBCT 3D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Date Taken</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Image Upload / Preset Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">X-Ray Image File</label>
                <div className="flex gap-2 mb-3">
                  <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-blue-500 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/20">
                    <Upload size={20} className="text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Upload from Device</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, DICOM Export</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preset sample choices for instant testing */}
                <span className="text-xs font-bold text-slate-400 block mb-1">Or Choose Sample Radiograph:</span>
                <div className="flex gap-2 flex-wrap mb-3">
                  {SAMPLE_XRAYS.map((sample) => (
                    <button
                      key={sample.name}
                      type="button"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        imageUrl: sample.url,
                        category: sample.category as any,
                        title: prev.title || sample.name
                      }))}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>

                {/* Image Preview Box */}
                {formData.imageUrl && (
                  <div className="h-36 bg-slate-950 rounded-xl flex items-center justify-center p-2 border border-slate-200 relative overflow-hidden">
                    <img src={formData.imageUrl} alt="Preview" className="max-h-full object-contain" />
                    <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Image Ready
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Radiological Findings</label>
                <textarea
                  placeholder="Describe the radiographic findings"
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Clinical Notes</label>
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
                  Save &amp; Notify Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT X-RAY FINDINGS MODAL --- */}
      {isEditModalOpen && selectedXray && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative border border-slate-100 max-h-[90vh] modal-scroll">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full"
            >
              <X size={18} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Update X-Ray Record</h3>
            <p className="text-slate-500 text-sm mb-6">Patient: <strong>{selectedXray.patient?.name}</strong></p>

            <form onSubmit={handleEditXRay} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Panoramic">Panoramic</option>
                    <option value="Periapical">Periapical</option>
                    <option value="Bitewing">Bitewing</option>
                    <option value="Cephalometric">Cephalometric</option>
                    <option value="CBCT 3D">CBCT 3D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Radiological Findings</label>
                <textarea
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Notes</label>
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
