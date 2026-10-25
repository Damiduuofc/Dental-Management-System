"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import SupplierOrderModal, { Supplier, InventoryItemRef } from "@/components/admin/SupplierOrderModal";
import RegisterSupplierModal from "@/components/admin/RegisterSupplierModal";
import {
  ClipboardList,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Check,
  Truck,
  Building2,
  AlertTriangle,
  Plus,
  Calendar,
  Mail,
  Phone,
  MapPin,
  PackageCheck,
  Boxes,
  ArrowRight
} from "lucide-react";
import { formatDoctorName } from "@/lib/utils";

interface DentistData {
  _id: string;
  fullName: string;
  email: string;
}

interface SupplyRequest {
  _id: string;
  dentist: DentistData;
  itemName: string;
  quantity: number;
  unit: string;
  status: "Pending" | "Approved" | "Rejected" | "Fulfilled";
  notes?: string;
  adminNotes?: string;
  createdAt: string;
}

interface LowStockItem {
  _id: string;
  name: string;
  category: "Supply" | "Medication";
  quantity: number;
  minimumThreshold: number;
  unit: string;
  price: number;
  deficit: number;
  suggestedReorder: number;
  status: "CRITICAL" | "Low Stock";
}

interface SupplierOrder {
  _id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  supplierName: string;
  supplierEmail: string;
  orderDate: string;
  expectedDeliveryDate: string;
  deliveryDeadlineDays: number;
  status: "Requested" | "Confirmed" | "Delivered" | "Cancelled";
  notes?: string;
  receivedDate?: string;
  createdAt: string;
}

export default function AdminSupplyRequestsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"lowStock" | "suppliers" | "orders" | "dentistRequests">("lowStock");

  // Data states
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRegisterSupplierOpen, setIsRegisterSupplierOpen] = useState(false);
  const [isSupplierOrderModalOpen, setIsSupplierOrderModalOpen] = useState(false);
  const [selectedItemForOrder, setSelectedItemForOrder] = useState<InventoryItemRef | null>(null);

  // Dentist request status action modal
  const [selectedRequest, setSelectedRequest] = useState<SupplyRequest | null>(null);
  const [actionStatus, setActionStatus] = useState<"Approved" | "Rejected" | "Fulfilled" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [resRequests, resLowStock, resSuppliers, resOrders] = await Promise.all([
        fetch(`${apiBase}/inventory/requests`, { headers }),
        fetch(`${apiBase}/inventory/low-stock`, { headers }),
        fetch(`${apiBase}/inventory/suppliers`, { headers }),
        fetch(`${apiBase}/inventory/supplier-orders`, { headers })
      ]);

      if (resRequests.ok) setRequests(await resRequests.json());
      if (resLowStock.ok) setLowStockItems(await resLowStock.json());
      if (resSuppliers.ok) setSuppliers(await resSuppliers.json());
      if (resOrders.ok) setSupplierOrders(await resOrders.json());
    } catch (err) {
      console.error("Error fetching supply page data:", err);
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
        if (parsedUser.role !== "assistant" && parsedUser.role !== "system_admin") {
          router.push("/admin/login");
          return;
        }
        fetchAllData();
      } catch (err) {
        console.error("Auth parsing error:", err);
        router.push("/admin/login");
      }
    }
  }, [router]);

  // Handle dentist request status update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionStatus) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory/requests/${selectedRequest._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: actionStatus,
          adminNotes,
        }),
      });

      if (res.ok) {
        alert(`Request marked as ${actionStatus}!`);
        setSelectedRequest(null);
        setActionStatus(null);
        setAdminNotes("");
        fetchAllData();
      } else {
        alert("Failed to update supply request.");
      }
    } catch (err) {
      console.error("Update request status error:", err);
    }
  };

  // Receive supplier shipment & restock inventory
  const handleReceiveOrder = async (orderId: string, itemName: string, qty: number, unit: string) => {
    if (!confirm(`Confirm receipt of shipment for ${qty} ${unit} of ${itemName}?\n\nThis will automatically restock the inventory and log the transaction.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory/supplier-orders/${orderId}/receive`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert(`✅ Shipment received! ${qty} ${unit} of ${itemName} restocked into inventory.`);
        fetchAllData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to mark shipment as received.");
      }
    } catch (err) {
      console.error("Error receiving supplier order:", err);
      alert("Error marking shipment received.");
    }
  };

  const pendingDentistCount = requests.filter((r) => r.status === "Pending").length;
  const pendingOrdersCount = supplierOrders.filter((o) => o.status === "Requested").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading supply and procurement hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8 md:ml-64 min-h-screen">
        <Header 
          title="Supplies & Procurement Management" 
          subtitle="Low-stock reorder queue, vendor directory, 5-day supplier orders, and dentist requests" 
          showSearch={false}
        />

        {/* Statistical Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div
            onClick={() => setActiveTab("lowStock")}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-amber-300 hover:scale-[1.01] transition duration-200 cursor-pointer group flex items-center gap-4"
          >
            <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-110 transition duration-200">
              <AlertTriangle size={26} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-amber-600 transition">{lowStockItems.length}</h3>
              <p className="font-semibold text-slate-500 mt-0.5 text-sm">Low Stock Items</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("suppliers")}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:scale-[1.01] transition duration-200 cursor-pointer group flex items-center gap-4"
          >
            <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-110 transition duration-200">
              <Building2 size={26} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition">{suppliers.length}</h3>
              <p className="font-semibold text-slate-500 mt-0.5 text-sm">Registered Suppliers</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("orders")}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:scale-[1.01] transition duration-200 cursor-pointer group flex items-center gap-4"
          >
            <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-110 transition duration-200">
              <Truck size={26} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition">{pendingOrdersCount}</h3>
              <p className="font-semibold text-slate-500 mt-0.5 text-sm">Active Orders</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("dentistRequests")}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:scale-[1.01] transition duration-200 cursor-pointer group flex items-center gap-4"
          >
            <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-110 transition duration-200">
              <ClipboardList size={26} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition">{pendingDentistCount}</h3>
              <p className="font-semibold text-slate-500 mt-0.5 text-sm">Dentist Requests</p>
            </div>
          </div>
        </section>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Tab 1: Low Stock Queue */}
            <button
              onClick={() => setActiveTab("lowStock")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 cursor-pointer ${
                activeTab === "lowStock"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
              }`}
            >
              <AlertTriangle size={16} />
              Low Stock Queue
              {lowStockItems.length > 0 && (
                <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "lowStock" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                }`}>
                  {lowStockItems.length}
                </span>
              )}
            </button>

            {/* Tab 2: Supplier Directory */}
            <button
              onClick={() => setActiveTab("suppliers")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 cursor-pointer ${
                activeTab === "suppliers"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
              }`}
            >
              <Building2 size={16} />
              Suppliers Directory ({suppliers.length})
            </button>

            {/* Tab 3: Active Supplier Orders */}
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
              }`}
            >
              <Truck size={16} />
              Supplier Orders
              {pendingOrdersCount > 0 && (
                <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "orders" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
                }`}>
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            {/* Tab 4: Dentist Internal Requests */}
            <button
              onClick={() => setActiveTab("dentistRequests")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 cursor-pointer ${
                activeTab === "dentistRequests"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
              }`}
            >
              <ClipboardList size={16} />
              Dentist Requests
              {pendingDentistCount > 0 && (
                <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === "dentistRequests" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
                }`}>
                  {pendingDentistCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* Action button based on active tab */}
            {activeTab === "suppliers" && (
              <button
                onClick={() => setIsRegisterSupplierOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-200 transition cursor-pointer"
              >
                <Plus size={16} />
                + Register Supplier
              </button>
            )}

            {activeTab === "lowStock" && (
              <button
                onClick={() => {
                  setSelectedItemForOrder(null);
                  setIsSupplierOrderModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-200 transition cursor-pointer"
              >
                <Plus size={16} />
                + New Supplier Order
              </button>
            )}

            <button
              onClick={fetchAllData}
              className="p-2.5 border rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-600"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* --- TAB 1: LOW STOCK PROCUREMENT QUEUE --- */}
        {activeTab === "lowStock" && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 flex-wrap gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={24} />
                  Low Stock Items Requiring Replenishment
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">
                  Items automatically appear here whenever stock drops below the minimum safety limit. Click to order from suppliers with 5-day delivery turnaround.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                {lowStockItems.length} Item(s) in Reorder Queue
              </span>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="text-lg font-bold text-slate-800">All Supplies Adequately Stocked!</h4>
                <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                  There are no inventory items currently below their defined minimum threshold limits.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lowStockItems.map((item) => {
                  const isCritical = item.status === "CRITICAL";
                  return (
                    <div
                      key={item._id}
                      className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4 ${
                        isCritical ? "border-rose-200 hover:border-rose-300" : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              isCritical ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {item.category}
                          </span>
                        </div>

                        <h4 className="text-lg font-bold text-slate-900 mb-1">{item.name}</h4>

                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 my-2 text-xs">
                          <div>
                            <span className="text-slate-400 block">Current Stock</span>
                            <span className="text-sm font-extrabold text-rose-600">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Safety Limit</span>
                            <span className="text-sm font-bold text-slate-800">
                              {item.minimumThreshold} {item.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Shortage</span>
                            <span className="text-sm font-bold text-amber-700">
                              {item.deficit} {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Request from Supplier Button */}
                      <button
                        onClick={() => {
                          setSelectedItemForOrder(item);
                          setIsSupplierOrderModalOpen(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm shadow-blue-200 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Truck size={16} />
                        Request from Supplier (5-Day Delivery)
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* --- TAB 2: SUPPLIERS DIRECTORY --- */}
        {activeTab === "suppliers" && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 flex-wrap gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl flex items-center gap-2">
                  <Building2 className="text-blue-600" size={24} />
                  Registered Dental Suppliers Directory
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">
                  Manage vendor contact information, supply categories, and order channels.
                </p>
              </div>

              <button
                onClick={() => setIsRegisterSupplierOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-200 transition cursor-pointer"
              >
                <Plus size={16} />
                + Register Supplier
              </button>
            </div>

            {suppliers.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Building2 size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold">No suppliers registered yet.</p>
                <button
                  onClick={() => setIsRegisterSupplierOpen(true)}
                  className="mt-3 text-blue-600 font-bold text-xs hover:underline"
                >
                  Click here to register your first supplier
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {suppliers.map((sup) => (
                  <div
                    key={sup._id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-slate-900 text-base">{sup.name}</h4>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {sup.categories?.map((cat) => (
                            <span key={cat} className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>

                      {sup.contactPerson && (
                        <p className="text-xs text-slate-600 font-semibold mb-2">
                          Contact: <span className="text-slate-900">{sup.contactPerson}</span>
                        </p>
                      )}

                      <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          <span className="font-mono">{sup.email}</span>
                        </div>
                        {sup.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <span>{sup.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedItemForOrder(null);
                        setIsSupplierOrderModalOpen(true);
                      }}
                      className="w-full mt-2 py-2 px-3 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Truck size={14} /> Place Order with Supplier
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* --- TAB 3: ACTIVE SUPPLIER ORDERS (5-DAY DELIVERY SLA) --- */}
        {activeTab === "orders" && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 flex-wrap gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl flex items-center gap-2">
                  <Truck className="text-blue-600" size={24} />
                  Active Supplier Orders (5-Day Turnaround)
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">
                  Tracks procurement orders dispatched to suppliers with 5-day delivery deadlines. Click &quot;Receive &amp; Restock&quot; when orders arrive.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedItemForOrder(null);
                  setIsSupplierOrderModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-200 transition cursor-pointer"
              >
                <Plus size={16} />
                + Create Supplier Order
              </button>
            </div>

            {supplierOrders.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Truck size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold">No purchase orders placed with suppliers yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Item &amp; Qty</th>
                      <th className="py-3.5 px-4">Supplier</th>
                      <th className="py-3.5 px-4">Order Date</th>
                      <th className="py-3.5 px-4">Delivery Deadline</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {supplierOrders.map((ord) => {
                      const isDelivered = ord.status === "Delivered";
                      const deadline = new Date(ord.expectedDeliveryDate);
                      const now = new Date();
                      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <tr key={ord._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-900 block">{ord.itemName}</span>
                            <span className="text-xs text-blue-600 font-extrabold">
                              {ord.quantity} {ord.unit}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs">
                            <span className="font-bold text-slate-800 block">{ord.supplierName}</span>
                            <span className="text-slate-400 font-mono text-[11px]">{ord.supplierEmail}</span>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                            {new Date(ord.orderDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className={isDelivered ? "text-slate-400" : "text-amber-500"} />
                              <span className="text-xs font-bold text-slate-800">
                                {deadline.toLocaleDateString()}
                              </span>
                            </div>
                            {!isDelivered && (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md mt-1 inline-block ${
                                  daysLeft <= 1
                                    ? "bg-rose-100 text-rose-700"
                                    : daysLeft <= 3
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {daysLeft > 0 ? `${daysLeft} days remaining (5-day SLA)` : "Due today / delayed"}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                isDelivered
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"
                              }`}
                            >
                              {isDelivered ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                              {isDelivered ? "Delivered & Restocked" : "Order Dispatched"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {!isDelivered ? (
                              <button
                                onClick={() => handleReceiveOrder(ord._id, ord.itemName, ord.quantity, ord.unit)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow transition cursor-pointer flex items-center gap-1 ml-auto"
                              >
                                <PackageCheck size={14} />
                                Receive &amp; Restock
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold italic">Stock updated</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* --- TAB 4: DENTIST SUPPLY REQUESTS --- */}
        {activeTab === "dentistRequests" && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 flex-wrap gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl flex items-center gap-2">
                  <ClipboardList className="text-blue-600" size={24} />
                  Dentist Material Requests
                </h3>
                <p className="text-slate-500 text-sm mt-0.5">
                  Internal clinical requests submitted by dentists for surgical materials and tools.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                {requests.length} Total Requests
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-semibold">
                No dentist supply requests submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Dentist</th>
                      <th className="py-4 px-6">Item requested</th>
                      <th className="py-4 px-6 text-center">Quantity</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
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
                            <p className="font-bold text-slate-900">{formatDoctorName(req.dentist?.fullName) || "Dentist"}</p>
                            <p className="text-xs text-slate-400 font-medium">{req.dentist?.email}</p>
                          </td>
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
                            {req.adminNotes && (
                              <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Logs: {req.adminNotes}</p>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {req.status === "Pending" && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setActionStatus("Approved");
                                    setAdminNotes("");
                                  }}
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setActionStatus("Rejected");
                                    setAdminNotes("");
                                  }}
                                  className="bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {req.status === "Approved" && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setActionStatus("Fulfilled");
                                  setAdminNotes("");
                                }}
                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ml-auto"
                              >
                                <Check size={14} /> Fulfill
                              </button>
                            )}
                            {req.status === "Fulfilled" && (
                              <span className="text-xs text-slate-400 font-bold italic">Fulfilled &amp; Deducted</span>
                            )}
                            {req.status === "Rejected" && (
                              <span className="text-xs text-slate-400 font-bold italic">Rejected</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* --- REGISTER SUPPLIER MODAL --- */}
      <RegisterSupplierModal
        isOpen={isRegisterSupplierOpen}
        onClose={() => setIsRegisterSupplierOpen(false)}
        onSuccess={() => fetchAllData()}
      />

      {/* --- SUPPLIER ORDER MODAL (5-DAY DELIVERY EMAIL NOTIFICATION) --- */}
      <SupplierOrderModal
        isOpen={isSupplierOrderModalOpen}
        onClose={() => {
          setIsSupplierOrderModalOpen(false);
          setSelectedItemForOrder(null);
        }}
        onSuccess={() => {
          fetchAllData();
          setActiveTab("orders");
        }}
        initialItem={selectedItemForOrder}
        suppliers={suppliers}
      />

      {/* --- DENTIST REQUEST ACTION MODAL --- */}
      {selectedRequest && actionStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative max-h-[90vh] modal-scroll">
            <button
              onClick={() => {
                setSelectedRequest(null);
                setActionStatus(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Close
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{actionStatus} Request</h3>
            <p className="text-slate-500 text-sm mb-6">
              Complete action for: <strong>{selectedRequest.itemName}</strong> requested by{" "}
              {formatDoctorName(selectedRequest.dentist?.fullName)}
            </p>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {actionStatus === "Fulfilled"
                    ? "Fulfillment notes (optional)"
                    : actionStatus === "Approved"
                    ? "Approval comments (optional)"
                    : "Reason for rejection (optional)"}
                </label>
                <textarea
                  required={actionStatus === "Rejected"}
                  placeholder={
                    actionStatus === "Rejected"
                      ? "Describe reason for rejection..."
                      : "Add any feedback/notes..."
                  }
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none font-medium text-sm"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-semibold transition cursor-pointer text-white shadow-md ${
                  actionStatus === "Rejected"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                    : actionStatus === "Fulfilled"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                }`}
              >
                Confirm {actionStatus}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
