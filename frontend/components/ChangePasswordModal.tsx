'use client';

import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009'}/api/admin/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError(data.message || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error updating password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white w-[450px] p-8 rounded-3xl shadow-2xl border border-slate-100 relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-1 text-slate-800">Update Password</h2>
        <p className="text-slate-500 mb-6 text-sm">Modify your staff credentials securely.</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle size={18} className="text-emerald-600" />
            Password updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <Lock size={18} />
              </span>
              <input 
                type={showPass ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium text-sm transition"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <Lock size={18} />
              </span>
              <input 
                type={showPass ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium text-sm transition"
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <Lock size={18} />
              </span>
              <input 
                type={showPass ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium text-sm transition"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose} 
              className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition cursor-pointer text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg shadow-blue-100 disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
