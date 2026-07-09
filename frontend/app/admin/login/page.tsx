"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("token", data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        
        alert("Login successful!");

        // Route based on role
        if (data.user?.role === "dentist") {
          router.push("/dentist/dashboard");
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Server unreachable. Ensure backend is running on the correct port.");
    }
  };

  return (
    <div className="flex h-screen w-full">
          {/* Top Right Admin Login Button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-700 hover:bg-blue-700 hover:text-white hover:shadow-xl"
      >
        <ArrowLeft size={18} />
        Paint Login
      </button>
      {/* Left Section */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 text-white flex-col items-center justify-center p-12">

        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Dental Management System"
          width={180}
          height={180}
          style={{ width: 'auto', height: 'auto' }} 
          className="mb-8"
        />

        <h1 className="text-5xl font-bold text-center leading-tight">
          Welcome to
          <br />
          Dental Management
          <br />
          System
        </h1>

        <p className="mt-6 text-lg text-blue-100 text-center max-w-md">
          A complete solution for managing patients, appointments,
          doctors, billing, and dental records efficiently.
        </p>
      </div>

      {/* Right Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-100 p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Admin Login
          </h2>

          <p className="text-center text-gray-500 mb-8">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                required
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 py-3 text-white font-semibold transition hover:bg-blue-800"
            >
              Sign In
            </button>
          </form>



        </div>
      </div>
    </div>
  );
}