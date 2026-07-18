"use client";

import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/admin/Sidebar";
import { getAdminToken } from "@/lib/adminSession";
import { Button } from "@/components/ui/button";
type StaffMember = {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
};

import { useRouter } from 'next/navigation';

export default function AccountCreationPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phoneNumber: '', password: '', role: 'dentist' });
  const [pageLoading, setPageLoading] = useState(true);

  const handleResetStaffPassword = async (staffId: string) => {
    if (!confirm("Are you sure you want to generate a temporary password for this staff member? This will immediately replace their old password.")) {
      return;
    }

    try {
      const token = getAdminToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reset-staff-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-auth-token': token } : {}),
        },
        body: JSON.stringify({ staffId }),
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Temporary password issued and email dispatched successfully.");
      } else {
        alert(data.message || "Failed to reset staff password.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error resetting password.");
    }
  };

  const fetchStaff = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/staff`, {
        headers: token ? { 'x-auth-token': token } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (!token || !storedUser) {
        router.push("/login");
        return;
      }
      try {
        const userObj = JSON.parse(storedUser);
        if (userObj.role !== "system_admin" && userObj.role !== "assistant") {
          if (userObj.role === "dentist") {
            router.push("/dentist/dashboard");
          } else {
            router.push("/admin/dashboard");
          }
          return;
        }
        setPageLoading(false);
        fetchStaff();
      } catch (e) {
        console.error("Error verifying access to account-creation:", e);
        router.push("/login");
      }
    }
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-auth-token': token } : {}),
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchStaff();
        setFormData({ fullName: '', email: '', phoneNumber: '', password: '', role: 'dentist' });
      } else {
        alert("Error creating account");
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 md:ml-64">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Staff Directory</h1>
            <p className="text-slate-500">Manage Dentists and Assistants</p>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger className="inline-flex h-12 items-center rounded-2xl bg-blue-600 px-6 font-bold text-white shadow-sm transition hover:bg-blue-700">
              <UserPlus className="mr-2 h-5 w-5" />
              Create New Account
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>Create Staff Account</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <Input placeholder="Full Name" onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                <Input placeholder="Email" type="email" onChange={e => setFormData({...formData, email: e.target.value})} required />
                <Input placeholder="Phone" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '')})} required />
                <Select onValueChange={(val) => setFormData({...formData, role: val || 'dentist'})} defaultValue="dentist">
                  <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dentist">Dentist</SelectItem>
                    <SelectItem value="assistant">Assistant Dentist</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required />
                <Button type="submit" className="w-full bg-blue-600" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "Register Account"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div key={member._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black text-2xl font-black">
                    {member.fullName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{member.fullName}</h3>
                    <p className="text-sm text-blue-600 font-bold uppercase">{member.role}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2"><Mail size={16}/> {member.email}</div>
                  <div className="flex items-center gap-2"><Phone size={16}/> {member.phoneNumber}</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleResetStaffPassword(member._id)}
                  className="w-full py-2 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                >
                  Generate Temp Password
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}