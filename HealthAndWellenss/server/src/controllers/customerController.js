import Customer, { toCustomerView } from '../models/Customer.js'
import { httpError } from '../utils/httpError.js'
import { isValidDateStr, todayStr } from '../utils/dates.js'
import { makeCustomerId, nextSequence } from '../utils/ids.js'
import { signCustomerToken, verifyToken } from '../utils/token.js'
import { tierFor } from '../services/settingsService.js'
import { notifyCustomer, notifyStaff } from '../services/notificationService.js'

const validateDob = (dob) => {
  if (!isValidDateStr(dob) || dob > todayStr() || dob < '1900-01-01') {
    throw httpError(400, 'Please enter a valid date of birth')
  }
}

// Wellness form se sirf ye 4 fields lete hain
const pickWellness = (w = {}) => ({
  concern: w.concern,
  bodyArea: w.bodyArea,
  details: w.details || '',
  history: w.history || '',
})

// POST /api/customers/register — OTP verify ke baad poora form yahan aata hai
export const register = async (req, res) => {
  const { registrationToken, name, dob, gender, address, email, wellness, consent } = req.body || {}

  let payload
  try {
    payload = verifyToken(registrationToken)
  } catch {
    throw httpError(401, 'Mobile verification expired. Please verify your number again.')
  }
  if (payload.purpose !== 'register') throw httpError(401, 'Please verify your mobile number first')
  if (!consent?.privacy) throw httpError(400, 'Please accept the Privacy Policy and Terms to continue')
  validateDob(dob)

  if (await Customer.exists({ mobile: payload.mobile })) {
    throw httpError(409, 'This mobile number is already registered. Please log in instead.')
  }

  // Pehle validate karo, phir hi ID number lo — warna galat form pe bhi number barbaad hota
  const customer = new Customer({
    customerId: 'pending',
    name,
    dob,
    gender: gender || '',
    mobile: payload.mobile,
    address,
    email: email || '',
    wellness: pickWellness(wellness),
    consent: {
      privacy: true,
      followUp: Boolean(consent.followUp),
      promotional: Boolean(consent.promotional),
      acceptedAt: new Date(),
    },
  })
  await customer.validate()
  customer.customerId = makeCustomerId(await nextSequence('customer'))
  await customer.save()

  notifyCustomer(customer._id, {
    type: 'registration',
    title: 'Welcome to our wellness family!',
    message: `Your Customer ID is ${customer.customerId}. Show your QR code at the centre for quick check-in.`,
    link: '/profile',
  })
  notifyStaff({
    type: 'registration',
    title: 'New registration',
    message: `${customer.name} (${customer.customerId}) registered — concern: ${customer.wellness.concern}`,
    link: `/admin/customers/${customer._id}`,
  })

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token: signCustomerToken(customer),
    customer: toCustomerView(customer, await tierFor(0)),
  })
}

// GET /api/customers/me
export const getMe = async (req, res) => {
  const c = req.customer
  res.json({ success: true, data: toCustomerView(c, await tierFor(c.visitsCount)) })
}

// PATCH /api/customers/me — profile edit (mobile number nahi badal sakta)
export const updateMe = async (req, res) => {
  const { name, dob, gender, address, email, wellness, consent } = req.body || {}
  const c = req.customer

  if (dob !== undefined) {
    validateDob(dob)
    c.dob = dob
  }
  if (name !== undefined) c.name = name
  if (gender !== undefined) c.gender = gender
  if (address !== undefined) c.address = address
  if (email !== undefined) c.email = email
  if (wellness) c.wellness = { ...c.wellness.toObject(), ...pickWellness({ ...c.wellness.toObject(), ...wellness }) }
  if (consent) {
    if (consent.followUp !== undefined) c.consent.followUp = Boolean(consent.followUp)
    if (consent.promotional !== undefined) c.consent.promotional = Boolean(consent.promotional)
  }

  await c.save()
  res.json({ success: true, message: 'Profile updated', data: toCustomerView(c, await tierFor(c.visitsCount)) })
}

// GET /api/customers/scan/:customerId — QR scan pe public ko sirf naam + ID (health data private)
export const scanLookup = async (req, res) => {
  const customer = await Customer.findOne({ customerId: req.params.customerId.toUpperCase() })
    .select('customerId name')
    .lean()
  if (!customer) throw httpError(404, 'No customer found for this QR code')

  const [first, ...rest] = customer.name.split(' ')
  const lastInitial = rest.length ? ` ${rest.at(-1)[0]}.` : ''
  res.json({ success: true, data: { customerId: customer.customerId, displayName: `${first}${lastInitial}` } })
}
