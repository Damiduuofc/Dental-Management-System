"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";

export default function PatientLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009";
      const response = await fetch(`${apiUrl}/api/patient/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("patientToken", data.token);
        localStorage.setItem("token", data.token);

        if (data.user) {
          localStorage.setItem("patient", JSON.stringify(data.user));
          localStorage.setItem("user", JSON.stringify({ ...data.user, role: "patient" }));
        }

        alert("Login successful!");
        router.push("/patient/dashboard");
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      alert("Server unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full bg-slate-50">
      {/* Top Navigation */}
      <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-white hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <Link
          href="/admin/login"
          className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-300 hover:border-blue-700 hover:bg-blue-700 hover:text-white"
        >
          <Shield size={16} />
          Staff & Admin Login
        </Link>
      </div>

      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-950 via-blue-900 to-sky-900 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.15),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 shadow-inner">
            <Image
              src="/logo.png"
              alt="Dentplus Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/20 text-sky-300 text-xs font-semibold mb-4">
            <Sparkles size={14} />
            Patient Care Portal
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
            Welcome to <span className="text-sky-300">Dentplus</span>
          </h1>

          <p className="mt-4 text-base text-blue-100/90 leading-relaxed max-w-md">
            Securely access your dental records, view treatment plans, review digital X-rays, manage appointments, and track prescriptions in real time.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 w-full text-center">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="block text-2xl font-bold text-sky-300">24/7</span>
              <span className="text-xs text-blue-200">Online Booking</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="block text-2xl font-bold text-sky-300">100%</span>
              <span className="text-xs text-blue-200">Private & Secure</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="block text-2xl font-bold text-sky-300">Instant</span>
              <span className="text-xs text-blue-200">X-Ray Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 pt-24 lg:pt-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Patient Sign In
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your registered credentials to access your portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <Link
                  href="/patient/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 text-sm"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-white font-semibold shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 active:scale-[0.99] text-sm"
            >
              {loading ? "Authenticating..." : "Sign In to Portal"}
            </button>

            {/* Sign Up */}
            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                New to Dentplus?{" "}
                <Link
                  href="/patient/signup"
                  className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Register an account
                </Link>
              </p>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Dentplus Dental Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
