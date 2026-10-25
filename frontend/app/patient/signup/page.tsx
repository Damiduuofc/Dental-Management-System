"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle } from "lucide-react";

export default function PatientSignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "",
    phoneNumber: "",
    email: "",
    nic: "",
    homeAddress: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009";
      const response = await fetch(`${apiUrl}/api/patient/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Registration successful! Please log in.");
        router.push("/patient/login");
      } else {
        alert(result.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("An error occurred while connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden flex bg-slate-50">
      {/* Left Column: Brand Showcase (Hidden on small screens, fits 1 screen) */}
      <div className="hidden lg:flex w-5/12 bg-gradient-to-br from-blue-950 via-blue-900 to-sky-950 text-white flex-col justify-between p-8 xl:p-10 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.18),transparent_65%)] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto py-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 mb-4 shadow-sm">
            <Image
              src="/logo.png"
              alt="Dentplus"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/20 text-sky-300 text-xs font-semibold mb-3">
            <Sparkles size={13} />
            Patient Registration
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
            Join the <span className="text-sky-300">Dentplus</span> Network
          </h1>

          <p className="mt-3 text-xs xl:text-sm text-blue-100/90 leading-relaxed max-w-sm">
            Create your personal account to securely view medical history, book instant appointments, download prescriptions, and access high-resolution digital X-rays.
          </p>

          <div className="mt-6 space-y-2.5 text-xs text-blue-100">
            <div className="flex items-center gap-2.5">
              <CheckCircle size={15} className="text-sky-400 shrink-0" />
              <span>Instant online appointment booking & status</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle size={15} className="text-sky-400 shrink-0" />
              <span>Private & encrypted electronic health records</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle size={15} className="text-sky-400 shrink-0" />
              <span>24/7 accessible treatment history & billing receipts</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div className="relative z-10 text-[11px] text-blue-200/70 border-t border-white/10 pt-4 flex items-center gap-2">
          <ShieldCheck size={14} className="text-sky-400 shrink-0" />
          <span>HIPAA & Medical Data Protection Standard</span>
        </div>
      </div>

      {/* Right Column: Compact Form (Fits completely in 1 Screen without scrolling) */}
      <div className="w-full lg:w-7/12 h-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-200/90 p-5 sm:p-6 xl:p-7 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Create Patient Account
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill in your personal details to register for the portal.
              </p>
            </div>
            <Link
              href="/patient/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100"
            >
              <ArrowLeft size={13} />
              Sign In Instead
            </Link>
          </div>

          {/* Form: 2-Column Compact Grid */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, "") })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* NIC / Identification */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  NIC / ID Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your NIC number"
                  value={formData.nic}
                  onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Home Address (Spans 2 columns) */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Home Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your home address"
                  value={formData.homeAddress}
                  onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 pr-9 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 pr-9 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm transition shadow-md shadow-blue-500/20 active:scale-[0.99]"
            >
              {loading ? "Registering Account..." : "Create Patient Account"}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Already registered?{" "}
              <Link href="/patient/login" className="text-blue-600 font-semibold hover:underline">
                Sign in
              </Link>
            </span>
            <span>Dentplus Secure System</span>
          </div>
        </div>
      </div>
    </div>
  );
}