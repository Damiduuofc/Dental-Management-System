import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Admin from '../models/Admin.js';
import User from "../models/User.js";
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import { generateAppointmentReceiptPdf } from '../utils/pdfGenerator.js';
import { sendAppointmentConfirmationEmail, sendPatientWelcomeEmail } from '../utils/emailService.js';
import Notification from '../models/Notification.js';
import Billing from '../models/Billing.js';


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // First, check the Admin collection
    let account = await Admin.findOne({ email });
    let isSystemAdmin = true;

    // If not found in Admin, check the User collection
    if (!account) {
      account = await User.findOne({ email });
      isSystemAdmin = false;
    }

    // Verify account existence and compare hashed password
    if (!account || !(await bcrypt.compare(password, account.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Determine the role for the token
    const tokenRole = isSystemAdmin
      ? (account.role === 'admin' ? 'system_admin' : account.role)
      : account.role; // e.g., 'dentist', 'assistant'

    // Generate Token
    const token = jwt.sign(
      { id: account._id, role: tokenRole },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: account._id,
        fullName: account.fullName,
        email: account.email,
        role: tokenRole
      },
      message: "Login successful"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Create a new instance of the Admin model
    // Note: The password hashing is handled by the pre-save hook in your model
    const newAdmin = new Admin({
      fullName,
      email,
      password,
    });

    // Save the data into the DB
    await newAdmin.save();

    res.status(201).json({ 
      message: "Admin account created successfully",
      adminId: newAdmin._id 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createAccount = async (req, res) => {
  const { fullName, email, phoneNumber, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const newUser = await User.create({
      fullName,
      email,
      phoneNumber,
      password,
      role
    });

    res.status(201).json({ message: "Account created successfully", userId: newUser._id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getStaff = async (_req, res) => {
  try {
    const staff = await User.find({ role: { $in: ["dentist", "assistant"] } })
      .select("fullName email phoneNumber role createdAt")
      .sort({ createdAt: -1 });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({}).select("name email phoneNumber dob gender nic");
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching patients", error: error.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate("patient", "name email phoneNumber")
      .populate("dentist", "fullName email phoneNumber")
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching appointments", error: error.message });
  }
};

export const createAppointment = async (req, res) => {
  const { patientId, dentistId, treatment, date, time, notes, status } = req.body;
  try {
    const appointment = new Appointment({
      patient: patientId,
      dentist: dentistId,
      treatment,
      date,
      time,
      notes: notes || '',
      status: status || 'Pending'
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
        patient: patientId,
        title: "Appointment Booked by Clinic",
        message: `An appointment for ${treatment} with Dr. ${populatedAppt.dentist?.fullName || 'N/A'} has been scheduled for you.`,
        type: 'booking'
      });
    } catch (notifErr) {
      console.error("Failed to create admin booking notification:", notifErr);
    }

    res.status(201).json({ message: "Appointment created successfully", appointment: populatedAppt });
  } catch (error) {
    res.status(500).json({ message: "Server error creating appointment", error: error.message });
  }
};

export const updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { dentistId, treatment, date, time, status, notes } = req.body;
  try {
    // Keep track of the original appointment to detect changes
    const originalAppt = await Appointment.findById(id);
    if (!originalAppt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const updateData = {};
    if (dentistId) updateData.dentist = dentistId;
    if (treatment) updateData.treatment = treatment;
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("patient", "name email phoneNumber")
     .populate("dentist", "fullName email phoneNumber");

    // Handle Notifications & Billing
    const isCancelled = status === 'Cancelled' && originalAppt.status !== 'Cancelled';
    const isCompleted = status === 'Completed' && originalAppt.status !== 'Completed';
    const isRescheduled = (date || time) && (date !== originalAppt.date?.toISOString().split('T')[0] || time !== originalAppt.time);

    if (isCancelled) {
      await Notification.create({
        patient: appointment.patient?._id,
        title: "Appointment Cancelled",
        message: `Your appointment for ${appointment.treatment} with Dr. ${appointment.dentist?.fullName || 'N/A'} has been cancelled by the clinic.`,
        type: 'cancel'
      });
    } else if (isCompleted) {
      // Auto-generate invoice
      const billAmount = Math.floor(Math.random() * (15000 - 2000 + 1) + 2000);
      await Billing.create({
        patient: appointment.patient?._id,
        amount: billAmount,
        treatment: appointment.treatment,
        status: 'Unpaid',
        date: new Date()
      });

      // Invoice Notification
      await Notification.create({
        patient: appointment.patient?._id,
        title: "Invoice Generated",
        message: `An invoice of Rs. ${billAmount.toLocaleString()} has been generated for your ${appointment.treatment} treatment.`,
        type: 'billing'
      });

      // Status Notification
      await Notification.create({
        patient: appointment.patient?._id,
        title: "Treatment Completed",
        message: `Your appointment for ${appointment.treatment} has been marked as Completed.`,
        type: 'general'
      });
    } else if (isRescheduled) {
      await Notification.create({
        patient: appointment.patient?._id,
        title: "Appointment Rescheduled",
        message: `Your appointment for ${appointment.treatment} with Dr. ${appointment.dentist?.fullName || 'N/A'} has been rescheduled to ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}.`,
        type: 'reschedule'
      });
    }

    res.json({ message: "Appointment updated successfully", appointment });
  } catch (error) {
    res.status(500).json({ message: "Server error updating appointment", error: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting appointment", error: error.message });
  }
};

export const addPatient = async (req, res) => {
  const { name, email, phoneNumber, dob, gender, nic } = req.body;
  try {
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ message: "Patient already exists with this email." });
    }

    // Generate a temporary password (8 characters)
    const tempPassword = crypto.randomBytes(4).toString('hex');

    const newPatient = new Patient({
      name,
      email,
      phoneNumber,
      dob,
      gender,
      nic,
      password: tempPassword
    });

    await newPatient.save();

    // Send welcome email with credentials
    try {
      await sendPatientWelcomeEmail(email, name, tempPassword);
    } catch (emailErr) {
      console.error("Welcome email failed to send:", emailErr);
    }

    res.status(201).json({ message: "Patient record created successfully", patient: { _id: newPatient._id, name, email } });
  } catch (error) {
    res.status(500).json({ message: "Server error creating patient", error: error.message });
  }
};