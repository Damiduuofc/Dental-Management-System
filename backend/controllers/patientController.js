import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpEmail, sendAppointmentConfirmationEmail } from "../utils/emailService.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import { generateAppointmentReceiptPdf } from "../utils/pdfGenerator.js";
import Notification from "../models/Notification.js";
import Billing from "../models/Billing.js";

export const registerPatient = async (req, res) => {
  try {
    const { name, email, password, nic, phoneNumber, dob, gender } = req.body;

    // 1. Check if patient already exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ message: "Patient already exists with this email." });
    }

    // 2. Create and save new patient (Hashing is handled by the pre-save hook in Patient model)
    const newPatient = new Patient({
      name,
      email,
      password,
      nic,
      phoneNumber,
      dob,
      gender,
    });

    await newPatient.save();

    // Generate token
    const token = jwt.sign(
      { id: newPatient._id, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      token,
      user: {
        id: newPatient._id,
        name: newPatient.name,
        email: newPatient.email,
        role: "patient",
      },
      message: "Patient registered successfully!"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

export const loginPatient = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find patient by email
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Generate token
    const token = jwt.sign(
      { id: patient._id, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        role: "patient",
      },
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

export const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select("-password");
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found." });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(404).json({ message: "No patient account found with this email." });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP and expiration (10 minutes)
    patient.resetOtp = otp;
    patient.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await patient.save();

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.json({ message: "OTP verification code sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (!patient.resetOtp || patient.resetOtp !== otp || patient.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP code." });
    }

    res.json({ message: "OTP code verified successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    // Double check OTP validity
    if (!patient.resetOtp || patient.resetOtp !== otp || patient.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired verification session." });
    }

    // Update password (auto-hashes on patient.save due to schema hook)
    patient.password = newPassword;
    patient.resetOtp = undefined;
    patient.resetOtpExpires = undefined;
    await patient.save();

    // Generate Token
    const token = jwt.sign(
      { id: patient._id, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        role: "patient",
      },
      message: "Password reset and login successful",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

export const getDentists = async (req, res) => {
  try {
    const dentists = await User.find({ role: 'dentist' }).select("fullName email phoneNumber");
    res.json(dentists);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching dentists", error: error.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate("dentist", "fullName email phoneNumber")
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching appointments", error: error.message });
  }
};

export const createAppointment = async (req, res) => {
  const { dentistId, treatment, date, time, notes } = req.body;
  try {
    const appointment = new Appointment({
      patient: req.user.id,
      dentist: dentistId,
      treatment,
      date,
      time,
      notes: notes || '',
      status: 'Pending'
    });
    await appointment.save();

    const populatedAppt = await Appointment.findById(appointment._id)
      .populate("patient", "name email phoneNumber")
      .populate("dentist", "fullName email phoneNumber");

    // Generate PDF and Send Confirmation Email
    try {
      const pdfBuffer = await generateAppointmentReceiptPdf(
        populatedAppt.patient?.name || 'Valued Patient',
        populatedAppt
      );
      await sendAppointmentConfirmationEmail(
        populatedAppt.patient?.email,
        populatedAppt.patient?.name || 'Valued Patient',
        populatedAppt,
        pdfBuffer
      );
    } catch (emailErr) {
      console.error("Email generation failed but appointment was booked:", emailErr);
    }

    // Create Notification
    try {
      await Notification.create({
        patient: req.user.id,
        title: "Appointment Booked",
        message: `Your appointment for ${treatment} with Dr. ${populatedAppt.dentist?.fullName || 'N/A'} has been successfully booked.`,
        type: 'booking'
      });
    } catch (notifErr) {
      console.error("Failed to create booking notification:", notifErr);
    }

    res.status(201).json({ message: "Appointment booked successfully", appointment: populatedAppt });
  } catch (error) {
    res.status(500).json({ message: "Server error creating appointment", error: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, patient: req.user.id },
      { status: 'Cancelled' },
      { new: true }
    ).populate("dentist", "fullName email phoneNumber");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not authorized" });
    }

    // Create Notification
    try {
      await Notification.create({
        patient: req.user.id,
        title: "Appointment Cancelled",
        message: `Your appointment for ${appointment.treatment} with Dr. ${appointment.dentist?.fullName || 'N/A'} has been cancelled.`,
        type: 'cancel'
      });
    } catch (notifErr) {
      console.error("Failed to create cancellation notification:", notifErr);
    }

    res.json({ message: "Appointment cancelled successfully", appointment });
  } catch (error) {
    res.status(500).json({ message: "Server error cancelling appointment", error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ patient: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching notifications", error: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ patient: req.user.id }, { read: true });
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error updating notifications", error: error.message });
  }
};

export const getBills = async (req, res) => {
  try {
    let bills = await Billing.find({ patient: req.user.id }).sort({ createdAt: -1 });
    // Seeding sample invoices for testing if none exist
    if (bills.length === 0) {
      const mock1 = await Billing.create({
        patient: req.user.id,
        amount: 4500,
        treatment: 'Regular Checkup',
        status: 'Unpaid',
        date: new Date()
      });
      const mock2 = await Billing.create({
        patient: req.user.id,
        amount: 12500,
        treatment: 'Root Canal',
        status: 'Paid',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      });
      bills = [mock1, mock2];
    }
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching bills", error: error.message });
  }
};

export const payBill = async (req, res) => {
  const { id } = req.params;
  try {
    const bill = await Billing.findOneAndUpdate(
      { _id: id, patient: req.user.id },
      { status: 'Paid' },
      { new: true }
    );
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Create notification
    await Notification.create({
      patient: req.user.id,
      title: "Payment Successful",
      message: `Your payment of Rs. ${bill.amount.toLocaleString()} for ${bill.treatment} has been received.`,
      type: 'billing'
    });

    res.json({ message: "Bill paid successfully", bill });
  } catch (error) {
    res.status(500).json({ message: "Server error paying bill", error: error.message });
  }
};