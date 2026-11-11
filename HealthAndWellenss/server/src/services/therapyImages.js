import { fileURLToPath } from 'node:url'
export const therapyUploadDirectory = fileURLToPath(new URL('../../uploads/therapies/', import.meta.url))
export const validTherapyImage = (value) => typeof value === 'string' && (/^https?:\/\/[^\s]+$/i.test(value) || /^\/api\/media\/[a-f0-9-]+\.(png|jpg|webp)$/.test(value))
