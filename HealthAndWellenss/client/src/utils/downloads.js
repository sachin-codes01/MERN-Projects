import { slotToMinutes } from './format.js'

// Browser me file download karwane ka helper
const downloadFile = (filename, href) => {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// ===== "Add to Calendar" — .ics file jo Google/Apple/Outlook calendar me khulti hai =====
const pad = (n) => String(n).padStart(2, '0')

export const downloadIcs = (appointment, settings) => {
  const [y, m, d] = appointment.date.split('-').map(Number)
  const start = slotToMinutes(appointment.slot)
  // "90–120 mins" me se bada number = duration
  const minutes = Number((appointment.duration || '').match(/(\d+)\s*mins/)?.[1]) || 60
  const end = start + minutes
  const stamp = (mins) => `${y}${pad(m)}${pad(d)}T${pad(Math.floor(mins / 60))}${pad(mins % 60)}00`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SRSHWC//Appointments//EN',
    'BEGIN:VEVENT',
    `UID:${appointment.appointmentId}@srshwc`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${appointment.therapyName} – ${settings.centreName}`,
    `DESCRIPTION:Appointment ID: ${appointment.appointmentId}. Please arrive 10 minutes early.`,
    settings.address ? `LOCATION:${settings.address.replace(/,/g, '\\,')}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Appointment reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  downloadFile(`${appointment.appointmentId}.ics`, url)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ===== "Save to Wallet" — QR ke saath ek sundar card image (PNG) =====
export const downloadQrCard = (qrCanvas, customer, centreName) => {
  const W = 600
  const H = 820
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#faf7f0'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#dcc28a'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(30, 30, W - 60, H - 60, 28)
  ctx.fill()
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#1f5135'
  ctx.font = '600 34px "Cormorant Garamond", Georgia, serif'
  ctx.fillText('Shree Radhey Shyam', W / 2, 105)
  ctx.fillStyle = '#b08a3e'
  ctx.font = '500 16px Poppins, sans-serif'
  ctx.fillText(centreName.replace('Shree Radhey Shyam ', '').toUpperCase(), W / 2, 135)

  ctx.fillStyle = '#66706a'
  ctx.font = '400 18px Poppins, sans-serif'
  ctx.fillText('Customer ID', W / 2, 200)
  ctx.fillStyle = '#1f2a24'
  ctx.font = '600 30px Poppins, sans-serif'
  ctx.fillText(customer.customerId, W / 2, 240)

  ctx.drawImage(qrCanvas, (W - 320) / 2, 270, 320, 320)

  ctx.fillStyle = '#1f5135'
  ctx.font = '600 30px "Cormorant Garamond", Georgia, serif'
  ctx.fillText(customer.name, W / 2, 650)
  ctx.fillStyle = '#66706a'
  ctx.font = '400 16px Poppins, sans-serif'
  ctx.fillText('Show this QR code at the centre for quick check-in', W / 2, 700)

  downloadFile(`${customer.customerId}-wellness-card.png`, canvas.toDataURL('image/png'))
}

// ===== CSV export (reports) =====
export const downloadCsv = (filename, rows) => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(escape).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
  downloadFile(filename, url)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// WhatsApp pe message bhejne ka link (staff follow-up ke liye)
export const whatsappLink = (mobile, text) => `https://wa.me/91${mobile}?text=${encodeURIComponent(text)}`

// QR me ek link hota hai: /scan/SRSHWC-000001
// Staff scan kare to customer ki poori profile khulti hai, baaki logon ko sirf naam + ID
export const scanUrl = (customerId) => `${window.location.origin}/scan/${customerId}`
