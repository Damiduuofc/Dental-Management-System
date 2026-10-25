"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
} from "motion/react";
import {
  ArrowRight,
  ArrowUp,
  Star,
  Calendar,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  CheckCircle,
  Check,
} from "lucide-react";
import Footer from "@/components/Footer";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Dental Checkup");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Top Scroll Progress Bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  const [bookingForm, setBookingForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "Dental Checkup",
    preferredDate: "",
    notes: "",
  });

  const categories = [
    "Dental Checkup",
    "Teeth Cleaning",
    "Tooth Filling",
    "Gum Treatment",
    "Retainers",
  ];

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "about", label: "About Us" },
    { id: "specialists", label: "Specialists" },
    { id: "services", label: "Services" },
  ];

  // Scrollspy & Scroll position tracking
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);

      const sectionIds = ["home", "services", "about", "specialists"];
      for (const section of sectionIds) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom >= 250) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll handler
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingModalOpen(false);
      setBookingForm({
        name: "",
        phone: "",
        email: "",
        service: "Dental Checkup",
        preferredDate: "",
        notes: "",
      });
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#fafbfc] text-slate-800 antialiased selection:bg-sky-500 selection:text-white">
      {/* Top Scroll Motion Indicator */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 origin-left z-[100]"
      />

      {/* =========================================================================
          STICKY / FLOATING NAVBAR (Minimal & Sleek)
         ========================================================================= */}
      <AnimatePresence>
        {isScrolled && (
          <motion.header
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none"
          >
            <div className="max-w-4xl mx-auto bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-full px-5 py-2.5 shadow-2xl shadow-slate-950/30 flex items-center justify-between pointer-events-auto">
              {/* Brand Logo */}
              <button
                type="button"
                onClick={() => scrollTo("home")}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center p-1">
                  <Image
                    src="/logo.png"
                    alt="Dentplus"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <span className="text-base font-bold text-white tracking-tight flex items-center gap-1">
                  Dentplus
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                </span>
              </button>

              {/* Center Links */}
              <nav className="hidden md:flex items-center gap-1 bg-white/[0.06] p-1 rounded-full border border-white/10 text-xs">
                {navLinks.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className={`relative px-4 py-1.5 rounded-full transition-colors duration-200 font-medium ${
                      activeSection === item.id
                        ? "text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {activeSection === item.id && (
                      <motion.div
                        layoutId="activeStickyPill"
                        className="absolute inset-0 bg-white/15 rounded-full border border-white/20 shadow-sm"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Right Action: Patient Login & Doctor/Staff */}
              <div className="flex items-center gap-2">
                <Link
                  href="/patient/login"
                  className="px-4 py-1.5 rounded-full bg-white text-slate-950 font-semibold text-xs hover:bg-sky-50 transition shadow-sm"
                >
                  Patient Login
                </Link>
                <Link
                  href="/admin/login"
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/15 transition"
                >
                  Doctor & Staff
                </Link>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* =========================================================================
          HERO SECTION (Full Screen Edge-to-Edge, No White Space)
         ========================================================================= */}
      <section
        id="home"
        className="relative w-full min-h-screen h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-white"
      >
        {/* Minimalist Background Imagery & Soft Atmospheric Glow */}
        <div className="absolute inset-0 z-0">
          <motion.div
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="relative w-full h-full"
          >
            <Image
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=2400&q=85"
              alt="Modern Aesthetic Dental Clinic"
              fill
              priority
              className="object-cover object-center mix-blend-luminosity"
            />
          </motion.div>
          {/* Atmospheric Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(56,189,248,0.14),transparent_65%)]" />
        </div>

        {/* =====================================================================
            IN-HERO NAVBAR (Clean Edge-to-Edge Header)
           ===================================================================== */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-30 w-full px-6 sm:px-12 lg:px-20 pt-6 sm:pt-8 flex items-center justify-between"
        >
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-10 h-10 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 flex items-center justify-center p-1.5 shadow-sm"
            >
              <Image
                src="/logo.png"
                alt="Dentplus Logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </motion.div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Dentplus
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            </span>
          </Link>

            {/* Center Pill Menu */}
            <nav className="hidden md:flex items-center bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-full px-2 py-1.5 shadow-lg shadow-black/20">
              {navLinks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className={`relative px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors duration-200 ${
                    activeSection === item.id
                      ? "text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeHeroPill"
                      className="absolute inset-0 bg-white/15 rounded-full border border-white/20 shadow-sm"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Right Action: Patient Login & Doctor/Staff */}
            <div className="hidden sm:flex items-center gap-2.5">
              <Link
                href="/patient/login"
                className="px-5 py-2.5 rounded-full bg-white text-slate-950 font-semibold text-xs lg:text-sm hover:bg-sky-50 transition shadow-lg shadow-black/20"
              >
                Patient Login
              </Link>
              <Link
                href="/admin/login"
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs lg:text-sm border border-white/15 backdrop-blur-md transition"
              >
                Doctor & Staff
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                href="/patient/login"
                className="px-3 py-1.5 rounded-full bg-white text-slate-900 text-xs font-semibold"
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-white/10 text-white border border-white/15"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </motion.header>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="relative z-40 mx-4 mt-3 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/10 text-white md:hidden overflow-hidden"
              >
                <div className="flex flex-col space-y-2.5">
                  {navLinks.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollTo(item.id)}
                      className="text-left px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-sm text-slate-200"
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                    <Link
                      href="/patient/login"
                      className="w-full text-center py-2.5 rounded-xl bg-white text-slate-950 text-sm font-semibold"
                    >
                      Patient Login
                    </Link>
                    <Link
                      href="/admin/login"
                      className="w-full text-center py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium border border-white/15"
                    >
                      Doctor & Staff Login
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* =====================================================================
              HERO CONTENT (Modern, Clean & Full-Width Edge-to-Edge)
             ===================================================================== */}
          <div className="relative z-10 w-full px-6 sm:px-12 lg:px-20 py-auto my-auto flex-1 flex flex-col justify-center">
            <div className="max-w-2xl">

              {/* Bold Minimalist Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6"
              >
                Family-Friendly <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-sky-300">
                  Dental Care
                </span>
              </motion.h1>

              {/* Clean Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base sm:text-lg text-slate-300/90 max-w-xl font-normal leading-relaxed mb-8"
              >
                Permanent natural-looking solutions to replace missing teeth and
                restore confident healthy smiles.
              </motion.p>

              {/* Minimalist CTA Button: Patient Portal Login */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link
                  href="/patient/login"
                  className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-white text-slate-950 font-bold text-sm sm:text-base transition-all duration-300 hover:bg-sky-50 hover:shadow-xl hover:shadow-sky-500/20 active:scale-95"
                >
                  <span>Patient Portal Login</span>
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center transition-transform group-hover:translate-x-1">
                    <ArrowRight size={15} />
                  </div>
                </Link>
              </motion.div>
            </div>

            {/* Bottom Floating Elements inside Hero */}
            <div className="mt-14 sm:mt-20 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
              {/* Minimalist Floating Card on Bottom Left */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.4 },
                  x: { duration: 0.6, delay: 0.4 },
                  y: { repeat: Infinity, duration: 4.5, ease: "easeInOut" },
                }}
                className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 max-w-sm shadow-xl"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/15">
                  <Image
                    src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=200&q=80"
                    alt="Dental specialist"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 font-medium leading-snug line-clamp-2">
                    Restore natural healthy confident dental growth.
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      4.9 [Rating]
                    </span>
                    <ArrowRight size={12} className="text-slate-400" />
                  </div>
                </div>
              </motion.div>

              {/* Minimalist Category Pills on Bottom Right */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="flex flex-wrap items-center gap-2"
              >
                {categories.map((cat) => (
                  <motion.button
                    key={cat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(cat)}
                    className={`relative px-4 py-2 rounded-full text-xs font-medium transition-colors duration-200 backdrop-blur-md ${
                      activeCategory === cat
                        ? "text-slate-950 font-semibold"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {activeCategory === cat ? (
                      <motion.div
                        layoutId="activeCategoryPill"
                        className="absolute inset-0 bg-white rounded-full shadow-md -z-0"
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-white/[0.08] hover:bg-white/15 border border-white/10 rounded-full -z-0 transition-colors" />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </div>

        {/* Minimalist Hero Bottom Bar (Full-Width Edge-to-Edge) */}

      </section>

      {/* =========================================================================
          PROCESS RIBBON (Clean Segmented Ticker)
         ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="py-6 px-4 max-w-7xl mx-auto"
      >
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <span>Smile Assessment</span>
            </div>

            <div className="flex gap-1 opacity-25">
              {[...Array(12)].map((_, i) => (
                <span key={i} className="w-0.5 h-3 bg-slate-800 rounded-full"></span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <span>Care Planning</span>
            </div>

            <div className="flex gap-1 opacity-25">
              {[...Array(12)].map((_, i) => (
                <span key={i} className="w-0.5 h-3 bg-slate-800 rounded-full"></span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <span>Treatment Process</span>
            </div>

            <div className="flex gap-1 opacity-25">
              {[...Array(12)].map((_, i) => (
                <span key={i} className="w-0.5 h-3 bg-slate-800 rounded-full"></span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px] font-bold">
                4
              </span>
              <span>Dental Maintenance</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* =========================================================================
          ABOUT US SECTION
         ========================================================================= */}
      <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider mb-6">
              About Us
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.2] tracking-tight mb-8">
              We deliver personalized dental treatments with{" "}
              <span className="text-slate-400 font-medium">modern technology</span>{" "}
              and gentle care ensuring healthy confident smiles for every patient.
            </h2>

            {/* Patient Avatars */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex -space-x-3 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Patient"
                  width={46}
                  height={46}
                  className="inline-block h-11 w-11 rounded-full ring-2 ring-white object-cover"
                />
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt="Patient"
                  width={46}
                  height={46}
                  className="inline-block h-11 w-11 rounded-full ring-2 ring-white object-cover"
                />
                <Image
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80"
                  alt="Patient"
                  width={46}
                  height={46}
                  className="inline-block h-11 w-11 rounded-full ring-2 ring-white object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Thousands Trust Us for Smiles!
                </p>
                <div className="flex items-center gap-1 text-amber-500 text-xs">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-slate-500 text-[11px] ml-1">5.0 Star Feedback</span>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  98%
                </div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Satisfaction Rate
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  2k+
                </div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Smiles Transformed
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center">
                  4.9<span className="text-amber-500 text-2xl">*</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Customer Rating
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column: High Quality Dental Photo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 group">
              <div className="aspect-[4/5] relative">
                <Image
                  src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1000&q=80"
                  alt="Dental Patient Smiling in Clinic"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              <motion.div
                whileHover={{ y: -3 }}
                className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/40 shadow-lg flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Precision Digital Care
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Painless procedures & 3D Scanning
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check size={16} />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE TREATMENT & SPECIALISTS
         ========================================================================= */}
      <section id="specialists" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider mb-3">
            Feature Treatment
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Advanced Dental Care for a Healthier Smile
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
            Join hundreds of patients achieving healthier, brighter smiles
            through expert dental care and personalized treatments.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Doctor Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -6 }}
            className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-slate-100 border border-slate-100 group">
                <Image
                  src="/Erandi Chathurangani.jpg"
                  alt="Dr. Erandi Chathurangani"
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-blue-700 shadow-sm">
                  Lead Specialist
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-slate-900">
                  Dr. Erandi Chathurangani
                </h3>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>4.9 (45+ reviews)</span>
                </div>
              </div>

              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4">
                Lead Dental Specialist & Prosthodontist
              </p>

              <p className="text-sm text-slate-600 leading-relaxed">
                Join hundreds of patients achieving healthier, brighter smiles
                through expert dental care, aesthetic prosthodontics, and
                personalized orthodontic treatments.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Experience</span>
                <span className="text-sm font-bold text-slate-900">12+ Years Clinical</span>
              </div>

            </div>
          </motion.div>

          {/* Operatory Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            whileHover={{ y: -6 }}
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative aspect-[16/9] sm:aspect-[2/1] rounded-2xl overflow-hidden mb-6 bg-slate-100 border border-slate-100 group">
              <Image
                src="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=80"
                alt="Modern Dental Operatory Equipment"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm font-bold">Suite 01 • Advanced Ergonomic Operatory</p>
                <p className="text-xs text-slate-300">Equipped with 3D intraoral imaging</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Recommended Checkups / Year
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900">2</span>
                  <span className="text-xs font-semibold text-slate-600">Visits</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Average Treatment Time
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900">40</span>
                  <span className="text-xs font-semibold text-slate-600">Mins</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Today's Appointment Progress
                </span>
                <div className="mt-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-1.5">
                    <span>Active Queue</span>
                    <span className="text-sky-600">85% Complete</span>
                  </div>
                  <div className="flex gap-1 h-3">
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scaleY: 0 }}
                        whileInView={{ opacity: 1, scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        className={`flex-1 rounded-sm ${
                          i < 8 ? "bg-sky-500" : "bg-slate-200"
                        }`}
                      ></motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          SERVICES SHOWCASE SECTION
         ========================================================================= */}
      <section id="services" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
          >
            <div className="max-w-xl">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold uppercase tracking-wider mb-3">
                Comprehensive Dentistry
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                Advanced Dental Care Ensures Precision Comfort And Long Lasting Healthy Smiles
              </h2>
            </div>
            <motion.button
              whileHover={{ x: 4 }}
              type="button"
              onClick={() => setBookingModalOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition"
            >
      
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8 }}
              className="group rounded-3xl bg-slate-50 border border-slate-200/80 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80"
                  alt="Professional Cleaning"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-slate-900">
                  Hygiene
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Professional Cleaning vs. Regular Brushing
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Deep ultrasonic scaling removes calcified plaque and stains that
                  daily toothbrushes simply cannot reach.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(true)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:text-blue-800 transition"
                >
                  <span>Learn More</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* Service 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8 }}
              className="group rounded-3xl bg-slate-50 border border-slate-200/80 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
                  alt="Orthodontics & Aligners"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-slate-900">
                  Orthodontics
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Clear Aligners & Orthodontic Straightening
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Custom transparent aligners engineered to discreetly align teeth with minimal discomfort and rapid outcomes.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(true)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:text-blue-800 transition"
                >
                  <span>Learn More</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* Service 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8 }}
              className="group rounded-3xl bg-slate-50 border border-slate-200/80 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80"
                  alt="Dental Implants"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-slate-900">
                  Implantology
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Permanent Dental Implants & Restorations
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Titanium-reinforced posts and porcelain zirconia crowns that match your natural smile permanently.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(true)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:text-blue-800 transition"
                >
                  <span>Learn More</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER (Matching reference layout with infinite marquee wordmark)
         ========================================================================= */}
      <Footer />

      {/* =========================================================================
          FLOATING BACK TO TOP BUTTON
         ========================================================================= */}
      <AnimatePresence>
        {isScrolled && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => scrollTo("home")}
            className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-slate-900/90 text-white border border-white/20 backdrop-blur-md shadow-2xl flex items-center justify-center hover:bg-sky-600 transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* =========================================================================
          APPOINTMENT BOOKING MODAL
         ========================================================================= */}
      <AnimatePresence>
        {bookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 z-10"
            >
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>

              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Appointment Requested!
                  </h3>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Our clinic reception team will contact you shortly to confirm your booking date and time.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold mb-2">
                      <Calendar size={13} />
                      Schedule Visit
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Book an Appointment
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Fill in your details below and we will confirm your consultation.
                    </p>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={bookingForm.name}
                        onChange={(e) =>
                          setBookingForm({ ...bookingForm, name: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="Enter your phone number"
                          value={bookingForm.phone}
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, phone: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="Enter your email address"
                          value={bookingForm.email}
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, email: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Required Service
                        </label>
                        <select
                          value={bookingForm.service}
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, service: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value="Orthodontics">Clear Aligners</option>
                          <option value="Implants">Dental Implants</option>
                          <option value="Emergency">Emergency Toothache</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Preferred Date
                        </label>
                        <input
                          type="date"
                          required
                          value={bookingForm.preferredDate}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              preferredDate: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>



                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-md shadow-blue-500/20"
                    >
                      Confirm Booking Request
                    </motion.button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}