import 'dotenv/config'
import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import app from '../app.js'
import Staff from '../models/Staff.js'
import { signStaffToken } from '../utils/token.js'
import { therapyUploadDirectory } from '../services/therapyImages.js'

test('admin photo upload, gallery persistence, validation and legacy updates', async () => {
  const dbName = 'therapy_images_test_' + randomUUID().replaceAll('-', '')
  let server
  const uploaded = []
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName })
    server = app.listen(0, '127.0.0.1')
    await new Promise(resolve => server.once('listening', resolve))
    const base = 'http://127.0.0.1:' + server.address().port
    const admin = await Staff.create({ name: 'Test admin', email: 'admin@example.test', passwordHash: 'test-only', role: 'admin' })
    const staff = await Staff.create({ name: 'Test staff', email: 'staff@example.test', passwordHash: 'test-only', role: 'staff' })
    const auth = { Authorization: 'Bearer ' + signStaffToken(admin) }
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6hkAAAAASUVORK5CYII=', 'base64')
    const upload = (headers, body = png) => fetch(base + '/api/admin/therapy-images', { method: 'POST', headers: { 'Content-Type': 'image/png', ...headers }, body })
    assert.equal((await upload({})).status, 401)
    assert.equal((await upload({ Authorization: 'Bearer ' + signStaffToken(staff) })).status, 403)
    assert.equal((await upload(auth, Buffer.from('not an image'))).status, 400)
    assert.equal((await upload(auth, Buffer.alloc(5 * 1024 * 1024 + 1))).status, 413)
    for (let i = 0; i < 4; i++) {
      const response = await upload(auth)
      assert.equal(response.status, 201)
      const data = await response.json()
      uploaded.push(data.data.url)
    }
    const imageResponse = await fetch(base + uploaded[0])
    assert.equal(imageResponse.status, 200)
    assert.match(imageResponse.headers.get('content-type'), /image\/png/)
    assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), png)
    const jsonHeaders = { ...auth, 'Content-Type': 'application/json' }
    const body = { name: 'Gallery test therapy', description: 'Test gallery persistence and compatibility.', price: 100, durationMin: 30, durationMax: 40, image: uploaded[0], images: uploaded }
    const created = await fetch(base + '/api/admin/therapies', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(body) })
    assert.equal(created.status, 201)
    const { data: therapy } = await created.json()
    const publicResponse = await fetch(base + '/api/therapies/' + therapy.slug)
    assert.deepEqual((await publicResponse.json()).data.images, uploaded)
    const updated = await fetch(base + '/api/admin/therapies/' + therapy._id, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ price: 150 }) })
    assert.deepEqual((await updated.json()).data.images, uploaded)
    for (const images of [['javascript:alert(1)'], Array(13).fill(uploaded[0]), 'invalid']) {
      const invalid = await fetch(base + '/api/admin/therapies/' + therapy._id, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ images }) })
      assert.equal(invalid.status, 400)
    }
    const legacy = await fetch(base + '/api/admin/therapies', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ ...body, name: 'Legacy cover only', images: undefined }) })
    assert.equal(legacy.status, 201)
    assert.deepEqual((await legacy.json()).data.images, [])
  } finally {
    if (server) await new Promise(resolve => server.close(resolve))
    for (const url of uploaded) await unlink(join(therapyUploadDirectory, url.split('/').at(-1)))
    if (mongoose.connection.name === dbName) await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
})
