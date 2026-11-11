import { Router } from 'express'
import { protectCustomer } from '../middleware/auth.js'
import { loginLimiter, otpLimiter } from '../middleware/rateLimit.js'
import { sendOtp, verifyOtp } from '../controllers/authController.js'
import { getMe, register, scanLookup, updateMe } from '../controllers/customerController.js'
import { getTherapy, listTherapies } from '../controllers/therapyController.js'
import {
  cancelMyAppointment,
  createAppointment,
  getMyAppointment,
  getSlots,
  listMyAppointments,
} from '../controllers/appointmentController.js'
import {
  createFeedback,
  getPublicSettings,
  listNotifications,
  markNotificationsRead,
  myLoyalty,
  myReminders,
} from '../controllers/engagementController.js'
import { login as staffLogin } from '../controllers/staffController.js'
import adminRoutes from './adminRoutes.js'

const router = Router()

// ===== Public (bina login) =====
router.get('/health', (req, res) => res.json({ success: true, message: 'Server is running' }))
router.get('/settings/public', getPublicSettings)
router.get('/therapies', listTherapies)
router.get('/therapies/:slug', getTherapy)
router.get('/appointments/slots', getSlots)
router.get('/customers/scan/:customerId', scanLookup)

router.post('/auth/otp/send', otpLimiter, sendOtp)
router.post('/auth/otp/verify', otpLimiter, verifyOtp)
router.post('/customers/register', register)
router.post('/staff/login', loginLimiter, staffLogin)

// ===== Staff / Admin panel (apna alag protect andar hai) =====
router.use('/admin', adminRoutes)

// ===== Customer (login zaroori) =====
router.get('/customers/me', protectCustomer, getMe)
router.patch('/customers/me', protectCustomer, updateMe)

router.post('/appointments', protectCustomer, createAppointment)
router.get('/appointments/mine', protectCustomer, listMyAppointments)
router.get('/appointments/:id', protectCustomer, getMyAppointment)
router.patch('/appointments/:id/cancel', protectCustomer, cancelMyAppointment)

router.get('/reminders/mine', protectCustomer, myReminders)
router.post('/feedback', protectCustomer, createFeedback)
router.get('/offers/mine', protectCustomer, myLoyalty)
router.get('/notifications', protectCustomer, listNotifications)
router.patch('/notifications/read', protectCustomer, markNotificationsRead)

export default router
