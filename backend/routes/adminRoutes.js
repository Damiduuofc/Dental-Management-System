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
  getBills,
  createBill,
  updateBill,
  getBillingSummary,
  createAdminCheckoutSession
} from "../controllers/adminController.js";
import { verifyToken, isAdmin, isStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/register", createAdmin);
router.post("/login", login);
router.post("/create-account", verifyToken, isAdmin, createAccount);
router.get('/staff', verifyToken, isAdmin, getStaff);

// Appointment & Patient management routes
router.get('/patients', verifyToken, isStaff, getPatients);
router.post('/patients', verifyToken, isStaff, addPatient);
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

export default router;