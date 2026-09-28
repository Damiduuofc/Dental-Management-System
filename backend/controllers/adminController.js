import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Stripe from 'stripe';
import Admin from '../models/Admin.js';
import User from "../models/User.js";
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import { generateAppointmentReceiptPdf, generateBillingReceiptPdf, generatePrescriptionPdf } from '../utils/pdfGenerator.js';
import { sendAppointmentConfirmationEmail, sendPatientWelcomeEmail, sendBillingReceiptEmail, sendTempPasswordEmail, sendPrescriptionEmail } from '../utils/emailService.js';
import Notification from '../models/Notification.js';
import Billing from '../models/Billing.js';
import TreatmentPlan from '../models/TreatmentPlan.js';
import XRayRecord from '../models/XRayRecord.js';
import Prescription from '../models/Prescription.js';
import Inventory from '../models/Inventory.js';
import InventoryLog from '../models/InventoryLog.js';
import SupplierOrder from '../models/SupplierOrder.js';
import { sendRealTimeNotification } from '../socket.js';
import { addToGoogleCalendar } from '../utils/googleCalendarService.js';


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
    const patients = await Patient.find({}).select("name email phoneNumber dob gender nic homeAddress allergies");
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching patients", error: error.message });
  }
};

export const getAppointments = async (req, res) => {
  const { patientId } = req.query;
  try {
    const filter = patientId ? { patient: patientId } : {};
    const appointments = await Appointment.find(filter)
      .populate("patient", "name email phoneNumber allergies")
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
      .populate("patient", "name email phoneNumber allergies")
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

      await Notification.create({
        title: "New Appointment Booked",
        message: `A new appointment for ${treatment} with Dr. ${populatedAppt.dentist?.fullName || 'N/A'} has been booked by administration on ${new Date(date).toLocaleDateString()} at ${time}.`,
        type: 'booking',
        recipientRole: 'assistant'
      });

      if (dentistId) {
        await Notification.create({
          dentist: dentistId,
          title: "New Appointment Assigned",
          message: `A new appointment for ${treatment} with patient ${populatedAppt.patient?.name || 'N/A'} has been booked by administration on ${new Date(date).toLocaleDateString()} at ${time}.`,
          type: 'booking'
        });
      }

      // Check if confirmed directly on create
      if (status === 'Confirmed' || populatedAppt.status === 'Confirmed') {
        try {
          await addToGoogleCalendar({
            dentistEmail: populatedAppt.dentist?.email,
            dentistName: populatedAppt.dentist?.fullName,
            patientName: populatedAppt.patient?.name,
            treatment: populatedAppt.treatment,
            date: populatedAppt.date,
            time: populatedAppt.time
          });
        } catch (calErr) {
          console.error("Failed to add to Google Calendar on create:", calErr);
        }
      }
    } catch (notifErr) {
      console.error("Failed to create admin booking notifications:", notifErr);
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

    // Check if slot is already booked for this dentist on this date (excluding current appointment)
    const checkDentist = dentistId || originalAppt.dentist;
    const checkDate = date || originalAppt.date;
    const checkTime = time || originalAppt.time;
    const checkStatus = status || originalAppt.status;

    if (checkStatus !== 'Cancelled') {
      const targetDate = new Date(checkDate);
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const conflictingAppt = await Appointment.findOne({
        _id: { $ne: id },
        dentist: checkDentist,
        date: { $gte: startOfDay, $lte: endOfDay },
        time: checkTime,
        status: { $ne: 'Cancelled' }
      });

      if (conflictingAppt) {
        return res.status(400).json({ message: "This time slot is already booked for the selected doctor." });
      }
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
    ).populate("patient", "name email phoneNumber allergies")
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

      // Notify Dentist
      await Notification.create({
        dentist: appointment.dentist?._id,
        title: "Appointment Rescheduled",
        message: `Your appointment for ${appointment.treatment} with patient ${appointment.patient?.name || 'N/A'} has been rescheduled to ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}.`,
        type: 'reschedule'
      });
    }

    if (isCancelled) {
      // Notify Dentist
      await Notification.create({
        dentist: appointment.dentist?._id,
        title: "Appointment Cancelled",
        message: `Your appointment for ${appointment.treatment} with patient ${appointment.patient?.name || 'N/A'} has been cancelled.`,
        type: 'cancel'
      });
    }

    // Google Calendar Sync check
    const isConfirmed = status === 'Confirmed' && originalAppt.status !== 'Confirmed';
    const shouldSyncCalendar = isConfirmed || (isRescheduled && appointment.status === 'Confirmed');

    if (shouldSyncCalendar) {
      try {
        await addToGoogleCalendar({
          dentistEmail: appointment.dentist?.email,
          dentistName: appointment.dentist?.fullName,
          patientName: appointment.patient?.name,
          treatment: appointment.treatment,
          date: appointment.date,
          time: appointment.time
        });
      } catch (calErr) {
        console.error("Failed to sync Google Calendar event on update:", calErr);
      }
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
  const { name, email, phoneNumber, dob, gender, nic, homeAddress } = req.body;

  if (!homeAddress) {
    return res.status(400).json({ message: "Home address is required." });
  }

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
      homeAddress,
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

export const updatePatient = async (req, res) => {
  const { id } = req.params;
  const { name, email, phoneNumber, dob, gender, nic, homeAddress, allergies } = req.body;

  try {
    if (email) {
      const existingEmail = await Patient.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email is already in use by another patient." });
      }
    }

    if (phoneNumber) {
      const existingPhone = await Patient.findOne({ phoneNumber, _id: { $ne: id } });
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number is already in use by another patient." });
      }
    }

    if (nic) {
      const existingNIC = await Patient.findOne({ nic, _id: { $ne: id } });
      if (existingNIC) {
        return res.status(400).json({ message: "NIC is already in use by another patient." });
      }
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { name, email, phoneNumber, dob, gender, nic, homeAddress, allergies },
      { new: true }
    ).select("-password");

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    res.json({ message: "Patient record updated successfully", patient: updatedPatient });
  } catch (error) {
    res.status(500).json({ message: "Server error updating patient", error: error.message });
  }
};

export const getBills = async (req, res) => {
  try {
    const bills = await Billing.find()
      .populate('patient', 'name email phoneNumber')
      .populate('dentist', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching bills", error: error.message });
  }
};

export const createBill = async (req, res) => {
  const { patientId, amount, treatment, status, paymentMethod, items, dentistId, amountPaid, dueAmount } = req.body;
  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    let calculatedAmount = amount;
    let calculatedTreatment = treatment;

    if (items && items.length > 0) {
      calculatedAmount = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      calculatedTreatment = items.map(item => item.name).filter(Boolean).join(', ');
    }

    let finalAmountPaid = amountPaid !== undefined ? Number(amountPaid) : 0;
    let finalStatus = status || 'Unpaid';

    if (finalStatus === 'Paid') {
      finalAmountPaid = calculatedAmount;
    } else if (finalStatus === 'Unpaid') {
      finalAmountPaid = 0;
    }

    let finalDueAmount = calculatedAmount - finalAmountPaid;
    if (finalDueAmount < 0) finalDueAmount = 0;

    if (finalDueAmount === 0) {
      finalStatus = 'Paid';
    } else if (finalAmountPaid > 0 && finalDueAmount > 0) {
      finalStatus = 'Partially Paid';
    }

    const bill = await Billing.create({
      patient: patientId,
      amount: calculatedAmount,
      amountPaid: finalAmountPaid,
      dueAmount: finalDueAmount,
      treatment: calculatedTreatment,
      status: finalStatus,
      paymentMethod: paymentMethod || 'N/A',
      dentist: dentistId || null,
      items: items || [],
      date: new Date()
    });

    // Notification
    await Notification.create({
      patient: patientId,
      title: "Invoice Generated",
      message: `An invoice of Rs. ${Number(calculatedAmount).toLocaleString()} has been generated for your ${calculatedTreatment} treatment.`,
      type: 'billing'
    });

    // Send Receipt Email if Paid
    if (bill.status === 'Paid') {
      try {
        const pdfBuffer = await generateBillingReceiptPdf(patient.name, bill);
        await sendBillingReceiptEmail(patient.email, patient.name, bill, pdfBuffer);
      } catch (emailErr) {
        console.error("Failed to generate/send invoice receipt email on creation:", emailErr);
      }
    }

    res.status(201).json({ message: "Invoice created successfully", bill });
  } catch (error) {
    res.status(500).json({ message: "Server error creating bill", error: error.message });
  }
};

export const updateBill = async (req, res) => {
  const { id } = req.params;
  const { amount, status, treatment, paymentMethod, items, dentistId, amountPaid, dueAmount } = req.body;
  try {
    const bill = await Billing.findById(id);
    if (!bill) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const originalStatus = bill.status;

    if (items && items.length > 0) {
      bill.items = items;
      bill.amount = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      bill.treatment = items.map(item => item.name).filter(Boolean).join(', ');
    } else {
      if (amount !== undefined) bill.amount = amount;
      if (treatment !== undefined) bill.treatment = treatment;
    }

    let finalAmountPaid = amountPaid !== undefined ? Number(amountPaid) : bill.amountPaid;
    let finalStatus = status !== undefined ? status : bill.status;

    // Synchronize statuses if amountPaid is not provided but status is updated
    if (status !== undefined && amountPaid === undefined) {
      if (finalStatus === 'Paid') {
        finalAmountPaid = bill.amount;
      } else if (finalStatus === 'Unpaid') {
        finalAmountPaid = 0;
      }
    }

    let finalDueAmount = bill.amount - finalAmountPaid;
    if (finalDueAmount < 0) finalDueAmount = 0;

    if (finalDueAmount === 0) {
      finalStatus = 'Paid';
    } else if (finalAmountPaid > 0 && finalDueAmount > 0) {
      finalStatus = 'Partially Paid';
    } else if (finalAmountPaid === 0) {
      finalStatus = 'Unpaid';
    }

    bill.amountPaid = finalAmountPaid;
    bill.dueAmount = finalDueAmount;
    bill.status = finalStatus;
    if (paymentMethod !== undefined) bill.paymentMethod = paymentMethod;
    if (dentistId !== undefined) bill.dentist = dentistId || null;

    await bill.save();

    // Create notification for patient about payment updates
    await Notification.create({
      patient: bill.patient,
      title: "Invoice Updated",
      message: `Your invoice for ${bill.treatment} has been updated. Status: ${bill.status}, Amount: Rs. ${Number(bill.amount).toLocaleString()}.`,
      type: 'billing'
    });

    // Send Receipt Email if transitioned to Paid
    if (bill.status === 'Paid' && originalStatus !== 'Paid') {
      try {
        const populatedBill = await Billing.findById(bill._id).populate('patient');
        if (populatedBill && populatedBill.patient) {
          const pdfBuffer = await generateBillingReceiptPdf(populatedBill.patient.name, populatedBill);
          await sendBillingReceiptEmail(populatedBill.patient.email, populatedBill.patient.name, populatedBill, pdfBuffer);
        }
      } catch (emailErr) {
        console.error("Failed to generate/send invoice receipt email on update:", emailErr);
      }
    }

    res.json({ message: "Invoice updated successfully", bill });
  } catch (error) {
    res.status(500).json({ message: "Server error updating bill", error: error.message });
  }
};

export const getBillingSummary = async (req, res) => {
  try {
    const [bills, inventoryItems, restockLogs, supplierOrders] = await Promise.all([
      Billing.find(),
      Inventory.find(),
      InventoryLog.find({ type: 'restock' }).populate('item', 'price name'),
      SupplierOrder.find({ status: { $in: ['Requested', 'Confirmed'] } })
    ]);

    const itemPriceById = new Map();
    const itemPriceByName = new Map();
    inventoryItems.forEach(item => {
      itemPriceById.set(String(item._id), Number(item.price || 0));
      if (item.name) itemPriceByName.set(item.name.trim().toLowerCase(), Number(item.price || 0));
    });

    const totalSales = bills
      .reduce((sum, b) => sum + (b.amountPaid !== undefined && b.amountPaid > 0 ? b.amountPaid : (b.status === 'Paid' ? b.amount : 0)), 0);
    const totalOutstanding = bills
      .reduce((sum, b) => {
        const due = b.dueAmount !== undefined ? b.dueAmount : (b.status === 'Paid' ? 0 : b.amount);
        return sum + due;
      }, 0);

    let totalExpenses = 0;
    restockLogs.forEach(log => {
      const unitPrice = log.item?.price !== undefined
        ? Number(log.item.price)
        : (itemPriceById.get(String(log.item?._id || log.item)) || 0);
      totalExpenses += Number(log.quantity || 0) * unitPrice;
    });

    supplierOrders.forEach(order => {
      const unitPrice = (order.inventoryItem && itemPriceById.get(String(order.inventoryItem))) ||
        (order.itemName && itemPriceByName.get(order.itemName.trim().toLowerCase())) ||
        0;
      totalExpenses += Number(order.quantity || 0) * unitPrice;
    });
    
    const statusCounts = { Paid: 0, Unpaid: 0, Pending: 0, 'Partially Paid': 0 };
    bills.forEach(b => {
      const s = b.status || 'Unpaid';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const treatmentRevenue = {};
    bills.forEach(b => {
      const paid = b.amountPaid !== undefined && b.amountPaid > 0 ? b.amountPaid : (b.status === 'Paid' ? b.amount : 0);
      if (paid > 0) {
        treatmentRevenue[b.treatment] = (treatmentRevenue[b.treatment] || 0) + paid;
      }
    });

    res.json({
      totalSales,
      totalExpenses,
      totalOutstanding,
      statusCounts,
      treatmentRevenue,
      totalInvoices: bills.length
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching billing summary", error: error.message });
  }
};

export const getMonthlyCashflow = async (req, res) => {
  try {
    const { month, startDate, endDate, mode } = req.query;

    let start;
    let end;

    if (month && /^\d{4}-\d{2}$/.test(String(month))) {
      const [yearStr, monthStr] = String(month).split('-');
      const year = Number(yearStr);
      const monthIdx = Number(monthStr) - 1;
      start = new Date(year, monthIdx, 1, 0, 0, 0, 0);
      end = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
    } else if (startDate) {
      start = new Date(String(startDate));
      start.setHours(0, 0, 0, 0);
      if (endDate) {
        end = new Date(String(endDate));
      } else {
        end = new Date(start.getTime() + 29 * 24 * 60 * 60 * 1000);
      }
      end.setHours(23, 59, 59, 999);
    } else {
      // Default: 1-month period (last 30 days ending today)
      end = new Date();
      end.setHours(23, 59, 59, 999);
      start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
    }

    const toLocalDateKey = (d) => {
      const dt = new Date(d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const formatShortLabel = (d) => {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    };

    // Build daily buckets for every day in the 1-month range
    const dailyMap = new Map();
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = toLocalDateKey(cursor);
      dailyMap.set(key, {
        date: key,
        label: formatShortLabel(cursor),
        incoming: 0,
        expenses: 0,
        net: 0,
        incomingCount: 0,
        expenseCount: 0
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const [bills, inventoryItems, restockLogs, supplierOrders] = await Promise.all([
      Billing.find({
        $or: [
          { date: { $gte: start, $lte: end } },
          { createdAt: { $gte: start, $lte: end } }
        ]
      }),
      Inventory.find(),
      InventoryLog.find({
        type: 'restock',
        createdAt: { $gte: start, $lte: end }
      }).populate('item', 'price name'),
      SupplierOrder.find({
        status: { $in: ['Requested', 'Confirmed'] },
        $or: [
          { orderDate: { $gte: start, $lte: end } },
          { createdAt: { $gte: start, $lte: end } }
        ]
      })
    ]);

    const itemPriceById = new Map();
    const itemPriceByName = new Map();
    inventoryItems.forEach(item => {
      itemPriceById.set(String(item._id), Number(item.price || 0));
      if (item.name) {
        itemPriceByName.set(item.name.trim().toLowerCase(), Number(item.price || 0));
      }
    });

    // Aggregate Incoming (collected patient billing revenue)
    bills.forEach(bill => {
      const rawDate = bill.date || bill.createdAt;
      if (!rawDate) return;
      const key = toLocalDateKey(rawDate);
      const bucket = dailyMap.get(key);
      if (!bucket) return;

      const paidAmount = bill.amountPaid !== undefined && bill.amountPaid > 0
        ? Number(bill.amountPaid)
        : (bill.status === 'Paid' ? Number(bill.amount || 0) : 0);

      if (paidAmount > 0) {
        bucket.incoming += paidAmount;
        bucket.incomingCount += 1;
      }
    });

    // Aggregate Expenses from Inventory Restock Logs
    restockLogs.forEach(log => {
      if (!log.createdAt) return;
      const key = toLocalDateKey(log.createdAt);
      const bucket = dailyMap.get(key);
      if (!bucket) return;

      const unitPrice = log.item?.price !== undefined
        ? Number(log.item.price)
        : (itemPriceById.get(String(log.item?._id || log.item)) || 0);
      const cost = Number(log.quantity || 0) * unitPrice;

      if (cost > 0) {
        bucket.expenses += cost;
        bucket.expenseCount += 1;
      }
    });

    // Aggregate Expenses from pending/confirmed Supplier Orders (Delivered orders already create restock logs)
    supplierOrders.forEach(order => {
      const rawDate = order.orderDate || order.createdAt;
      if (!rawDate) return;
      const key = toLocalDateKey(rawDate);
      const bucket = dailyMap.get(key);
      if (!bucket) return;

      const unitPrice = (order.inventoryItem && itemPriceById.get(String(order.inventoryItem))) ||
        (order.itemName && itemPriceByName.get(order.itemName.trim().toLowerCase())) ||
        0;
      const cost = Number(order.quantity || 0) * unitPrice;

      if (cost > 0) {
        bucket.expenses += cost;
        bucket.expenseCount += 1;
      }
    });

    const dailyData = Array.from(dailyMap.values()).map(day => ({
      ...day,
      net: day.incoming - day.expenses
    }));

    const totalIncoming = dailyData.reduce((sum, d) => sum + d.incoming, 0);
    const totalExpenses = dailyData.reduce((sum, d) => sum + d.expenses, 0);
    const incomingCount = dailyData.reduce((sum, d) => sum + d.incomingCount, 0);
    const expenseCount = dailyData.reduce((sum, d) => sum + d.expenseCount, 0);

    res.json({
      period: {
        startDate: toLocalDateKey(start),
        endDate: toLocalDateKey(end),
        month: month || null,
        mode: mode || (month ? 'month' : 'rolling30'),
        daysCount: dailyData.length
      },
      totals: {
        totalIncoming,
        totalExpenses,
        netBalance: totalIncoming - totalExpenses,
        incomingCount,
        expenseCount
      },
      dailyData
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching monthly cashflow data", error: error.message });
  }
};

export const createAdminCheckoutSession = async (req, res) => {
  const { id } = req.params;
  const { amountToPay } = req.body;
  try {
    const bill = await Billing.findById(id);
    if (!bill) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
    const chargeAmount = amountToPay !== undefined ? Number(amountToPay) : (bill.dueAmount !== undefined ? bill.dueAmount : bill.amount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'lkr',
          product_data: {
            name: bill.treatment,
            description: `Dental Treatment Invoice: ${bill.treatment}`,
          },
          unit_amount: chargeAmount * 100, // Stripe expects cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/billing?payment_success=true&bill_id=${id}&amount_paid=${chargeAmount}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/billing?payment_cancel=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Server error creating checkout session", error: error.message });
  }
};

export const resetStaffPassword = async (req, res) => {
  const { staffId } = req.body;
  if (!staffId) {
    return res.status(400).json({ message: "staffId is required." });
  }

  try {
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 characters

    // Update password
    staff.password = tempPassword;
    await staff.save();

    // Send email with credentials
    try {
      await sendTempPasswordEmail(staff.email, staff.fullName, tempPassword);
    } catch (emailErr) {
      console.error("Temp password email failed to send:", emailErr);
    }

    res.json({ message: "Temporary password generated and emailed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error resetting password", error: error.message });
  }
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current password and new password are required." });
  }

  try {
    let account;
    if (req.user.role === 'system_admin' || req.user.role === 'admin') {
      account = await Admin.findById(req.user.id);
    } else if (req.user.role === 'patient') {
      account = await Patient.findById(req.user.id);
    } else {
      account = await User.findById(req.user.id);
    }

    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, account.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    // Update password
    account.password = newPassword;
    await account.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error updating password", error: error.message });
  }
};

export const getDentistNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ dentist: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching dentist notifications", error: error.message });
  }
};

export const markDentistNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ dentist: req.user.id }, { read: true });
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error updating dentist notifications", error: error.message });
  }
};

export const getLatestClinicalDetails = async (req, res) => {
  const { patientId } = req.params;
  try {
    // Find the latest appointment with any clinical data for this patient
    const latestAppt = await Appointment.findOne({
      patient: patientId,
      $or: [
        { allergies: { $ne: '' } },
        { complains: { $ne: '' } },
        { onExamination: { $ne: '' } },
        { treatmentPlan: { $ne: '' } },
        { treatmentDone: { $ne: '' } }
      ]
    }).sort({ date: -1, createdAt: -1 });

    if (latestAppt) {
      res.json({
        allergies: latestAppt.allergies || '',
        complains: latestAppt.complains || '',
        onExamination: latestAppt.onExamination || '',
        treatmentPlan: latestAppt.treatmentPlan || '',
        treatmentDone: latestAppt.treatmentDone || ''
      });
    } else {
      res.json({
        allergies: '',
        complains: '',
        onExamination: '',
        treatmentPlan: '',
        treatmentDone: ''
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error fetching latest clinical details", error: error.message });
  }
};

export const checkInPatient = async (req, res) => {
  const { patientId } = req.params;
  const { allergies, complains, onExamination, treatmentPlan, treatmentDone } = req.body;

  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Look for active appointments today
    let appt = await Appointment.findOne({
      patient: patientId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled', 'Completed'] }
    });

    if (!appt) {
      // Look for any upcoming confirmed or pending appointment
      appt = await Appointment.findOne({
        patient: patientId,
        status: { $in: ['Pending', 'Confirmed'] }
      }).sort({ date: 1 });
    }

    if (!appt) {
      // Create quick walk-in appointment if none exists
      const dentist = await User.findOne({ role: 'dentist' });
      if (!dentist) {
        return res.status(400).json({ message: "No dentist found in the system to assign walk-in check-in." });
      }

      appt = await Appointment.create({
        patient: patientId,
        dentist: dentist._id,
        treatment: "General Consultation (Walk-in)",
        date: startOfDay,
        time: "09:00 AM",
        status: 'Confirmed'
      });
    }

    // Save details on this appointment
    appt.allergies = allergies || '';
    appt.complains = complains || '';
    appt.onExamination = onExamination || '';
    appt.treatmentPlan = treatmentPlan || '';
    appt.treatmentDone = treatmentDone || '';
    appt.status = 'Arrived'; // Mark arrived on check-in

    await appt.save();

    // Also persist allergies on the Patient profile
    await Patient.findByIdAndUpdate(patientId, { allergies: allergies || '' });
    
    // Trigger Google Calendar if confirmed
    try {
      const populatedAppt = await Appointment.findById(appt._id)
        .populate("patient", "name email phoneNumber allergies")
        .populate("dentist", "fullName email phoneNumber");

      await addToGoogleCalendar({
        dentistEmail: populatedAppt.dentist?.email,
        dentistName: populatedAppt.dentist?.fullName,
        patientName: populatedAppt.patient?.name,
        treatment: populatedAppt.treatment,
        date: populatedAppt.date,
        time: populatedAppt.time
      });
    } catch (calErr) {
      console.error("Google Calendar trigger failed on check-in:", calErr);
    }

    res.json({ message: "Patient checked in successfully!", appointment: appt });
  } catch (error) {
    res.status(500).json({ message: "Server error checking in patient", error: error.message });
  }
};

export const getStaffProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let account;
    if (userRole === 'system_admin') {
      account = await Admin.findById(userId).select("-password");
    } else {
      account = await User.findById(userId).select("-password");
    }

    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    res.json({
      id: account._id,
      fullName: account.fullName,
      email: account.email,
      phoneNumber: account.phoneNumber || '',
      role: userRole
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

export const updateStaffProfile = async (req, res) => {
  try {
    const { fullName, email, phoneNumber } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    let updatedAccount;

    if (userRole === 'system_admin') {
      if (email) {
        const existingAdminEmail = await Admin.findOne({ email, _id: { $ne: userId } });
        const existingUserEmail = await User.findOne({ email });
        if (existingAdminEmail || existingUserEmail) {
          return res.status(400).json({ message: "Email is already in use by another account." });
        }
      }

      updatedAccount = await Admin.findByIdAndUpdate(
        userId,
        { fullName, email },
        { new: true }
      ).select("-password");
    } else {
      if (email) {
        const existingAdminEmail = await Admin.findOne({ email });
        const existingUserEmail = await User.findOne({ email, _id: { $ne: userId } });
        if (existingAdminEmail || existingUserEmail) {
          return res.status(400).json({ message: "Email is already in use by another account." });
        }
      }

      updatedAccount = await User.findByIdAndUpdate(
        userId,
        { fullName, email, phoneNumber },
        { new: true }
      ).select("-password");
    }

    if (!updatedAccount) {
      return res.status(404).json({ message: "Account not found." });
    }

    res.json({
      id: updatedAccount._id,
      fullName: updatedAccount.fullName,
      email: updatedAccount.email,
      phoneNumber: updatedAccount.phoneNumber || '',
      role: userRole
    });
  } catch (error) {
    res.status(500).json({ message: "Server error updating profile: " + error.message });
  }
};


// --- DOCTOR TREATMENT PLANS ---

// GET /api/admin/treatment-plans
export const getTreatmentPlans = async (req, res) => {
  const { patientId, dentistId, status, search } = req.query;
  try {
    const filter = {};
    if (patientId) filter.patient = patientId;
    if (dentistId) filter.dentist = dentistId;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
        { treatmentPlan: { $regex: search, $options: 'i' } }
      ];
    }

    const plans = await TreatmentPlan.find(filter)
      .populate('patient', 'name email phoneNumber dob gender allergies')
      .populate('dentist', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching treatment plans", error: error.message });
  }
};

// POST /api/admin/treatment-plans
export const createTreatmentPlan = async (req, res) => {
  const {
    patientId,
    dentistId,
    title,
    diagnosis,
    treatmentPlan,
    treatmentDone,
    status,
    estimatedCost,
    startDate,
    targetDate,
    notes
  } = req.body;

  try {
    if (!patientId || !title || !treatmentPlan) {
      return res.status(400).json({ message: "Patient, title, and treatment plan are required." });
    }

    // Default dentist to current logged-in user if not supplied
    const effectiveDentistId = dentistId || req.user?.id;

    const newPlan = await TreatmentPlan.create({
      patient: patientId,
      dentist: effectiveDentistId,
      title: title.trim(),
      diagnosis: diagnosis ? diagnosis.trim() : '',
      treatmentPlan: treatmentPlan.trim(),
      treatmentDone: treatmentDone ? treatmentDone.trim() : '',
      status: status || 'In Progress',
      estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      targetDate: targetDate ? new Date(targetDate) : undefined,
      notes: notes ? notes.trim() : ''
    });

    const populated = await TreatmentPlan.findById(newPlan._id)
      .populate('patient', 'name email phoneNumber dob gender allergies')
      .populate('dentist', 'fullName email phoneNumber');

    // Notify patient
    try {
      const patientNotif = await Notification.create({
        patient: patientId,
        title: "New Treatment Plan Created",
        message: `Dr. ${populated.dentist?.fullName || 'Your dentist'} has formulated a treatment plan: "${title}".`,
        type: "general"
      });
      sendRealTimeNotification(patientNotif);
    } catch (notifErr) {
      console.error("Error creating notification for patient:", notifErr);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error creating treatment plan", error: error.message });
  }
};

// PUT /api/admin/treatment-plans/:id
export const updateTreatmentPlan = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    diagnosis,
    treatmentPlan,
    treatmentDone,
    status,
    estimatedCost,
    targetDate,
    completedDate,
    notes
  } = req.body;

  try {
    const plan = await TreatmentPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: "Treatment plan not found" });
    }

    if (title) plan.title = title.trim();
    if (diagnosis !== undefined) plan.diagnosis = diagnosis.trim();
    if (treatmentPlan) plan.treatmentPlan = treatmentPlan.trim();
    if (treatmentDone !== undefined) plan.treatmentDone = treatmentDone.trim();
    if (estimatedCost !== undefined) plan.estimatedCost = Number(estimatedCost);
    if (targetDate !== undefined) plan.targetDate = targetDate ? new Date(targetDate) : undefined;
    if (notes !== undefined) plan.notes = notes.trim();

    if (status) {
      plan.status = status;
      if (status === 'Completed' && !plan.completedDate) {
        plan.completedDate = completedDate ? new Date(completedDate) : new Date();
      }
    }

    const updated = await plan.save();
    const populated = await TreatmentPlan.findById(updated._id)
      .populate('patient', 'name email phoneNumber dob gender allergies')
      .populate('dentist', 'fullName email phoneNumber');

    // Notify patient of update
    try {
      const patientNotif = await Notification.create({
        patient: plan.patient,
        title: "Treatment Plan Updated",
        message: `Your treatment plan "${plan.title}" has been updated by your doctor. Current status: ${plan.status}.`,
        type: "general"
      });
      sendRealTimeNotification(patientNotif);
    } catch (notifErr) {
      console.error("Error sending update notification:", notifErr);
    }

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error updating treatment plan", error: error.message });
  }
};

// DELETE /api/admin/treatment-plans/:id
export const deleteTreatmentPlan = async (req, res) => {
  const { id } = req.params;
  try {
    const plan = await TreatmentPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: "Treatment plan not found" });
    }

    await plan.deleteOne();
    res.json({ message: "Treatment plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting treatment plan", error: error.message });
  }
};


// --- DOCTOR X-RAYS & DIAGNOSTIC IMAGING ---

// GET /api/admin/xrays
export const getXRays = async (req, res) => {
  const { patientId, category, search } = req.query;
  try {
    const filter = {};
    if (patientId) filter.patient = patientId;
    if (category && category !== 'All') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { findings: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const records = await XRayRecord.find(filter)
      .populate('patient', 'name email phoneNumber dob gender')
      .populate('dentist', 'fullName email')
      .sort({ date: -1, createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching X-rays", error: error.message });
  }
};

// POST /api/admin/xrays
export const createXRay = async (req, res) => {
  const {
    patientId,
    dentistId,
    title,
    category,
    imageUrl,
    date,
    findings,
    notes
  } = req.body;

  try {
    if (!patientId || !title || !imageUrl) {
      return res.status(400).json({ message: "Patient, title, and X-ray image are required." });
    }

    const effectiveDentistId = dentistId || req.user?.id;

    const newRecord = await XRayRecord.create({
      patient: patientId,
      dentist: effectiveDentistId,
      title: title.trim(),
      category: category || 'Panoramic',
      imageUrl,
      date: date ? new Date(date) : new Date(),
      findings: findings ? findings.trim() : '',
      notes: notes ? notes.trim() : ''
    });

    const populated = await XRayRecord.findById(newRecord._id)
      .populate('patient', 'name email phoneNumber dob gender')
      .populate('dentist', 'fullName email');

    // Notify patient
    try {
      const patientNotif = await Notification.create({
        patient: patientId,
        title: "New X-Ray Record Added",
        message: `Dr. ${populated.dentist?.fullName || 'Your dentist'} has added a ${category || 'diagnostic'} X-ray to your patient records.`,
        type: "general"
      });
      sendRealTimeNotification(patientNotif);
    } catch (notifErr) {
      console.error("Error creating X-ray notification:", notifErr);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error creating X-ray record", error: error.message });
  }
};

// PUT /api/admin/xrays/:id
export const updateXRay = async (req, res) => {
  const { id } = req.params;
  const { title, category, imageUrl, date, findings, notes } = req.body;

  try {
    const record = await XRayRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: "X-ray record not found" });
    }

    if (title) record.title = title.trim();
    if (category) record.category = category;
    if (imageUrl) record.imageUrl = imageUrl;
    if (date) record.date = new Date(date);
    if (findings !== undefined) record.findings = findings.trim();
    if (notes !== undefined) record.notes = notes.trim();

    const updated = await record.save();
    const populated = await XRayRecord.findById(updated._id)
      .populate('patient', 'name email phoneNumber dob gender')
      .populate('dentist', 'fullName email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error updating X-ray record", error: error.message });
  }
};

// DELETE /api/admin/xrays/:id
export const deleteXRay = async (req, res) => {
  const { id } = req.params;
  try {
    const record = await XRayRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: "X-ray record not found" });
    }

    await record.deleteOne();
    res.json({ message: "X-ray record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting X-ray record", error: error.message });
  }
};

// --- PRESCRIPTIONS MANAGEMENT ---

// GET /api/admin/prescriptions
export const getPrescriptions = async (req, res) => {
  const { patientId } = req.query;
  try {
    const filter = patientId ? { patient: patientId } : {};
    const prescriptions = await Prescription.find(filter)
      .populate('patient', 'name email phoneNumber dob gender allergies nic')
      .populate('dentist', 'fullName email phoneNumber')
      .sort({ date: -1, createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching prescriptions", error: error.message });
  }
};

// POST /api/admin/prescriptions
export const createPrescription = async (req, res) => {
  const {
    patientId,
    dentistId,
    date,
    diagnosis,
    medications,
    notes,
    status
  } = req.body;

  try {
    if (!patientId || !diagnosis || !medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ message: "Patient, diagnosis, and at least one medication are required." });
    }

    const effectiveDentistId = dentistId || req.user?.id;

    const newPrescription = await Prescription.create({
      patient: patientId,
      dentist: effectiveDentistId,
      date: date ? new Date(date) : new Date(),
      diagnosis: diagnosis.trim(),
      medications: medications.map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        duration: m.duration.trim(),
        instructions: m.instructions ? m.instructions.trim() : ""
      })),
      notes: notes ? notes.trim() : "",
      status: status || "Active"
    });

    const populated = await Prescription.findById(newPrescription._id)
      .populate('patient', 'name email phoneNumber dob gender allergies nic')
      .populate('dentist', 'fullName email phoneNumber');

    // Notify patient
    try {
      const patientNotif = await Notification.create({
        patient: patientId,
        title: "New Prescription Issued",
        message: `Dr. ${populated.dentist?.fullName || 'Your dentist'} has issued a new prescription for: "${diagnosis}".`,
        type: "general"
      });
      sendRealTimeNotification(patientNotif);
    } catch (notifErr) {
      console.error("Error creating notification for patient:", notifErr);
    }

    // Send official prescription email with attached PDF to the patient
    if (populated.patient?.email) {
      try {
        const pdfBuffer = await generatePrescriptionPdf(populated.patient.name, populated);
        await sendPrescriptionEmail(populated.patient.email, populated.patient.name, populated, pdfBuffer);
      } catch (emailErr) {
        console.error("Error sending prescription email to patient:", emailErr);
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error creating prescription", error: error.message });
  }
};

// PUT /api/admin/prescriptions/:id
export const updatePrescription = async (req, res) => {
  const { id } = req.params;
  const { diagnosis, medications, notes, status } = req.body;

  try {
    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (diagnosis) prescription.diagnosis = diagnosis.trim();
    if (medications && Array.isArray(medications) && medications.length > 0) {
      prescription.medications = medications.map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        duration: m.duration.trim(),
        instructions: m.instructions ? m.instructions.trim() : ""
      }));
    }
    if (notes !== undefined) prescription.notes = notes.trim();
    if (status) prescription.status = status;

    const updated = await prescription.save();
    const populated = await Prescription.findById(updated._id)
      .populate('patient', 'name email phoneNumber dob gender allergies nic')
      .populate('dentist', 'fullName email phoneNumber');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error updating prescription", error: error.message });
  }
};

// DELETE /api/admin/prescriptions/:id
export const deletePrescription = async (req, res) => {
  const { id } = req.params;
  try {
    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    await prescription.deleteOne();
    res.json({ message: "Prescription deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting prescription", error: error.message });
  }
};

// POST /api/admin/prescriptions/:id/send-email
export const sendPrescriptionEmailToPatient = async (req, res) => {
  const { id } = req.params;

  try {
    const prescription = await Prescription.findById(id)
      .populate('patient', 'name email phoneNumber dob gender allergies nic')
      .populate('dentist', 'fullName email phoneNumber');

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (!prescription.patient?.email) {
      return res.status(400).json({ message: "Patient does not have a registered email address." });
    }

    const pdfBuffer = await generatePrescriptionPdf(prescription.patient.name, prescription);
    const result = await sendPrescriptionEmail(prescription.patient.email, prescription.patient.name, prescription, pdfBuffer);

    res.json({
      message: `Prescription email sent successfully to ${prescription.patient.email}`,
      result
    });
  } catch (error) {
    console.error("Error in sendPrescriptionEmailToPatient:", error);
    res.status(500).json({ message: "Failed to send prescription email", error: error.message });
  }
};