import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Customer from '../models/Customer.js'
import Therapy from '../models/Therapy.js'
import Appointment from '../models/Appointment.js'
import Feedback from '../models/Feedback.js'
import Reminder from '../models/Reminder.js'
import { getSettings } from '../services/settingsService.js'
import { addDays, slotToMinutes, todayStr } from '../utils/dates.js'
import { makeAppointmentId, makeCustomerId, nextSequence } from '../utils/ids.js'

// "npm run seed:demo" — dashboard dekhne ke liye nakli customers + visits
// Sirf tab chalta hai jab DB me koi customer na ho (asli data kabhi nahi chhedta)
const DEMO = [
  { name: 'Purab Saini', mobile: '9876543210', concern: 'Back pain', bodyArea: 'Back', visits: 5 },
  { name: 'Anjali Sharma', mobile: '9871122334', concern: 'Stress & anxiety', bodyArea: 'Full body', visits: 2 },
  { name: 'Rohan Kumar', mobile: '9812345678', concern: 'Knee pain', bodyArea: 'Knees', visits: 3 },
  { name: 'Priya Kumari', mobile: '8765432109', concern: 'Neck & shoulder pain', bodyArea: 'Neck', visits: 1 },
  { name: 'Vivek Joshi', mobile: '9123456789', concern: 'Muscle stiffness', bodyArea: 'Legs', visits: 0 },
]
const THERAPISTS = ['Rakesh Kumar', 'Amit Sharma']

const seedDemo = async () => {
  await connectDB()
  if (await Customer.exists({})) {
    console.log('Customers already exist — demo data skipped')
    return mongoose.disconnect()
  }

  const settings = await getSettings()
  const therapies = await Therapy.find().sort({ order: 1 })
  if (!therapies.length) {
    console.log('Run "npm run seed" first')
    return mongoose.disconnect()
  }

  const today = todayStr()
  for (const [i, d] of DEMO.entries()) {
    const customer = await Customer.create({
      customerId: makeCustomerId(await nextSequence('customer')),
      name: d.name,
      dob: `199${i}-0${i + 1}-1${i}`,
      mobile: d.mobile,
      address: 'Jaipur, Rajasthan',
      wellness: { concern: d.concern, bodyArea: d.bodyArea },
      consent: { privacy: true, followUp: true, promotional: i % 2 === 0, acceptedAt: new Date() },
      visitsCount: d.visits,
      loyaltyPoints: d.visits * settings.pointsPerVisit,
      createdAt: new Date(Date.now() - (120 - i * 20) * 86400000),
    })

    // Purani completed visits (har 12 din pe ek)
    for (let v = 0; v < d.visits; v++) {
      const therapy = therapies[(i + v) % therapies.length]
      const slot = settings.timeSlots[(i + v) % settings.timeSlots.length]
      const appt = await Appointment.create({
        appointmentId: makeAppointmentId(await nextSequence('appointment')),
        customer: customer._id,
        therapy: therapy._id,
        therapyName: therapy.name,
        duration: `${therapy.durationMin}–${therapy.durationMax} mins`,
        date: addDays(today, -(v + 1) * 12 - i),
        slot,
        slotOrder: slotToMinutes(slot),
        status: 'completed',
        price: therapy.price,
        finalPrice: therapy.price,
        therapist: THERAPISTS[v % 2],
        completedAt: new Date(),
      })
      if (v % 2 === 0) {
        await Feedback.create({ customer: customer._id, appointment: appt._id, therapyName: therapy.name, rating: 5 - (v % 2), comment: 'Very relaxing, felt much better.' })
      }
    }

    // Aaj aur aage ki booking
    const therapy = therapies[i % therapies.length]
    const slot = settings.timeSlots[(i + 3) % settings.timeSlots.length]
    await Appointment.create({
      appointmentId: makeAppointmentId(await nextSequence('appointment')),
      customer: customer._id,
      therapy: therapy._id,
      therapyName: therapy.name,
      duration: `${therapy.durationMin}–${therapy.durationMax} mins`,
      date: addDays(today, i % 3),
      slot,
      slotOrder: slotToMinutes(slot),
      price: therapy.price,
      finalPrice: therapy.price,
    })

    if (d.visits) {
      await Reminder.create({
        customer: customer._id,
        dueDate: addDays(today, i - 1),
        message: `Hi ${d.name.split(' ')[0]}, it's time for your follow-up session.`,
      })
    }
  }

  console.log(`Demo data added: ${DEMO.length} customers with visits and bookings`)
  await mongoose.disconnect()
}

seedDemo()
