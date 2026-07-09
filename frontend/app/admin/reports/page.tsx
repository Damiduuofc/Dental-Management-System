'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, TrendingUp, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';

interface SummaryData {
  totalSales: number;
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

export default function AdminReportsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error("Error fetching billing summary:", err);
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
        fetchSummary();
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/admin/login");
      }
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Generating financial reports...</p>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Financial Reports</h1>
            <p className="text-slate-500 mt-1">Review clinic revenue, invoices, and outstanding account balances.</p>
          </div>
          <button 
            onClick={fetchSummary}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw size={16} /> Sync Data
          </button>
        </div>

        {summary && (
          <div className="space-y-8">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-blue-700 to-blue-600 text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <span className="p-3 bg-white/10 rounded-xl">
                    <TrendingUp size={24} />
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-white/20 uppercase tracking-wider">Collected</span>
                </div>
                <div className="text-3xl font-black">Rs. {summary.totalSales.toLocaleString()}</div>
                <div className="text-sm opacity-90 mt-2 font-medium">Total Sales Revenue</div>
              </div>

              {/* Outstanding Balances */}
              <div className="bg-gradient-to-br from-rose-600 to-rose-500 text-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
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
      </main>
    </div>
  );
}
