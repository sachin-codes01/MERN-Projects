import Therapy from '../models/Therapy.js'
import Appointment from '../models/Appointment.js'
import { validTherapyImage } from '../services/therapyImages.js'
import { httpError, pick, slugify } from '../utils/httpError.js'

const FIELDS = ['name', 'description', 'price', 'durationMin', 'durationMax', 'areas', 'image', 'images', 'order', 'isActive']

// Areas comma wali string me bhi aa sakte hain ("Neck, Back") — array bana do
const cleanBody = (body) => {
  const data = pick(body, FIELDS)
  if (typeof data.areas === 'string') data.areas = data.areas.split(',')
  if (Array.isArray(data.areas)) data.areas = data.areas.map((a) => a.trim()).filter(Boolean)
  if (data.image !== undefined && data.image !== '' && !validTherapyImage(data.image)) throw httpError(400, 'Enter a valid cover image URL')
  if (data.images !== undefined) {
    if (!Array.isArray(data.images) || data.images.length > 12 || !data.images.every(validTherapyImage)) throw httpError(400, 'Add up to 12 valid gallery image URLs')
    data.images = [...new Set(data.images.map(url => url.trim()))]
  }
  return data
}

const checkDuration = (min, max) => {
  if (Number(max) < Number(min)) throw httpError(400, 'Maximum duration cannot be less than minimum duration')
}

// Same naam ki do therapy ho to slug me -2, -3 lagao
const uniqueSlug = async (name, excludeId) => {
  const base = slugify(name) || 'therapy'
  let slug = base
  for (let i = 2; await Therapy.exists({ slug, _id: { $ne: excludeId } }); i++) slug = `${base}-${i}`
  return slug
}

// ===== Public =====

// GET /api/therapies
export const listTherapies = async (req, res) => {
  const therapies = await Therapy.find({ isActive: true }).sort({ order: 1, createdAt: 1 })
  res.json({ success: true, data: therapies })
}

// GET /api/therapies/:slug
export const getTherapy = async (req, res) => {
  const therapy = await Therapy.findOne({ slug: req.params.slug, isActive: true })
  if (!therapy) throw httpError(404, 'Therapy not found')
  res.json({ success: true, data: therapy })
}

// ===== Admin =====

// GET /api/admin/therapies — hidden wali bhi, saath me booking count
export const adminListTherapies = async (req, res) => {
  const [therapies, counts] = await Promise.all([
    Therapy.find().sort({ order: 1, createdAt: 1 }).lean(),
    Appointment.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: '$therapy', count: { $sum: 1 } } }]),
  ])
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]))
  res.json({ success: true, data: therapies.map((t) => ({ ...t, bookings: countMap[String(t._id)] || 0 })) })
}

export const createTherapy = async (req, res) => {
  const data = cleanBody(req.body)
  checkDuration(data.durationMin, data.durationMax)
  const therapy = await Therapy.create({ ...data, slug: await uniqueSlug(data.name || '') })
  res.status(201).json({ success: true, message: 'Therapy added', data: therapy })
}

export const updateTherapy = async (req, res) => {
  const therapy = await Therapy.findById(req.params.id)
  if (!therapy) throw httpError(404, 'Therapy not found')

  const data = cleanBody(req.body)
  checkDuration(data.durationMin ?? therapy.durationMin, data.durationMax ?? therapy.durationMax)
  if (data.name && data.name !== therapy.name) data.slug = await uniqueSlug(data.name, therapy._id)

  therapy.set(data)
  await therapy.save()
  res.json({ success: true, message: 'Therapy updated', data: therapy })
}

// Jis therapy ki bookings hain use delete nahi karte (history toot jaayegi) — hide karo
export const deleteTherapy = async (req, res) => {
  if (await Appointment.exists({ therapy: req.params.id })) {
    throw httpError(400, 'This therapy has bookings, so it cannot be deleted. Hide it instead.')
  }
  const therapy = await Therapy.findByIdAndDelete(req.params.id)
  if (!therapy) throw httpError(404, 'Therapy not found')
  res.json({ success: true, message: 'Therapy deleted' })
}
