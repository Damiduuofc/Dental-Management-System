import express from 'express';
import {
  registerPatient,
  loginPatient,
  getPatientProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getDentists,
  getAppointments,
  createAppointment,
  cancelAppointment,
  getNotifications,
  markNotificationAsRead,
  getBills,
  payBill
} from '../controllers/patientController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', registerPatient);
router.post('/login', loginPatient);
router.get('/profile', verifyToken, getPatientProfile);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Appointment routes
router.get('/dentists', verifyToken, getDentists);
router.get('/appointments', verifyToken, getAppointments);
router.post('/appointments', verifyToken, createAppointment);
router.put('/appointments/:id/cancel', verifyToken, cancelAppointment);

// Notifications & Billing routes
router.get('/notifications', verifyToken, getNotifications);
router.put('/notifications/read', verifyToken, markNotificationAsRead);
router.get('/billing', verifyToken, getBills);
router.put('/billing/:id/pay', verifyToken, payBill);

export default router;