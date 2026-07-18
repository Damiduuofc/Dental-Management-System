"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Shield,
  Check,
  Search,
  ChevronDown
} from "lucide-react";
import PatientSidebar from "@/components/patient/Sidebar";

interface BillItem {
  name: string;
  cost: number;
}

interface Bill {
  _id: string;
  amount: number;
  amountPaid?: number;
  dueAmount?: number;
  treatment: string;
  status: 'Paid' | 'Unpaid' | 'Pending' | 'Partially Paid';
  paymentMethod?: 'Cash' | 'Card' | 'N/A';
  date: string;
  dentist?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  items?: BillItem[];
}

export default function PatientBilling() {
  const [patient, setPatient] = useState<any>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  // Duplicate payment ref guard
  const paymentConfirmedRef = useRef(false);

  const fetchPatientData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/patient/profile`, {
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json" 
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPatient(data);
      }
    } catch (error) {
      console.error("Error loading patient:", error);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/patient/billing`, {
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json" 
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      }
    } catch (error) {
      console.error("Error loading bills:", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }
      fetchPatientData();
      fetchBills();

      // Check Stripe redirect success
      const searchParams = new URLSearchParams(window.location.search);
      const isSuccess = searchParams.get('payment_success') === 'true';
      const isCancel = searchParams.get('payment_cancel') === 'true';
      const successBillId = searchParams.get('bill_id');
      if (isSuccess && successBillId) {
        if (paymentConfirmedRef.current) return;
        paymentConfirmedRef.current = true;

        // Clean query params immediately
        window.history.replaceState({}, document.title, window.location.pathname);

        const confirmPayment = async () => {
          try {
            const billsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/patient/billing`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (billsRes.ok) {
              const billsList = await billsRes.json();
              const bill = billsList.find((b: any) => b._id === successBillId);
              if (bill) {
                const amountPaidParam = searchParams.get('amount_paid');
                const newlyPaid = amountPaidParam ? Number(amountPaidParam) : (bill.dueAmount !== undefined ? bill.dueAmount : bill.amount);
                const updatedAmountPaid = (bill.amountPaid || 0) + newlyPaid;
                const updatedDueAmount = Math.max(0, bill.amount - updatedAmountPaid);
                const updatedStatus = updatedDueAmount === 0 ? 'Paid' : 'Partially Paid';

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/patient/billing/${successBillId}/pay`, {
                  method: 'PUT',
                  headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    status: updatedStatus,
                    paymentMethod: 'Card',
                    amountPaid: updatedAmountPaid,
                    dueAmount: updatedDueAmount
                  })
                });
                if (res.ok) {
                  alert("Payment successful! Confirmation email has been sent.");
                  window.history.replaceState({}, document.title, window.location.pathname);
                  fetchBills();
                }
              }
            }
          } catch (error) {
            console.error("Error confirming payment:", error);
          }
        };
        confirmPayment();
      } else if (isCancel) {
        alert("Payment was cancelled.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handlePayBill = async (billId: string) => {
    setPaymentLoading(billId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/patient/billing/${billId}/checkout-session`, {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json" 
        }
      });
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to process payment.");
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    } finally {
      setPaymentLoading(null);
    }
  };

  const outstandingBalance = bills
    .filter(b => b.status === 'Unpaid' || b.status === 'Pending' || b.status === 'Partially Paid')
    .reduce((sum, b) => sum + (b.dueAmount !== undefined ? b.dueAmount : b.amount), 0);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <PatientSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 ml-64">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search invoices..."
              className="pl-11 w-72 rounded-full border border-slate-200 bg-white py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <img
              src={`https://ui-avatars.com/api/?name=${patient?.name || "User"}&background=2563eb&color=fff`}
              className="w-10 h-10 rounded-full shadow"
              alt="Patient Profile"
            />
            <div>
              <p className="font-semibold text-sm text-slate-800">{patient?.name || "Loading..."}</p>
              <p className="text-[11px] text-slate-500 font-bold uppercase">Patient</p>
            </div>
          </div>
        </header>

        {/* Billing content */}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Billing & Invoices</h3>
            <p className="text-slate-500 text-sm">Review receipts and complete pending payments</p>
          </div>

          {/* Outstanding Balance card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between max-w-3xl">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Outstanding Balance</p>
              <p className="text-3xl font-black text-slate-800 mt-1">Rs. {outstandingBalance.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl">
              <CreditCard className="text-blue-600" size={24} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Bills List */}
            <div className="md:col-span-2 space-y-4">
              {bills.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border text-center text-slate-500 font-medium shadow-sm">
                  No billing statements found.
                </div>
              ) : (
                bills.map((bill) => {
                  const isExpanded = expandedBillId === bill._id;
                  return (
                    <div key={bill._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden">
                      {/* Main Card Header (Row) */}
                      <div className="p-6 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            bill.status === 'Paid' ? 'bg-green-50 border-green-200 text-green-700' :
                            bill.status === 'Partially Paid' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            bill.status === 'Pending' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {bill.status}
                          </span>
                          <h4 className="font-bold text-lg text-slate-800 mt-2">{bill.treatment}</h4>
                          <p className="text-xs text-slate-400 mt-1 font-semibold">
                            Date: {new Date(bill.date).toLocaleDateString()} | Method: {bill.paymentMethod || 'N/A'}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase">Amount Due</p>
                            <p className="text-xl font-black text-slate-800 mt-0.5">Rs. {(bill.dueAmount !== undefined ? bill.dueAmount : (bill.status === 'Paid' ? 0 : bill.amount)).toLocaleString()}</p>
                            {bill.amountPaid !== undefined && bill.amountPaid > 0 && (
                              <p className="text-[10px] text-slate-400 font-medium">Total: Rs. {bill.amount.toLocaleString()}</p>
                            )}
                          </div>

                          {(bill.status === 'Unpaid' || bill.status === 'Partially Paid') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayBill(bill._id);
                              }}
                              disabled={paymentLoading === bill._id}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-md shadow-blue-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <CreditCard size={16} />
                              {paymentLoading === bill._id ? "Processing..." : "Pay Now"}
                            </button>
                          )}
                          {bill.status === 'Paid' && (
                            <span className="bg-green-100 text-green-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 border border-green-200">
                              <Check size={14} /> Settled
                            </span>
                          )}

                          {/* Toggle Expand Details */}
                          <button
                            onClick={() => setExpandedBillId(isExpanded ? null : bill._id)}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          >
                            <ChevronDown size={18} className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Details Container */}
                      {isExpanded && (
                        <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-4">
                          {bill.dentist && (
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Treating Dentist</p>
                              <div className="flex items-center gap-3 mt-2 bg-white p-3 rounded-2xl border border-slate-100 w-fit">
                                <img
                                  src={`https://ui-avatars.com/api/?name=${bill.dentist.fullName}&background=0ea5e9&color=fff`}
                                  className="w-9 h-9 rounded-full shadow"
                                  alt="Dentist Profile"
                                />
                                <div>
                                  <p className="text-sm font-bold text-slate-800">Dr. {bill.dentist.fullName}</p>
                                  <p className="text-xs text-slate-505 text-slate-500 font-semibold">{bill.dentist.email} • {bill.dentist.phoneNumber}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Itemized Services & Treatment Breakdown</p>
                            {bill.items && bill.items.length > 0 ? (
                              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100 max-w-xl">
                                {bill.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center px-4 py-3 text-sm">
                                    <span className="font-semibold text-slate-700">{item.name}</span>
                                    <span className="font-bold text-slate-900">Rs. {item.cost.toLocaleString()}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center px-4 py-3.5 bg-slate-50/50 text-sm font-black border-t">
                                  <span className="text-slate-800">Total Invoice Amount</span>
                                  <span className="text-blue-600">Rs. {bill.amount.toLocaleString()}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white rounded-2xl border border-slate-100 p-4 flex justify-between items-center text-sm font-semibold text-slate-700 max-w-xl">
                                <span>{bill.treatment}</span>
                                <span className="font-bold text-slate-900">Rs. {bill.amount.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Clinic payment sidebar */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white h-fit shadow-lg shadow-slate-100">
              <Shield className="text-blue-400 mb-6" size={32} />
              <h4 className="font-bold text-lg">Secure Checkouts</h4>
              <p className="text-sm opacity-80 mt-2 font-medium">All financial transactions at DentCare are fully secured with industry-grade SSL encryption. Receipts will be instantly emailed to your registered inbox.</p>
              <div className="mt-8 border-t border-slate-700/50 pt-6">
                <p className="text-xs opacity-50 uppercase tracking-wider">Help Desk</p>
                <p className="text-sm mt-1 font-semibold">billing@dentcare.com</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
