import { Router, raw } from 'express'
import { uploadTherapyImage } from '../controllers/therapyImageController.js'
import { adminOnly, protectStaff } from '../middleware/auth.js'
import { getReport, getStats } from '../controllers/admin/dashboardController.js'
import { getCustomer, getCustomerByCode, listCustomers, updateCustomer } from '../controllers/admin/customerAdminController.js'
import {
  createAppointmentForCustomer,
  listAppointments,
  updateAppointment,
} from '../controllers/admin/appointmentAdminController.js'
import {
  createOffer,
  createReminder,
  deleteOffer,
  getAllSettings,
  listFeedback,
  listOffers,
  listReminders,
  saveSettings,
  updateFeedback,
  updateOffer,
  updateReminder,
} from '../controllers/admin/manageController.js'
import {
  adminListTherapies,
  createTherapy,
  deleteTherapy,
  updateTherapy,
} from '../controllers/therapyController.js'
import { changePassword, createStaff, getMe, listStaff, updateStaff } from '../controllers/staffController.js'
import { listNotifications, markNotificationsRead } from '../controllers/engagementController.js'

const router = Router()

// Yahan ke saare routes ke liye staff login zaroori
router.use(protectStaff)

// ----- Staff + Admin dono -----
router.get('/me', getMe)
router.patch('/me/password', changePassword)
router.get('/notifications', listNotifications)
router.patch('/notifications/read', markNotificationsRead)

router.get('/stats', getStats)

router.get('/customers', listCustomers)
router.get('/customers/code/:customerId', getCustomerByCode)
router.get('/customers/:id', getCustomer)
router.patch('/customers/:id', updateCustomer)

router.get('/appointments', listAppointments)
router.post('/appointments', createAppointmentForCustomer)
router.patch('/appointments/:id', updateAppointment)

router.get('/reminders', listReminders)
router.post('/reminders', createReminder)
router.patch('/reminders/:id', updateReminder)

router.get('/feedback', listFeedback)
router.get('/therapies', adminListTherapies)
router.get('/offers', listOffers)
router.get('/settings', getAllSettings)

// ----- Sirf Admin -----
router.patch('/feedback/:id', adminOnly, updateFeedback)

router.post('/therapy-images', adminOnly, raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), uploadTherapyImage)
router.post('/therapies', adminOnly, createTherapy)
router.put('/therapies/:id', adminOnly, updateTherapy)
router.delete('/therapies/:id', adminOnly, deleteTherapy)

router.post('/offers', adminOnly, createOffer)
router.put('/offers/:id', adminOnly, updateOffer)
router.delete('/offers/:id', adminOnly, deleteOffer)

router.put('/settings', adminOnly, saveSettings)
router.get('/reports', adminOnly, getReport)

router.get('/staff', adminOnly, listStaff)
router.post('/staff', adminOnly, createStaff)
router.patch('/staff/:id', adminOnly, updateStaff)

export default router
