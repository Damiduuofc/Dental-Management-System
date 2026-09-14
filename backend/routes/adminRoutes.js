import express from "express";
import { 
  createAdmin,
  login,
  createAccount,
  getStaff,
  getPatients,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  addPatient,
  updatePatient,
  getBills,
  createBill,
  updateBill,
  getBillingSummary,
  createAdminCheckoutSession,
  resetStaffPassword,
  updatePassword,
  getDentistNotifications,
  markDentistNotificationsAsRead,
  getLatestClinicalDetails,
  checkInPatient,
  getStaffProfile,
  updateStaffProfile,
  getTreatmentPlans,
  createTreatmentPlan,
  updateTreatmentPlan,
  deleteTreatmentPlan,
  getXRays,
  createXRay,
  updateXRay,
  deleteXRay,
  getPrescriptions,
  createPrescription,
  updatePrescription,
  deletePrescription,
  sendPrescriptionEmailToPatient
} from "../controllers/adminController.js";
import { verifyToken, isAdmin, isStaff, isAdminOrAssistant } from '../middleware/authMiddleware.js';
import { getAuthUrl } from '../utils/googleCalendarService.js';

const router = express.Router();

router.post("/register", verifyToken, isAdmin, createAdmin);
router.post("/login", login);
router.post("/create-account", verifyToken, isAdminOrAssistant, createAccount);
router.get('/staff', verifyToken, isAdminOrAssistant, getStaff);
router.post('/reset-staff-password', verifyToken, isAdminOrAssistant, resetStaffPassword);
router.post('/update-password', verifyToken, updatePassword);
router.get('/profile', verifyToken, isStaff, getStaffProfile);
router.put('/profile', verifyToken, isStaff, updateStaffProfile);
router.get('/dentist/notifications', verifyToken, isStaff, getDentistNotifications);
router.put('/dentist/notifications/read', verifyToken, isStaff, markDentistNotificationsAsRead);
router.get('/calendar/auth', (req, res) => {
  res.redirect(getAuthUrl());
});
router.get('/patients/:patientId/latest-clinical-details', verifyToken, isStaff, getLatestClinicalDetails);
router.post('/patients/:patientId/check-in', verifyToken, isStaff, checkInPatient);

// Appointment & Patient management routes
router.get('/patients', verifyToken, isStaff, getPatients);
router.post('/patients', verifyToken, isStaff, addPatient);
router.put('/patients/:id', verifyToken, isStaff, updatePatient);
router.get('/appointments', verifyToken, isStaff, getAppointments);
router.post('/appointments', verifyToken, isStaff, createAppointment);
router.put('/appointments/:id', verifyToken, isStaff, updateAppointment);
router.delete('/appointments/:id', verifyToken, isStaff, deleteAppointment);

// Billing management routes
router.get('/billing', verifyToken, isStaff, getBills);
router.post('/billing', verifyToken, isStaff, createBill);
router.put('/billing/:id', verifyToken, isStaff, updateBill);
router.post('/billing/:id/checkout-session', verifyToken, isStaff, createAdminCheckoutSession);
router.get('/billing/summary', verifyToken, isStaff, getBillingSummary);

// Clinical Treatment Plans routes
router.get('/treatment-plans', verifyToken, isStaff, getTreatmentPlans);
router.post('/treatment-plans', verifyToken, isStaff, createTreatmentPlan);
router.put('/treatment-plans/:id', verifyToken, isStaff, updateTreatmentPlan);
router.delete('/treatment-plans/:id', verifyToken, isStaff, deleteTreatmentPlan);

// Diagnostic X-Rays & Imaging routes
router.get('/xrays', verifyToken, isStaff, getXRays);
router.post('/xrays', verifyToken, isStaff, createXRay);
router.put('/xrays/:id', verifyToken, isStaff, updateXRay);
router.delete('/xrays/:id', verifyToken, isStaff, deleteXRay);

// Prescriptions management routes
router.get('/prescriptions', verifyToken, isStaff, getPrescriptions);
router.post('/prescriptions', verifyToken, isStaff, createPrescription);
router.put('/prescriptions/:id', verifyToken, isStaff, updatePrescription);
router.delete('/prescriptions/:id', verifyToken, isStaff, deletePrescription);
router.post('/prescriptions/:id/send-email', verifyToken, isStaff, sendPrescriptionEmailToPatient);

export default router;