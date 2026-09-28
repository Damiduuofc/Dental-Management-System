'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, TrendingUp, TrendingDown, AlertCircle, Calendar, RefreshCw, Boxes, FileDown, Activity } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import IncomeExpenseChart from '@/components/admin/IncomeExpenseChart';

interface SummaryData {
  totalSales: number;
  totalExpenses?: number;
  totalOutstanding: number;
  statusCounts: {
    Paid: number;
    Unpaid: number;
    Pending: number;
    'Partially Paid': number;
  };
  treatmentRevenue: {
    [key: string]: number;
  };
  totalInvoices: number;
}

interface InventoryItemSummary {
  name: string;
  category: string;
  quantity: number;
  minimumThreshold: number;
  unit: string;
  price: number;
  value: number;
  status: 'FULL' | 'LOW STOCK' | 'CRITICAL';
}

interface InventoryReportData {
  totalItems: number;
  lowStockCount: number;
  criticalStockCount: number;
  totalValue: number;
  items: InventoryItemSummary[];
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'financial' | 'inventory'>('financial');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009';

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/admin/billing/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error("Error fetching billing summary:", err);
    }
  };

  const fetchInventoryReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/inventory/report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInventoryReport(data);
      }
    } catch (err) {
      console.error("Error fetching inventory summary report:", err);
    }
  };

  const fetchAllReports = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchInventoryReport()]);
    setLoading(false);
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
        fetchAllReports();
      } catch (err) {
        console.error("Error parsing user profile in reports:", err);
        router.push("/admin/login");
      }
    }
  }, [router]);

  const downloadInventoryPdf = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/inventory/report/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_status_report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Failed to download inventory PDF report");
      }
    } catch (err) {
      console.error("Error downloading PDF:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Generating clinic reports...</p>
        </div>
      </div>
    );
  }

  const treatmentRevenueArray = summary
    ? Object.entries(summary.treatmentRevenue).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-8 md:ml-64">
        {/* Header */}
        <Header 
          title="Clinic Status Reports" 
          subtitle="Review financial stats and inventory procurement reports" 
          showSearch={false}
        />

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 mb-8 gap-6">
          <button
            onClick={() => setActiveTab('financial')}
            className={`pb-4 px-2 text-sm font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'financial'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp size={18} /> Financial Reports
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-4 px-2 text-sm font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Boxes size={18} /> Inventory Status Reports
          </button>
        </div>

        {activeTab === 'financial' && summary && (
          <div className="space-y-8 animate-fade-in">
            {/* Sync bar */}
            <div className="flex justify-end">
              <button 
                onClick={fetchAllReports}
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold hover:bg-slate-50 transition cursor-pointer shadow-sm text-sm"
              >
                <RefreshCw size={16} /> Sync Financial Data
              </button>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-3 bg-white/10 rounded-xl">
                    <TrendingUp size={24} />
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-white/20 uppercase tracking-wider">Incoming</span>
                </div>
                <div className="text-3xl font-black">Rs. {summary.totalSales.toLocaleString()}</div>
                <div className="text-sm opacity-90 mt-2 font-medium">Total Sales Revenue</div>
              </div>

              {/* Total Expenses */}
              <div className="bg-gradient-to-br from-rose-600 to-rose-500 text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-3 bg-white/10 rounded-xl">
                    <TrendingDown size={24} />
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-white/20 uppercase tracking-wider">Expenses</span>
                </div>
                <div className="text-3xl font-black">Rs. {(summary.totalExpenses || 0).toLocaleString()}</div>
                <div className="text-sm opacity-90 mt-2 font-medium">Total Supply & Stock Expenses</div>
              </div>

              {/* Outstanding Balances */}
              <div className="bg-gradient-to-br from-amber-600 to-amber-500 text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-3 bg-white/10 rounded-xl">
                    <AlertCircle size={24} />
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-white/20 uppercase tracking-wider">Receivable</span>
                </div>
                <div className="text-3xl font-black">Rs. {summary.totalOutstanding.toLocaleString()}</div>
                <div className="text-sm opacity-90 mt-2 font-medium">Total Outstanding Balance</div>
              </div>

              {/* Total Invoices */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-3 bg-white/10 rounded-xl">
                    <FileText size={24} />
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-white/20 uppercase tracking-wider">Volume</span>
                </div>
                <div className="text-3xl font-black">{summary.totalInvoices}</div>
                <div className="text-sm opacity-90 mt-2 font-medium">Invoices Generated</div>
              </div>
            </div>

            {/* 1-Month Filtered Incoming vs Expenses Line Graph */}
            <IncomeExpenseChart showReportLink={false} />

            {/* Detailed Analytics Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Payment Status Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Payment Status Distribution</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Paid Invoices', val: summary.statusCounts.Paid || 0, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: 'Partially Paid', val: summary.statusCounts['Partially Paid'] || 0, color: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50' },
                    { label: 'Pending Statements', val: summary.statusCounts.Pending || 0, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
                    { label: 'Unpaid Invoices', val: summary.statusCounts.Unpaid || 0, color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' }
                  ].map((item, idx) => {
                    const percentage = summary.totalInvoices > 0 
                      ? Math.round((item.val / summary.totalInvoices) * 100) 
                      : 0;

                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span className="text-slate-600">{item.label}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${item.bg} ${item.text}`}>{item.val} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revenue Breakdown by Treatment */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Collected by Treatment</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {treatmentRevenueArray.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 text-sm font-semibold">No revenue transactions recorded.</div>
                  ) : (
                    treatmentRevenueArray.map(([treatmentName, revenue], idx) => {
                      const totalCollected = summary.totalSales;
                      const percentage = totalCollected > 0 
                        ? Math.round((revenue / totalCollected) * 100) 
                        : 0;

                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center text-sm font-semibold">
                            <span className="text-slate-700">{treatmentName}</span>
                            <span className="text-slate-900">Rs. {revenue.toLocaleString()} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && inventoryReport && (
          <div className="space-y-8 animate-fade-in">
            {/* Procurements Bar */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-500">Status report for procurement planning.</span>
              <div className="flex gap-3">
                <button
                  onClick={downloadInventoryPdf}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-md shadow-blue-100 transition cursor-pointer text-sm"
                >
                  <FileDown size={16} /> Download PDF Report
                </button>
                <button 
                  onClick={fetchAllReports}
                  className="bg-white border border-slate-200 text-slate-700 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Inventory Aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Items</h4>
                <div className="text-3xl font-black text-slate-900">{inventoryReport.totalItems}</div>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Low Stock</h4>
                <div className="text-3xl font-black text-amber-500">{inventoryReport.lowStockCount}</div>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Critical Stock</h4>
                <div className="text-3xl font-black text-rose-500">{inventoryReport.criticalStockCount}</div>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Value</h4>
                <div className="text-3xl font-black text-slate-900">Rs. {inventoryReport.totalValue.toLocaleString()}</div>
              </div>
            </div>

            {/* Inventory status list table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Procurement Items Checklist</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Item Name</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6 text-center">Available Stock</th>
                      <th className="py-4 px-6 text-center">Min Threshold</th>
                      <th className="py-4 px-6 text-right">Value (Rs.)</th>
                      <th className="py-4 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm font-semibold text-slate-700">
                    {inventoryReport.items.map((item, idx) => {
                      let statusBadge = "bg-slate-50 text-slate-500";
                      if (item.status === 'CRITICAL') statusBadge = 'bg-rose-100 text-rose-700';
                      else if (item.status === 'LOW STOCK') statusBadge = 'bg-amber-100 text-amber-700';
                      else if (item.status === 'FULL') statusBadge = 'bg-emerald-100 text-emerald-700';

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-4 px-6 text-slate-900">{item.name}</td>
                          <td className="py-4 px-6 text-slate-400 text-xs font-bold uppercase">{item.category}</td>
                          <td className="py-4 px-6 text-center">{item.quantity} {item.unit}</td>
                          <td className="py-4 px-6 text-center text-slate-400">{item.minimumThreshold}</td>
                          <td className="py-4 px-6 text-right">{(item.quantity * item.price).toLocaleString()}</td>
                          <td className="py-4 px-6 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-black uppercase ${statusBadge}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
