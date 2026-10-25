"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Calendar, Truck, AlertTriangle, Building2, Mail, CheckCircle2 } from "lucide-react";

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  categories?: string[];
}

export interface InventoryItemRef {
  _id?: string;
  name: string;
  category?: string;
  unit?: string;
  quantity?: number;
  minimumThreshold?: number;
  price?: number;
}

interface SupplierOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialItem?: InventoryItemRef | null;
  suppliers: Supplier[];
}

export default function SupplierOrderModal({
  isOpen,
  onClose,
  onSuccess,
  initialItem,
  suppliers
}: SupplierOrderModalProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("");
  const [supplierEmail, setSupplierEmail] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>("Box");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isManualSupplier, setIsManualSupplier] = useState<boolean>(false);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";

  // Calculate 5-day delivery date
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 5);
  const formattedDeadline = deadlineDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  useEffect(() => {
    if (initialItem) {
      setUnit(initialItem.unit || "units");
      // Calculate suggested order quantity
      if (initialItem.minimumThreshold && initialItem.quantity !== undefined) {
        const suggested = Math.max(initialItem.minimumThreshold, (initialItem.minimumThreshold * 2) - initialItem.quantity);
        setQuantity(suggested);
      } else {
        setQuantity(10);
      }
    }

    if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0]._id);
      setSupplierName(suppliers[0].name);
      setSupplierEmail(suppliers[0].email);
    }
  }, [initialItem, suppliers]);

  const handleSupplierSelect = (supId: string) => {
    setSelectedSupplierId(supId);
    if (supId === "manual") {
      setIsManualSupplier(true);
      setSupplierName("");
      setSupplierEmail("");
    } else {
      setIsManualSupplier(false);
      const found = suppliers.find((s) => s._id === supId);
      if (found) {
        setSupplierName(found.name);
        setSupplierEmail(found.email);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !supplierEmail.trim()) {
      alert("Please provide valid supplier name and email.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiBase}/inventory/supplier-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          inventoryItemId: initialItem?._id || undefined,
          itemName: initialItem?.name || "Dental Supply Item",
          category: initialItem?.category || "Supply",
          quantity: Number(quantity),
          unit: unit,
          supplierId: isManualSupplier ? undefined : selectedSupplierId,
          supplierName: supplierName.trim(),
          supplierEmail: supplierEmail.trim().toLowerCase(),
          notes: notes.trim()
        })
      });

      if (res.ok) {
        alert(
          `✅ Supplier order placed successfully!\n\nAn automated order notification was sent to ${supplierEmail} with a requested delivery deadline within 5 days (${formattedDeadline}).`
        );
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to submit supplier order");
      }
    } catch (err) {
      console.error("Error submitting supplier order:", err);
      alert("Error submitting supplier order. Please check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative border border-slate-100 max-h-[90vh] modal-scroll">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Truck size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">Request from Supplier</h3>
            <p className="text-slate-500 text-sm">Dispatches procurement order with 5-day delivery deadline notification</p>
          </div>
        </div>

        {/* Low Stock Item Summary Card */}
        {initialItem && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Item for Replenishment</span>
                <h4 className="text-lg font-bold text-slate-900">{initialItem.name}</h4>
              </div>
              <div className="flex gap-4 text-xs font-semibold text-slate-600">
                <span className="bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                  Current: <strong className="text-rose-600">{initialItem.quantity ?? 0} {initialItem.unit}</strong>
                </span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                  Min Limit: <strong className="text-slate-800">{initialItem.minimumThreshold ?? 10}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 5-Day Delivery Highlight Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-2xl p-4 mb-6 shadow-md shadow-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl mt-0.5">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-md">
                  Strict SLA
                </span>
                <h5 className="font-bold text-sm">Required Delivery: Within 5 Days</h5>
              </div>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Expected on or before: <strong className="text-white underline">{formattedDeadline}</strong>.
                An automated email will be sent to the supplier requesting delivery within this 5-day timeframe.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Supplier Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Select Supplier</label>
            <div className="relative">
              <select
                value={isManualSupplier ? "manual" : selectedSupplierId}
                onChange={(e) => handleSupplierSelect(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.email})
                  </option>
                ))}
                <option value="manual">+ Enter another supplier manually...</option>
              </select>
            </div>
          </div>

          {/* Supplier Name & Email (Editable or Manual) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Supplier Company Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter supplier name"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Supplier Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="Enter supplier email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Order Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Quantity to Order</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Urgent Notes / Special Instructions */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Instructions / Clinical Urgency Notes <span className="text-slate-400 font-normal">(Included in Email)</span>
            </label>
            <textarea
              placeholder="Enter order notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none placeholder:text-slate-400 text-sm"
            />
          </div>

          {/* Action Buttons */}
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
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold shadow-md shadow-blue-200 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              <Send size={18} />
              {submitting ? "Sending Order..." : "Send 5-Day Order Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
