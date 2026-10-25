"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DentistSidebar from "@/components/dentist/Sidebar";
import { ClipboardList, Plus, Search, Calendar, RefreshCw, AlertCircle, Clock, CheckCircle2, XCircle, X } from "lucide-react";

interface SupplyRequest {
  _id: string;
  itemName: string;
  quantity: number;
  unit: string;
  status: "Pending" | "Approved" | "Rejected" | "Fulfilled";
  notes?: string;
  adminNotes?: string;
  createdAt: string;
}

export default function DentistSupplyRequestPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: 1,
    unit: "Box",
    notes: "",
  });

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Error fetching supply requests:", err);
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
        if (parsedUser.role !== "dentist") {
          router.push("/admin/login");
          return;
        }
        fetchRequests();
      } catch (err) {
        console.error("Auth parsing error on supply page:", err);
        router.push("/admin/login");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Supply request submitted successfully!");
        setIsModalOpen(false);
        setFormData({
          itemName: "",
          quantity: 1,
          unit: "Box",
          notes: "",
        });
        fetchRequests();
      } else {
        alert("Failed to submit request.");
      }
    } catch (err) {
      console.error("Submit supply request error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <DentistSidebar />

      <main className="flex-1 p-8 ml-64 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Supply / Material Requests</h2>
            <p className="text-slate-500 mt-1">Request clinical tools, dental supplies, or medications from inventory.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition cursor-pointer"
            >
              <Plus size={18} />
              New Request
            </button>
            <button
              onClick={fetchRequests}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw size={18} className="text-slate-600" />
            </button>
          </div>
        </header>

        {/* Requests List */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <ClipboardList className="text-blue-600" size={20} /> Request History
            </h3>
          </div>

          <div className="overflow-x-auto">
            {requests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-semibold">
                No supply requests made yet. Submit a request above.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Item Requested</th>
                    <th className="py-4 px-6 text-center">Quantity</th>
                    <th className="py-4 px-6">Submitted Date</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Notes / Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm font-semibold text-slate-700">
                  {requests.map((req) => {
                    let statusBadge = "bg-slate-100 text-slate-700";
                    let statusIcon = <Clock size={16} />;

                    if (req.status === "Pending") {
                      statusBadge = "bg-amber-50 border-amber-100 text-amber-700";
                      statusIcon = <Clock size={16} className="text-amber-500" />;
                    } else if (req.status === "Approved") {
                      statusBadge = "bg-blue-50 border-blue-100 text-blue-700";
                      statusIcon = <CheckCircle2 size={16} className="text-blue-500" />;
                    } else if (req.status === "Fulfilled") {
                      statusBadge = "bg-emerald-50 border-emerald-100 text-emerald-700";
                      statusIcon = <CheckCircle2 size={16} className="text-emerald-500" />;
                    } else if (req.status === "Rejected") {
                      statusBadge = "bg-rose-50 border-rose-100 text-rose-700";
                      statusIcon = <XCircle size={16} className="text-rose-500" />;
                    }

                    return (
                      <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-900">{req.itemName}</p>
                          {req.notes && <p className="text-xs text-slate-400 mt-0.5 font-medium">{req.notes}</p>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {req.quantity} {req.unit}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${statusBadge}`}>
                            {statusIcon}
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 font-medium max-w-xs">
                          {req.adminNotes || <span className="italic text-slate-400">Waiting for review</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* --- SUBMIT REQUEST MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] modal-scroll">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Submit Supply Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter item name"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Unit Type</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter unit of measure"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Dentist Notes / Urgency</label>
                <textarea
                  placeholder="Enter request notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none font-medium"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
