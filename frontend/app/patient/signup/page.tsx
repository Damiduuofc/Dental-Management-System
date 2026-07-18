"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function PatientSignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/api/patient/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Registration successful!");
        router.push("/");
      } else {
        alert(result.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("An error occurred while connecting to the server.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 text-white flex-col items-center justify-center p-12">
        <Image src="/logo.png" alt="Dentplus" width={170} height={170} className="mb-8" />
        <h1 className="text-5xl font-bold text-center leading-tight">Join<br />Dentplus</h1>
        <p className="mt-6 text-blue-100 text-center max-w-md text-lg leading-relaxed">
          Create your patient account to manage appointments, dental records, prescriptions and treatment history online.
        </p>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-8">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-blue-700 font-semibold mb-6 hover:underline"
          >
            <ArrowLeft size={18} />
            Back to Login
          </button>

          <h2 className="text-3xl font-bold text-center text-gray-800">Create Patient Account</h2>
          <p className="text-center text-gray-500 mt-2 mb-8">Fill in your information to register.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="John Perera"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 text-sm font-medium">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Gender</label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Other inputs remain same... */}
            <div>
              <label className="block mb-2 text-sm font-medium">Phone Number</label>
              <input type="tel" required placeholder="+94XXXXXXXXX" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })} className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-200" />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Email Address</label>
              <input type="email" required placeholder="example@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-200" />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">NIC Number</label>
              <input type="text" required placeholder="200012345678" value={formData.nic} onChange={(e) => setFormData({ ...formData, nic: e.target.value })} className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-200" />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Home Address</label>
              <input type="text" required placeholder="123 Galle Road, Colombo" value={formData.homeAddress} onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })} className="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-200" />
            </div>

            {/* Password Fields */}
            <div>
              <label className="block mb-2 text-sm font-medium">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full rounded-lg border px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-200" placeholder="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full rounded-lg border px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-200" placeholder="Confirm Password" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-4">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition">
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}