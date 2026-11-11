import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { therapyUploadDirectory } from '../services/therapyImages.js'
import { httpError } from '../utils/httpError.js'

export const uploadTherapyImage = async (req, res) => {
  const bytes = req.body
  if (!Buffer.isBuffer(bytes) || !bytes.length) throw httpError(400, 'Choose a JPEG, PNG or WebP image')
  let extension
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) extension = 'png'
  else if (bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) extension = 'jpg'
  else if (bytes.length > 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') extension = 'webp'
  if (!extension) throw httpError(400, 'Only JPEG, PNG and WebP images are supported')
  await mkdir(therapyUploadDirectory, { recursive: true })
  const filename = randomUUID() + '.' + extension
  await writeFile(join(therapyUploadDirectory, filename), bytes, { flag: 'wx' })
  res.status(201).json({ success: true, data: { url: '/api/media/' + filename } })
}
