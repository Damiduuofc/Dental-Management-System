'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, X } from 'lucide-react';
import AddPatientModal from '@/components/AddPatientModal';
import Sidebar from '@/components/admin/Sidebar';
import PatientDetailsModal from '@/components/PatientDetailsModal';
import CheckInModal from '@/components/CheckInModal';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  nic: string;
  homeAddress?: string;
  allergies?: string;
  createdAt: string;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // Installment payment states
  const [bills, setBills] = useState<any[]>([]);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<any>(null);
  const [installmentAmount, setInstallmentAmount] = useState<number>(0);
  const [installmentMethod, setInstallmentMethod] = useState<'Cash' | 'Card'>('Cash');
  const [submittingInstallment, setSubmittingInstallment] = useState(false);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        setFilteredPatients(data);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
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
        fetchPatients();
        fetchBills();
      } catch (err) {
        console.error("Error parsing user profile:", err);
        router.push("/admin/login");
      }
    }
  }, [router]);

  const getPatientDueAmount = (pId: string) => {
    return bills
      .filter(b => b.patient?._id === pId || b.patient === pId)
      .reduce((sum, b) => {
        const due = b.dueAmount !== undefined ? b.dueAmount : (b.status === 'Paid' ? 0 : b.amount);
        return sum + due;
      }, 0);
  };

  const handleInstallmentSubmit = async () => {
    if (!payingBill || installmentAmount <= 0 || !selectedPatient) return;
    
    const maxDue = payingBill.dueAmount !== undefined ? payingBill.dueAmount : payingBill.amount;
    if (installmentAmount > maxDue) {
      alert(`Installment amount cannot exceed Rs. ${maxDue}`);
      return;
    }

    setSubmittingInstallment(true);
    try {
      const token = localStorage.getItem("token");
      const updatedAmountPaid = (payingBill.amountPaid || 0) + installmentAmount;
      const updatedDueAmount = Math.max(0, payingBill.amount - updatedAmountPaid);
      const updatedStatus = updatedDueAmount === 0 ? 'Paid' : 'Partially Paid';

      if (installmentMethod === 'Cash') {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing/${payingBill._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: updatedStatus,
            paymentMethod: 'Cash',
            amountPaid: updatedAmountPaid,
            dueAmount: updatedDueAmount
          })
        });

        if (res.ok) {
          alert("Installment Cash payment recorded successfully!");
          setPayingBill(null);
          setIsInstallmentModalOpen(false);
          fetchBills();
          fetchPatients();
        } else {
          const err = await res.json();
          alert(err.message || "Failed to record payment.");
        }
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing/${payingBill._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'Pending',
            paymentMethod: 'Card'
          })
        });

        if (res.ok) {
          const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/admin/billing/${payingBill._id}/checkout-session`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amountToPay: installmentAmount
            })
          });
          if (checkRes.ok) {
            const { url } = await checkRes.json();
            window.location.href = url;
            return;
          } else {
            alert("Failed to create Stripe session.");
          }
        } else {
          alert("Failed to update invoice status.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error processing installment.");
    } finally {
      setSubmittingInstallment(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.phoneNumber?.toLowerCase().includes(query) ||
        p.nic?.toLowerCase().includes(query)
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const calculateAge = (dobString: string) => {
    if (!dobString) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading patients record...</p>
        </div>
      </div>
    );
  }

  const totalCount = patients.length;
  const activeCount = patients.length;
  const newThisMonth = patients.filter(p => {
    const createdDate = new Date(p.createdAt);
    const today = new Date();
    return createdDate.getMonth() === today.getMonth() && createdDate.getFullYear() === today.getFullYear();
  }).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 md:ml-64">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
            <p className="text-slate-500 mt-1">Manage and track clinic patient records.</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[ 
            { val: totalCount, label: 'Total Patients', bg: 'bg-blue-600' }, 
            { val: activeCount, label: 'Active Patients', bg: 'bg-sky-500' }, 
            { val: newThisMonth, label: 'New this month', bg: 'bg-teal-600' }
          ].map((s, i) => (
            <div key={i} className={`${s.bg} text-white p-6 rounded-2xl shadow-sm hover:shadow-md transition duration-200`}>
              <div className="text-3xl font-bold">{s.val}</div>
              <div className="text-sm opacity-90 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-between flex-wrap gap-4 mb-6">
          <div className="relative w-96 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-medium" 
              placeholder="Search by Name, Email, Phone, or NIC..." 
            />
          </div>
          <button onClick={() => { setSelectedPatientForEdit(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-md shadow-blue-100 transition cursor-pointer">
            <Plus size={20} /> Add New Patients
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">No patient records found.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Patient</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Contact</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">NIC Number</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Gender</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Date Registered</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm text-right">Due Amount</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Status</th>
                    <th className="p-4 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(p => (
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="p-4 font-medium text-slate-900 text-sm">
                        {p.name}<br/>
                        <span className="text-xs text-slate-400 font-normal">{calculateAge(p.dob)} years old</span>
                      </td>
                      <td className="p-4 text-slate-600 text-sm">
                        {p.phoneNumber}<br/>
                        <span className="text-xs text-slate-400 font-normal">{p.email}</span><br/>
                        {p.homeAddress && <span className="text-xs text-slate-500 font-normal text-slate-500 block truncate max-w-[180px]" title={p.homeAddress}>{p.homeAddress}</span>}
                      </td>
                      <td className="p-4 text-slate-600 text-sm font-semibold">{p.nic}</td>
                      <td className="p-4 text-slate-600 text-sm">{p.gender}</td>
                      <td className="p-4 text-slate-600 text-sm">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-bold text-right text-slate-900">
                        Rs. {getPatientDueAmount(p._id).toLocaleString()}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                          Active
                        </span>
                      </td>
                       <td className="p-4 flex gap-3 flex-wrap items-center">
                        <button 
                          onClick={() => {
                            setSelectedPatient(p);
                            setIsDetailsOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-semibold cursor-pointer"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPatient(p);
                            setIsCheckInOpen(true);
                          }}
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold cursor-pointer"
                        >
                          Check-In
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPatientForEdit(p);
                            setIsModalOpen(true);
                          }}
                          className="text-slate-500 hover:text-slate-700 text-sm font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        {getPatientDueAmount(p._id) > 0 && (
                          <button 
                            onClick={() => {
                              setSelectedPatient(p);
                              setIsInstallmentModalOpen(true);
                            }}
                            className="text-amber-600 hover:text-amber-700 text-sm font-bold cursor-pointer animate-pulse"
                          >
                            Pay Installment
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
        <AddPatientModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPatientForEdit(null);
          }} 
          patient={selectedPatientForEdit}
          onSuccess={fetchPatients}
        />
        <PatientDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
        />
        <CheckInModal
          isOpen={isCheckInOpen}
          onClose={() => {
            setIsCheckInOpen(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
          onSuccess={fetchPatients}
        />

        {/* Installment Payment Modal */}
        {isInstallmentModalOpen && selectedPatient && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => {
                  setIsInstallmentModalOpen(false);
                  setPayingBill(null);
                  setSelectedPatient(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold text-slate-900 mb-1">Pay Installment</h2>
              <p className="text-slate-500 text-sm mb-6">
                Manage payments for <strong className="text-slate-700">{selectedPatient.name}</strong>.
              </p>

              {payingBill === null ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700">Outstanding Invoices</h3>
                  {(() => {
                    const patientBills = bills.filter(b => 
                      (b.patient?._id === selectedPatient._id || b.patient === selectedPatient._id) && 
                      (b.status === 'Unpaid' || b.status === 'Partially Paid' || b.status === 'Pending')
                    );

                    if (patientBills.length === 0) {
                      return <p className="text-sm text-slate-400 text-center py-4">No outstanding invoices found.</p>;
                    }

                    return patientBills.map(bill => {
                      const due = bill.dueAmount !== undefined ? bill.dueAmount : (bill.status === 'Paid' ? 0 : bill.amount);
                      return (
                        <div key={bill._id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{bill.treatment}</p>
                              <p className="text-xs text-slate-400 font-medium">Date: {new Date(bill.date).toLocaleDateString()}</p>
                            </div>
                            <span className="text-xs px-2.5 py-0.5 rounded-full border bg-amber-50 border-amber-200 text-amber-700 font-bold uppercase tracking-wider">
                              {bill.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pt-2 border-t border-slate-200/60">
                            <div>Total: Rs. {bill.amount.toLocaleString()}</div>
                            <div>Paid: Rs. {(bill.amountPaid || 0).toLocaleString()}</div>
                            <div className="text-slate-900 font-bold">Due: Rs. {due.toLocaleString()}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPayingBill(bill);
                              setInstallmentAmount(due);
                              setInstallmentMethod('Cash');
                            }}
                            className="w-full mt-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            Pay Installment on this Bill
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Paying Installment For</p>
                    <p className="font-extrabold text-blue-900 text-sm mt-1">{payingBill.treatment}</p>
                    <p className="text-xs text-blue-500 font-medium mt-0.5">Date: {new Date(payingBill.date).toLocaleDateString()}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-700 text-xs font-bold uppercase mb-1.5">Amount to Pay (Rs.)</label>
                      <input
                        type="number"
                        value={installmentAmount || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          const maxDue = payingBill.dueAmount !== undefined ? payingBill.dueAmount : payingBill.amount;
                          setInstallmentAmount(Math.min(maxDue, val));
                        }}
                        className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      />
                    </div>

                    {(() => {
                      const maxDue = payingBill.dueAmount !== undefined ? payingBill.dueAmount : payingBill.amount;
                      const remaining = Math.max(0, maxDue - installmentAmount);
                      return (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between text-xs font-bold text-slate-500">
                          <span>REMAINING BALANCE DUE:</span>
                          <span className="text-slate-900">Rs. {remaining.toLocaleString()}</span>
                        </div>
                      );
                    })()}

                    <div>
                      <label className="block text-slate-700 text-xs font-bold uppercase mb-1.5">Payment Method</label>
                      <select
                        value={installmentMethod}
                        onChange={(e) => setInstallmentMethod(e.target.value as any)}
                        className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setPayingBill(null)}
                        className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 font-semibold transition text-sm cursor-pointer"
                        disabled={submittingInstallment}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleInstallmentSubmit}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition text-sm cursor-pointer shadow-lg shadow-emerald-100 disabled:opacity-50"
                        disabled={submittingInstallment}
                      >
                        {submittingInstallment ? "Processing..." : "Confirm & Pay"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}