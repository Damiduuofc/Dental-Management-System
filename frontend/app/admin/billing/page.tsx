'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, CreditCard, Edit, Check, X, ShieldAlert } from 'lucide-react';
import Sidebar from '@/components/admin/Sidebar';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
}

interface BillItem {
  name: string;
  cost: number;
  customName?: string;
}

interface Bill {
  _id: string;
  patient: Patient;
  amount: number;
  treatment: string;
  status: 'Paid' | 'Unpaid' | 'Pending' | 'Partially Paid';
  paymentMethod: 'Cash' | 'Card' | 'N/A';
  items?: BillItem[];
  date: string;
  createdAt: string;
}

export default function AdminBillingPage() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  
  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  
  const [patientId, setPatientId] = useState('');
  const [status, setStatus] = useState<'Paid' | 'Unpaid' | 'Pending' | 'Partially Paid'>('Unpaid');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'N/A'>('N/A');
  const [items, setItems] = useState<BillItem[]>([{ name: 'Regular Checkup', cost: 0 }]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const treatmentsList = [
    'Regular Checkup',
    'Root Canal',
    'Consultation',
    'Orthodontics',
    'Teeth Cleaning',
    'Teeth Whitening',
    'Fillings',
    'Crowns & Bridges',
    'Dental Implants',
    'Dentures',
    'Tooth Extraction',
    'Gum Treatment',
    'Scaling & Polishing',
    'Dental X-Ray',
    'Pediatric Dentistry',
    'Custom'
  ];

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBills(data);
        setFilteredBills(data);
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchBills(), fetchPatients()]);
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
        loadData();

        // Check Stripe redirect success
        const searchParams = new URLSearchParams(window.location.search);
        const isSuccess = searchParams.get('payment_success') === 'true';
        const successBillId = searchParams.get('bill_id');
        if (isSuccess && successBillId) {
          const confirmPayment = async () => {
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing/${successBillId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  status: 'Paid',
                  paymentMethod: 'Card'
                })
              });
              if (res.ok) {
                alert("Card payment recorded successfully! Confirmation email has been sent.");
                window.history.replaceState({}, document.title, window.location.pathname);
                fetchBills();
              }
            } catch (error) {
              console.error("Error confirming payment:", error);
            }
          };
          confirmPayment();
        }
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/admin/login");
      }
    }
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBills(bills);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = bills.filter(b => 
        b.patient?.name?.toLowerCase().includes(query) ||
        b.patient?.email?.toLowerCase().includes(query) ||
        b.treatment?.toLowerCase().includes(query) ||
        b.status?.toLowerCase().includes(query)
      );
      setFilteredBills(filtered);
    }
  }, [searchQuery, bills]);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      alert("Please select a patient.");
      return;
    }

    const finalItems = items.map(item => ({
      name: item.name === 'Custom' ? (item.customName || 'Custom Service') : item.name,
      cost: Number(item.cost) || 0
    }));

    if (finalItems.some(i => !i.name || i.cost <= 0)) {
      alert("Please make sure all items have a valid service name and cost greater than 0.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const initialStatus = (paymentMethod === 'Card' && status === 'Paid') ? 'Pending' : status;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId,
          status: initialStatus,
          paymentMethod,
          items: finalItems
        })
      });

      if (res.ok) {
        const data = await res.json();
        const createdBill = data.bill;

        if (paymentMethod === 'Card' && status === 'Paid' && createdBill) {
          const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing/${createdBill._id}/checkout-session`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (checkRes.ok) {
            const { url } = await checkRes.json();
            window.location.href = url;
            return;
          }
        }

        alert("Invoice generated successfully!");
        setIsNewModalOpen(false);
        setPatientId('');
        setStatus('Unpaid');
        setPaymentMethod('N/A');
        setItems([{ name: 'Regular Checkup', cost: 0 }]);
        fetchBills();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to generate invoice.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error creating invoice.");
    }
  };

  const handlePayCash = async (billId: string) => {
    const finalItems = items.map(item => ({
      name: item.name === 'Custom' ? (item.customName || 'Custom Service') : item.name,
      cost: Number(item.cost) || 0
    }));

    if (finalItems.some(i => !i.name || i.cost <= 0)) {
      alert("Please make sure all items have a valid service name and cost greater than 0.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Paid',
          paymentMethod: 'Cash',
          items: finalItems
        })
      });

      if (res.ok) {
        alert("Payment successful! Confirmation email has been sent to the patient.");
        setIsEditModalOpen(false);
        setSelectedBill(null);
        setItems([{ name: 'Regular Checkup', cost: 0 }]);
        fetchBills();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to process Cash payment.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error processing payment.");
    }
  };

  const handlePayCard = async (billId: string) => {
    const finalItems = items.map(item => ({
      name: item.name === 'Custom' ? (item.customName || 'Custom Service') : item.name,
      cost: Number(item.cost) || 0
    }));

    if (finalItems.some(i => !i.name || i.cost <= 0)) {
      alert("Please make sure all items have a valid service name and cost greater than 0.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Pending',
          paymentMethod: 'Card',
          items: finalItems
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || "Failed to prepare invoice items.");
        return;
      }

      const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing/${billId}/checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (checkRes.ok) {
        const { url } = await checkRes.json();
        window.location.href = url;
      } else {
        const errData = await checkRes.json();
        alert(errData.message || "Failed to initiate Card payment.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error starting card payment.");
    }
  };

  const openEditModal = (bill: Bill) => {
    setSelectedBill(bill);
    setStatus(bill.status);
    setPaymentMethod(bill.paymentMethod || 'N/A');
    if (bill.items && bill.items.length > 0) {
      setItems(bill.items.map(item => ({ name: item.name, cost: item.cost })));
    } else {
      setItems([{ name: bill.treatment, cost: bill.amount }]);
    }
    setIsEditModalOpen(true);
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Paid': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-rose-50 text-rose-700 border-rose-200'; // Unpaid
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading billing statements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-8 md:ml-64">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Billing & Invoices</h1>
            <p className="text-slate-500 mt-1">Generate itemized dental invoices and track payment balances.</p>
          </div>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-blue-100 transition cursor-pointer"
          >
            <Plus size={20} /> Generate Invoice
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8 shadow-sm rounded-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition placeholder:text-slate-400 font-medium" 
            placeholder="Search by Patient name, Email, Treatment, or Status..." 
          />
        </div>

        {/* Table list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {filteredBills.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium">No invoices found.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Invoice Date</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Patient</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Treatment Details</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm text-right">Fee amount</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Status</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => (
                    <tr key={bill._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="p-4 text-slate-600 text-sm font-semibold">
                        {new Date(bill.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-900">
                        {bill.patient?.name || 'Unknown Patient'}<br/>
                        <span className="text-xs text-slate-400 font-normal">{bill.patient?.email}</span>
                      </td>
                      <td className="p-4 text-slate-600 text-sm font-medium">
                        {bill.treatment}<br/>
                        <span className="text-xs text-slate-400 font-normal">Method: {bill.paymentMethod || 'N/A'}</span>
                      </td>
                      <td className="p-4 text-slate-900 text-sm font-bold text-right">
                        Rs. {bill.amount.toLocaleString()}
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`text-xs px-3 py-1 rounded-full border font-bold uppercase tracking-wider ${getStatusStyle(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {bill.status === 'Paid' ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit uppercase tracking-wider">
                            <Check size={12} /> Settled
                          </span>
                        ) : (
                          <button 
                            onClick={() => openEditModal(bill)}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard size={12} /> Pay Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Generate Invoice Modal */}
      {isNewModalOpen && (() => {
        const totalAmount = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Generate Invoice</h2>
              <p className="text-slate-500 text-sm mb-6">Create a new itemized dental bill for a patient.</p>

              <form onSubmit={handleGenerateInvoice} className="space-y-4">
                <div>
                  <label className="block text-slate-700 text-sm font-bold mb-1.5">Select Patient</label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                    ))}
                  </select>
                </div>

                {/* Itemized list creator */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-700 text-sm font-bold">Billing Items</label>
                    <button
                      type="button"
                      onClick={() => setItems([...items, { name: 'Regular Checkup', cost: 0 }])}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                      <div className="flex-1 space-y-2">
                        <select
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].name = e.target.value;
                            setItems(updated);
                          }}
                          className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                        >
                          {treatmentsList.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>

                        {item.name === 'Custom' && (
                          <input
                            type="text"
                            placeholder="Enter custom treatment type..."
                            value={item.customName || ''}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].customName = e.target.value;
                              setItems(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        )}
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="Cost"
                          value={item.cost || ''}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].cost = parseFloat(e.target.value) || 0;
                            setItems(updated);
                          }}
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                          required
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = items.filter((_, i) => i !== idx);
                            setItems(updated);
                          }}
                          className="p-2.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition mt-0.5 cursor-pointer animate-fade-in"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Dynamic Total Sum Card */}
                <div className="p-4 bg-blue-50 rounded-2xl text-center border border-blue-100 shadow-sm">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Invoice Sum</span>
                  <p className="text-2xl font-black text-blue-800 mt-0.5">Rs. {totalAmount.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-bold mb-1.5">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="N/A">N/A</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-bold mb-1.5">Initial Payment Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4 border-t mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewModalOpen(false);
                      setItems([{ name: 'Regular Checkup', cost: 0 }]);
                    }}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-100 cursor-pointer"
                  >
                    Generate
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Record Payment / Edit Modal */}
      {isEditModalOpen && selectedBill && (() => {
        const totalAmount = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Record Transaction</h2>
              <p className="text-slate-500 text-sm mb-6 font-medium">Update invoice items or complete client checkouts.</p>

              <div className="p-4 bg-slate-50 rounded-2xl mb-6 text-sm text-slate-600 space-y-1.5 font-medium border border-slate-100">
                <div><span className="text-slate-400 font-normal">Patient Name:</span> {selectedBill.patient?.name}</div>
                <div><span className="text-slate-400 font-normal">Patient Email:</span> {selectedBill.patient?.email}</div>
                <div><span className="text-slate-400 font-normal">Original Total:</span> Rs. {selectedBill.amount.toLocaleString()}</div>
              </div>

              <div className="space-y-4">
                {/* Itemized list editor */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-slate-700 text-sm font-bold">Billing Items</label>
                    <button
                      type="button"
                      onClick={() => setItems([...items, { name: 'Regular Checkup', cost: 0 }])}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                      <div className="flex-1 space-y-2">
                        <select
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].name = e.target.value;
                            setItems(updated);
                          }}
                          className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                        >
                          {treatmentsList.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>

                        {item.name === 'Custom' && (
                          <input
                            type="text"
                            placeholder="Enter custom treatment type..."
                            value={item.customName || ''}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].customName = e.target.value;
                              setItems(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        )}
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="Cost"
                          value={item.cost || ''}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].cost = parseFloat(e.target.value) || 0;
                            setItems(updated);
                          }}
                          className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                          required
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = items.filter((_, i) => i !== idx);
                            setItems(updated);
                          }}
                          className="p-2.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition mt-0.5 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Dynamic Total Sum Card */}
                <div className="p-4 bg-blue-50 rounded-2xl text-center border border-blue-100 shadow-sm">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Invoice Sum</span>
                  <p className="text-2xl font-black text-blue-800 mt-0.5">Rs. {totalAmount.toLocaleString()}</p>
                </div>

                <div className="space-y-3 pt-6 border-t">
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider text-center mb-1">Select Payment Gateway / Method</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => handlePayCash(selectedBill._id)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition cursor-pointer text-sm"
                    >
                      Pay with Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePayCard(selectedBill._id)}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition cursor-pointer text-sm"
                    >
                      Pay with Card
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedBill(null);
                      setItems([{ name: 'Regular Checkup', cost: 0 }]);
                    }}
                    className="w-full py-2.5 mt-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold transition cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
