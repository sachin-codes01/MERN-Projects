import Counter from '../models/Counter.js'

// Har naye customer/appointment ke liye agla number atomic tarike se ($inc) —
// do request ek saath aayein to bhi same number kabhi nahi milega
export const nextSequence = async (name) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  )
  return counter.seq
}

const pad = (n) => String(n).padStart(6, '0')

export const makeCustomerId = (n) => `SRSHWC-${pad(n)}`
export const makeAppointmentId = (n) => `SRSHWC-APL-${pad(n)}`
