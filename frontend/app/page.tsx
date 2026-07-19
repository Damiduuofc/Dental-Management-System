"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function PatientLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/patient/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("patientToken", data.token);
        localStorage.setItem("token", data.token);

        if (data.user) {
          localStorage.setItem("patient", JSON.stringify(data.user));
        }

        alert("Login successful!");

        router.push("/patient/dashboard");
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      alert("Server unreachable.");
    }
  };

  return (
    <div className="relative flex h-screen w-full bg-gray-100">
      {/* Top Right Admin Login Button */}
      <button
        onClick={() => router.push("/admin/login")}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-700 hover:bg-blue-700 hover:text-white hover:shadow-xl"
      >
        <ArrowLeft size={18} />
        Admin Login
      </button>

      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 text-white flex-col items-center justify-center p-12">
        <Image
          src="/logo.png"
          alt="Dental Management System"
          width={100}
          height={100}
          className="mb-8"
          style={{ width: "100", height: "auto" }}
        />

        <h1 className="text-5xl font-bold text-center leading-tight">
          Welcome to
          <br />
          Dentplus
        </h1>

        <p className="mt-6 text-lg text-blue-100 text-center max-w-md leading-relaxed">
          Securely access your appointments, treatment history,
          prescriptions, invoices, and dental records from anywhere.
        </p>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Patient Login
          </h2>

          <p className="text-center text-gray-500 mb-8">
            Sign in to access your patient portal.
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
      value={formData.email}
      onChange={(e) =>
        setFormData({
          ...formData,
          email: e.target.value,
        })
      }
      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
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
      value={formData.password}
      onChange={(e) =>
        setFormData({
          ...formData,
          password: e.target.value,
        })
      }
      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
    />

    {/* Forgot Password */}
    <div className="mt-2 text-right">
      <button
        type="button"
        onClick={() => router.push("/patient/forgot-password")}
        className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
      >
        Forgot Password?
      </button>
    </div>
  </div>

  {/* Sign In */}
  <button
    type="submit"
    className="w-full rounded-lg bg-blue-700 py-3 text-white font-semibold transition duration-300 hover:bg-blue-800 hover:shadow-lg"
  >
    Sign In
  </button>

  {/* Sign Up */}
  <div className="text-center pt-2">
    <p className="text-sm text-gray-600">
      Don't have an account?{" "}
      <button
        type="button"
        onClick={() => router.push("/patient/signup")}
        className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
      >
        Sign Up
      </button>
    </p>
  </div>
</form>


          <p className="mt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Dentplus Dental Management System
          </p>
        </div>
      </div>
    </div>
  );
}