import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpEmail, sendAppointmentConfirmationEmail, sendBillingReceiptEmail } from "../utils/emailService.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import { generateAppointmentReceiptPdf, generateBillingReceiptPdf } from "../utils/pdfGenerator.js";
import Notification from "../models/Notification.js";
import Billing from "../models/Billing.js";
import Stripe from "stripe";

export const registerPatient = async (req, res) => {
  try {
    const { name, email, password, nic, phoneNumber, dob, gender, homeAddress } = req.body;

    if (!homeAddress) {
      return res.status(400).json({ message: "Home address is required." });
    }

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
      homeAddress,
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

export const updatePatientProfile = async (req, res) => {
  try {
    const { name, phoneNumber, nic, dob, gender, homeAddress, allergies } = req.body;
    const patientId = req.user.id;

    if (nic) {
      const existingPatientNIC = await Patient.findOne({ nic, _id: { $ne: patientId } });
      if (existingPatientNIC) {
        return res.status(400).json({ message: "NIC is already in use by another account." });
      }
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      { name, phoneNumber, nic, dob, gender, homeAddress, allergies },
      { new: true }
    ).select("-password");

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient profile not found." });
    }

    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: "Server error updating profile: " + error.message });
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
    // Check if slot is already booked for this dentist on this date
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      dentist: dentistId,
      date: { $gte: startOfDay, $lte: endOfDay },
      time,
      status: { $ne: 'Cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "This time slot is already booked for the selected doctor." });
    }

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

      if (dentist) {
        await Notification.create({
          dentist: dentist,
          title: "New Appointment Assigned",
          message: `A new appointment for ${treatment} has been booked by patient ${populatedAppt.patient?.name || 'N/A'} on ${date} at ${time}.`,
          type: "booking"
        });
      }
    } catch (notifErr) {
      console.error("Failed to create booking notifications:", notifErr);
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
    ).populate("dentist", "fullName email phoneNumber")
     .populate("patient", "name email phoneNumber");

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

      if (appointment.dentist) {
        await Notification.create({
          dentist: appointment.dentist._id,
          title: "Appointment Cancelled by Patient",
          message: `Appointment for ${appointment.treatment} with patient ${appointment.patient?.name || 'N/A'} has been cancelled by the patient.`,
          type: "cancel"
        });
      }
    } catch (notifErr) {
      console.error("Failed to create cancellation notifications:", notifErr);
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
    const bills = await Billing.find({ patient: req.user.id })
      .populate("dentist", "fullName email phoneNumber")
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching bills", error: error.message });
  }
};

export const payBill = async (req, res) => {
  const { id } = req.params;
  const { status, paymentMethod, amountPaid, dueAmount } = req.body;
  try {
    const bill = await Billing.findOne({ _id: id, patient: req.user.id });
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    bill.status = status || 'Paid';
    bill.paymentMethod = paymentMethod || 'Card';
    bill.amountPaid = amountPaid !== undefined ? Number(amountPaid) : bill.amount;
    bill.dueAmount = dueAmount !== undefined ? Number(dueAmount) : 0;

    await bill.save();

    // Create notification
    await Notification.create({
      patient: req.user.id,
      title: "Payment Successful",
      message: `Your payment of Rs. ${bill.amount.toLocaleString()} for ${bill.treatment} has been received.`,
      type: 'billing'
    });

    // Send Receipt Email
    try {
      const patient = await Patient.findById(req.user.id);
      if (patient) {
        const pdfBuffer = await generateBillingReceiptPdf(patient.name, bill);
        await sendBillingReceiptEmail(patient.email, patient.name, bill, pdfBuffer);
      }
    } catch (emailErr) {
      console.error("Failed to generate/send paid billing receipt email:", emailErr);
    }

    res.json({ message: "Bill paid successfully", bill });
  } catch (error) {
    res.status(500).json({ message: "Server error paying bill", error: error.message });
  }
};

export const createCheckoutSession = async (req, res) => {
  const { id } = req.params;
  try {
    const bill = await Billing.findOne({ _id: id, patient: req.user.id });
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
    const chargeAmount = bill.dueAmount !== undefined ? bill.dueAmount : bill.amount;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'lkr',
          product_data: {
            name: bill.treatment,
            description: `Dental Treatment: ${bill.treatment}`,
          },
          unit_amount: chargeAmount * 100, // Stripe expects cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/patient/billing?payment_success=true&bill_id=${id}&amount_paid=${chargeAmount}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/patient/billing?payment_cancel=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Server error creating checkout session", error: error.message });
  }
};

export const getBookedSlots = async (req, res) => {
  const { dentistId, date } = req.query;

  if (!dentistId || !date) {
    return res.status(400).json({ message: "dentistId and date are required parameters." });
  }

  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      dentist: dentistId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'Cancelled' }
    }).select('time');

    const bookedSlots = appointments.map(appt => appt.time);
    res.json(bookedSlots);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching booked slots", error: error.message });
  }
};