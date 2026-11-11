import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Therapy from '../models/Therapy.js'
import Offer from '../models/Offer.js'
import Staff from '../models/Staff.js'
import { getSettings } from '../services/settingsService.js'
import { addDays, todayStr } from '../utils/dates.js'
import { slugify } from '../utils/httpError.js'

// "npm run seed" — safe hai, baar baar chala sakte ho:
// therapies naam se update/insert hoti hain, admin aur offers sirf tab bante hain jab koi na ho
const THERAPIES = [
  {
    name: 'Full Body Relaxation',
    description: 'A complete relaxation therapy that helps release muscle tension, improve circulation and restore overall balance.',
    price: 2500, durationMin: 90, durationMax: 120,
    areas: ['Neck', 'Shoulders', 'Back', 'Arms', 'Legs'],
  },
  {
    name: 'Upper Body Relaxation',
    description: 'Focused therapy for the neck, shoulders, upper back and arms to relieve stiffness from long hours of sitting.',
    price: 1600, durationMin: 45, durationMax: 60,
    areas: ['Neck', 'Shoulders', 'Upper Back', 'Arms'],
  },
  {
    name: 'Lower Body (Legs) Relaxation',
    description: 'Soothing therapy for tired legs and feet that eases heaviness, cramps and improves blood flow.',
    price: 1300, durationMin: 45, durationMax: 60,
    areas: ['Thighs', 'Calves', 'Feet'],
  },
  {
    name: 'Double Body Part Therapy',
    description: 'Targeted therapy for any two body parts of your choice, ideal for specific pain points.',
    price: 1300, durationMin: 45, durationMax: 60,
    areas: ['Any two body parts'],
  },
  {
    name: 'Single Body Part Therapy',
    description: 'Short, focused therapy for one area such as the neck, back or shoulder.',
    price: 1000, durationMin: 35, durationMax: 40,
    areas: ['Any one body part'],
  },
  {
    name: 'Single Knee Therapy',
    description: 'Gentle therapy to reduce knee pain and stiffness and improve mobility in one knee.',
    price: 1000, durationMin: 35, durationMax: 40,
    areas: ['Knee'],
  },
  {
    name: 'Double Knee Therapy',
    description: 'Therapy for both knees to ease joint pain, swelling and stiffness.',
    price: 1300, durationMin: 35, durationMax: 40,
    areas: ['Both Knees'],
  },
]

const seed = async () => {
  await connectDB()
  await getSettings() // settings document na ho to default se ban jaata hai

  for (const [order, t] of THERAPIES.entries()) {
    const slug = slugify(t.name)
    await Therapy.updateOne({ slug }, { $setOnInsert: { ...t, slug, order } }, { upsert: true })
  }
  console.log(`Therapies ready (${await Therapy.countDocuments()})`)

  if (!(await Offer.exists({}))) {
    await Offer.insertMany([
      { title: '10% off on your next therapy', description: 'For our Silver members.', discountPercent: 10, minTier: 'Silver', validTill: addDays(todayStr(), 60) },
      { title: 'Welcome offer: 5% off', description: 'For your first visit.', discountPercent: 5, minTier: 'Bronze', validTill: addDays(todayStr(), 90) },
    ])
    console.log('Sample offers added')
  }

  if (!(await Staff.exists({ role: 'admin' }))) {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.log('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create the first admin')
    } else {
      await Staff.create({
        name: ADMIN_NAME || 'Admin',
        email: ADMIN_EMAIL,
        role: 'admin',
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      })
      console.log(`Admin created: ${ADMIN_EMAIL} (password from .env)`)
    }
  }

  await mongoose.disconnect()
}

seed()
