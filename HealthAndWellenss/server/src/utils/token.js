import jwt from 'jsonwebtoken'

export const signToken = (payload, expiresIn) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn })

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET)

// Customer 30 din tak logged in rehta hai, staff 7 din
export const signCustomerToken = (customer) =>
  signToken({ id: customer._id, role: 'customer' }, '30d')

export const signStaffToken = (staff) => signToken({ id: staff._id, role: 'staff' }, '7d')
