"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import SupplierOrderModal, { Supplier } from "@/components/admin/SupplierOrderModal";
import InventoryLogsModal from "@/components/admin/InventoryLogsModal";
import {
  AlertTriangle,
  TrendingUp,
  Boxes,
  Plus,
  Search,
  Edit3,
  Trash2,
  RefreshCw,
  X,
  MinusCircle,
  Truck,
  FileDown,
  History,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface InventoryItem {
  _id: string;
  name: string;
  category: "Supply" | "Medication";
  quantity: number;
  minimumThreshold: number;
  unit: string;
  price: number;
  description?: string;
  status: "CRITICAL" | "Low Stock" | "FULL";
  createdAt: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "LOW_STOCK" | "Supply" | "Medication">("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isSupplierOrderModalOpen, setIsSupplierOrderModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [orderItemForSupplier, setOrderItemForSupplier] = useState<InventoryItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "Supply",
    quantity: 0,
    minimumThreshold: 10,
    unit: "Box",
    price: 0,
    description: "",
  });
  const [actionQty, setActionQty] = useState(1);
  const [actionNotes, setActionNotes] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009") + "/api";

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory/suppliers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
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
        fetchInventory();
        fetchSuppliers();
      } catch (err) {
        console.error("Auth parsing error in inventory page:", err);
        router.push("/admin/login");
      }
    }
  }, [router]);

  // Combined Search and Category Filter
  useEffect(() => {
    let result = [...items];

    // Filter by Active Tab / Category
    if (activeFilter === "LOW_STOCK") {
      result = result.filter((item) => item.status === "CRITICAL" || item.status === "Low Stock");
    } else if (activeFilter === "Supply" || activeFilter === "Medication") {
      result = result.filter((item) => item.category === activeFilter);
    }

    // Search query filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      );
    }

    setFilteredItems(result);
  }, [searchQuery, activeFilter, items]);

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Inventory item added successfully!");
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          category: "Supply",
          quantity: 0,
          minimumThreshold: 10,
          unit: "Box",
          price: 0,
          description: "",
        });
        fetchInventory();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to add item");
      }
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  // Edit Item
  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory/${selectedItem._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Inventory item updated successfully!");
        setIsEditModalOpen(false);
        setSelectedItem(null);
        fetchInventory();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to update item");
      }
    } catch (err) {
      console.error("Error updating item:", err);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Item deleted successfully!");
        fetchInventory();
      } else {
        alert("Failed to delete item");
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  // Restock action
  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory/${selectedItem._id}/restock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: actionQty,
          notes: actionNotes,
        }),
      });

      if (res.ok) {
        alert("Restocked successfully!");
        setIsRestockModalOpen(false);
        setActionQty(1);
        setActionNotes("");
        setSelectedItem(null);
        fetchInventory();
      } else {
        alert("Failed to restock item");
      }
    } catch (err) {
      console.error("Restock error:", err);
    }
  };

  // Record Usage action
  const handleUseItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory/${selectedItem._id}/use`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: actionQty,
          notes: actionNotes,
        }),
      });

      if (res.ok) {
        alert("Usage recorded successfully!");
        setIsUseModalOpen(false);
        setActionQty(1);
        setActionNotes("");
        setSelectedItem(null);
        fetchInventory();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to record usage");
      }
    } catch (err) {
      console.error("Record usage error:", err);
    }
  };

  // Export Procurement PDF Report
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/inventory/report/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `DentCare_Inventory_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download inventory PDF report.");
      }
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Error generating PDF report.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Statistics
  const criticalCount = items.filter((item) => item.status === "CRITICAL").length;
  const lowCount = items.filter((item) => item.status === "Low Stock").length;
  const totalLowStock = criticalCount + lowCount;
  const totalCount = items.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 p-8 md:ml-64">
        {/* Header */}
        <Header 
          title="Inventory & Store Management" 
          subtitle="Add, update, track supplies and automate 5-day procurement reorders" 
          showSearch={false}
        />

        {/* Low Stock Warning Banner */}
        {totalLowStock > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 text-slate-800 rounded-2xl p-5 md:p-6 mb-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                <AlertTriangle size={28} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-amber-200">
                    Automated Alert
                  </span>
                  <h4 className="font-extrabold text-lg md:text-xl text-slate-900">
                    {totalLowStock} Item{totalLowStock > 1 ? "s" : ""} Below Minimum Safety Threshold!
                  </h4>
                </div>
                <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                  {criticalCount > 0 ? `${criticalCount} critical items require urgent reordering. ` : ""}
                  Supplies can be requested directly from registered suppliers with a 5-day delivery turnaround.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setActiveFilter("LOW_STOCK")}
                className="flex-1 md:flex-initial bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                View Low Stock ({totalLowStock})
              </button>
              <button
                onClick={() => router.push("/admin/supply")}
                className="flex-1 md:flex-initial bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap shadow-sm"
              >
                Procurement Hub <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Statistical Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Critical Stock */}
          <div
            onClick={() => setActiveFilter("LOW_STOCK")}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-rose-300 hover:scale-[1.01] transition duration-200 flex items-center gap-4 cursor-pointer group"
            title="Click to filter by low stock"
          >
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 group-hover:scale-110 transition duration-200">
              <AlertTriangle size={30} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-rose-600 transition">{criticalCount}</h3>
              <p className="font-semibold text-slate-500 mt-0.5 text-sm">Critical Stock (≤20%)</p>
            </div>
          </div>

          {/* Low Stock */}
          <div
            onClick={() => setActiveFilter("LOW_STOCK")}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-amber-300 hover:scale-[1.01] transition duration-200 flex items-center gap-4 cursor-pointer group"
            title="Click to filter by low stock"
          >
            <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-110 transition duration-200">
              <TrendingUp size={30} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-amber-600 transition">{lowCount}</h3>
              <p className="font-semibold text-slate-500 mt-0.5 text-sm">Low Stock Alerts</p>
            </div>
          </div>

          {/* Total Items */}
          <div
            onClick={() => setActiveFilter("ALL")}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:scale-[1.01] transition duration-200 flex items-center gap-4 cursor-pointer group"
            title="Click to show all items"
          >
            <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-110 transition duration-200">
              <Boxes size={30} />
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition">{totalCount}</h3>
              <p className="font-semibold text-slate-500 mt-0.5 text-sm">Total Cataloged Items</p>
            </div>
          </div>
        </section>

        {/* Filter / Actions Bar */}
        <section className="flex flex-col gap-4 mb-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search inventory by name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 w-full rounded-2xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Top Operational Action Buttons */}
            <div className="flex gap-2.5 w-full lg:w-auto flex-wrap justify-end">
              {/* Transaction Logs Button */}
              <button
                onClick={() => setIsLogsModalOpen(true)}
                className="px-4 py-2.5 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                title="View usage and restocking transaction audit logs"
              >
                <History size={16} />
                Transaction Logs
              </button>

              {/* Procurement Report PDF */}
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-4 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                title="Download official PDF report for procurement planning"
              >
                <FileDown size={16} />
                {downloadingPdf ? "Exporting..." : "Procurement Report (PDF)"}
              </button>

              {/* Add New Item Button */}
              <button
                onClick={() => {
                  setFormData({
                    name: "",
                    category: "Supply",
                    quantity: 0,
                    minimumThreshold: 10,
                    unit: "Box",
                    price: 0,
                    description: "",
                  });
                  setIsAddModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition cursor-pointer"
              >
                <Plus size={16} />
                + Add Item
              </button>

              {/* Refresh Button */}
              <button
                onClick={fetchInventory}
                className="p-2.5 border rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-600"
                title="Reload Inventory"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filter View:</span>
            
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Items ({totalCount})
            </button>

            {/* Dedicated Low Stock Alert Filter Button */}
            <button
              onClick={() => setActiveFilter("LOW_STOCK")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeFilter === "LOW_STOCK"
                  ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-300"
                  : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle size={14} />
              Low Stock Alerts ({totalLowStock})
            </button>

            <button
              onClick={() => setActiveFilter("Supply")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === "Supply"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Supplies
            </button>

            <button
              onClick={() => setActiveFilter("Medication")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === "Medication"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Medications
            </button>
          </div>
        </section>

        {/* Inventory Item Cards */}
        <section className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 font-semibold shadow-sm">
              No inventory items found matching your current filter.
            </div>
          ) : (
            filteredItems.map((item) => {
              const percent = Math.min(100, Math.max(0, (item.quantity / item.minimumThreshold) * 100));
              const isLowStock = item.status === "CRITICAL" || item.status === "Low Stock";

              let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
              let progressColor = "bg-blue-600";
              if (item.status === "CRITICAL") {
                badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                progressColor = "bg-rose-600";
              } else if (item.status === "Low Stock") {
                badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                progressColor = "bg-amber-500";
              }

              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-2xl border p-5 md:p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    isLowStock ? "border-amber-200 bg-amber-50/10" : "border-slate-200"
                  }`}
                >
                  {/* Left item details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="text-lg font-bold text-slate-900">{item.name}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${badgeColor}`}>
                        {item.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                        {item.category}
                      </span>
                      {isLowStock && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Deficit: {Math.max(0, item.minimumThreshold - item.quantity)} {item.unit}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-6 text-sm font-semibold text-slate-500 mb-3 flex-wrap">
                      <span>
                        Current Stock: <strong className={isLowStock ? "text-rose-600" : "text-slate-900"}>{item.quantity}</strong> {item.unit}
                      </span>
                      <span>
                        Safety Limit: <strong className="text-slate-900">{item.minimumThreshold}</strong>
                      </span>
                      <span>
                        Unit Price: <strong className="text-slate-900">Rs. {item.price}</strong>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-100 relative max-w-xl">
                      <div className={`h-full ${progressColor} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2.5 flex-wrap self-end md:self-center">
                    {/* Request from Supplier Button */}
                    <button
                      onClick={() => {
                        setOrderItemForSupplier(item);
                        setIsSupplierOrderModalOpen(true);
                      }}
                      title="Request reorder from supplier with 5-day delivery"
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                        isLowStock
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <Truck size={15} />
                      Request from Supplier
                    </button>

                    {/* Record Usage Button */}
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setActionQty(1);
                        setActionNotes("");
                        setIsUseModalOpen(true);
                      }}
                      title="Record Usage"
                      className="p-2.5 text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    >
                      <MinusCircle size={18} />
                    </button>

                    {/* Quick Restock Plus Button */}
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setActionQty(1);
                        setActionNotes("");
                        setIsRestockModalOpen(true);
                      }}
                      title="Manual Restock"
                      className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow shadow-blue-200 transition cursor-pointer"
                    >
                      <Plus size={18} />
                    </button>

                    {/* Edit Details Button */}
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setFormData({
                          name: item.name,
                          category: item.category,
                          quantity: item.quantity,
                          minimumThreshold: item.minimumThreshold,
                          unit: item.unit,
                          price: item.price,
                          description: item.description || "",
                        });
                        setIsEditModalOpen(true);
                      }}
                      title="Edit Item Details"
                      className="p-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                    >
                      <Edit3 size={18} />
                    </button>

                    {/* Delete Item Button */}
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      title="Delete Item"
                      className="p-2.5 text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* --- SUPPLIER ORDER MODAL (5-DAY DELIVERY EMAIL) --- */}
      <SupplierOrderModal
        isOpen={isSupplierOrderModalOpen}
        onClose={() => {
          setIsSupplierOrderModalOpen(false);
          setOrderItemForSupplier(null);
        }}
        onSuccess={() => {
          fetchInventory();
        }}
        initialItem={orderItemForSupplier}
        suppliers={suppliers}
      />

      {/* --- INVENTORY AUDIT TRANSACTION LOGS MODAL --- */}
      <InventoryLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
      />

      {/* --- ADD ITEM MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative max-h-[90vh] modal-scroll">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Add New Inventory Item</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter item name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Supply">Supply</option>
                    <option value="Medication">Medication</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Unit Type</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter unit of measure"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Qty</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minimumThreshold}
                    onChange={(e) => setFormData({ ...formData, minimumThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Price (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  placeholder="Clinical specifications, supplier brand, or storage notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none font-medium"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-cancel">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition cursor-pointer"
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT DETAILS MODAL --- */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative max-h-[90vh] modal-scroll">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Edit Item Details</h3>
            <form onSubmit={handleEditItem} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Supply">Supply</option>
                    <option value="Medication">Medication</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Unit Type</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minimumThreshold}
                    onChange={(e) => setFormData({ ...formData, minimumThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Price (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  placeholder="Additional specifications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none font-medium"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-cancel">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUICK RESTOCK MODAL --- */}
      {isRestockModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] modal-scroll">
            <button
              onClick={() => setIsRestockModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Restock Supply</h3>
            <p className="text-slate-500 text-sm mb-6">Add inventory quantities to: <strong>{selectedItem.name}</strong></p>
            <form onSubmit={handleRestock} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity Added ({selectedItem.unit})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={actionQty}
                  onChange={(e) => setActionQty(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes / Logs</label>
                <input
                  type="text"
                  placeholder="Enter a reason or note"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsRestockModalOpen(false)} className="btn-cancel">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition cursor-pointer"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RECORD USAGE MODAL --- */}
      {isUseModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] modal-scroll">
            <button
              onClick={() => setIsUseModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Record Usage</h3>
            <p className="text-slate-500 text-sm mb-6">Log deduction of stock from: <strong>{selectedItem.name}</strong></p>
            <form onSubmit={handleUseItem} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity Used ({selectedItem.unit})</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.quantity}
                  required
                  value={actionQty}
                  onChange={(e) => setActionQty(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <span className="text-xs text-slate-400 mt-1 block">Max available: {selectedItem.quantity}</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes / Logs</label>
                <input
                  type="text"
                  placeholder="Enter a reason or note"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsUseModalOpen(false)} className="btn-cancel">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-200 transition cursor-pointer"
                >
                  Record Usage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
