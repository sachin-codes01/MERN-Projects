import Notification from '../models/Notification.js'

// Notification banana kabhi main kaam (booking etc.) ko fail na kare — isliye error sirf log hota hai
const safeCreate = async (data) => {
  try {
    await Notification.create(data)
  } catch (err) {
    console.error('Notification failed:', err.message)
  }
}

export const notifyCustomer = (customerId, { type, title, message, link = '' }) =>
  safeCreate({ audience: 'customer', customer: customerId, type, title, message, link })

export const notifyStaff = ({ type, title, message, link = '' }) =>
  safeCreate({ audience: 'staff', type, title, message, link })
