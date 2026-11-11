// One integrated phase keeps all four wings coordinated when frequency changes.
const tau = Math.PI * 2
const mix = (a, b, t) => a + (b - a) * t
const damp = (a, b, rate, dt) => mix(a, b, 1 - Math.exp(-rate * dt))
export const smooth = t => { t = Math.max(0, Math.min(1, t)); return t*t*t*(t*(t*6-15)+10) }

export function advanceWingMotion(m, dt, options) {
  const resting = m.state === 'RESTING' || m.state === 'IDLE'
  const progress = Math.min(1, m.elapsed / m.duration)
  let activity = resting ? 0 : 1
  let frequency = options.flapFrequency
  if (m.state === 'TAKEOFF') { activity = smooth(progress / .3); frequency *= 1.2 }
  if (m.state === 'APPROACHING') frequency *= .8
  if (m.state === 'LANDING') { frequency *= .65; activity = 1 - smooth(progress) * .95 }
  m.activity = damp(m.activity ?? 0, activity, 10, dt)
  m.frequency = damp(m.frequency ?? frequency, frequency, 5, dt)
  m.phase = ((m.phase ?? 0) + dt * m.frequency * tau) % tau
  m.legExtension = damp(m.legExtension ?? 1, resting || m.state === 'LANDING' ? 1 : 0, 5, dt)
}

export function wingPose(m, side, rear, options, out) {
  const phase = m.phase - (rear ? .09 : 0) + side * (m.bank || 0) * .035
  // Phase warp shortens the power stroke; derivatives remain continuous at reversal.
  const warped = phase + .22 * Math.sin(phase)
  const stroke = Math.cos(warped)
  const activity = m.activity
  const asymmetry = 1 + side * (m.bank || 0) * .055
  // Brief, sparse adjustments rather than a permanent resting oscillation.
  const adjustment = Math.pow(Math.max(0, Math.sin(m.time * .53)), 28) * .065
  // Keep a relaxed, partly open perch pose. A steep fold combined with the
  // right oblique view projected the near wing across the thorax and abdomen.
  out.fold = mix(.5 - adjustment, .35 + stroke * options.flapAmplitude * (rear ? .96 : 1) * asymmetry, activity)
  out.pitch = activity * (.085 * Math.sin(warped - .45) + side * (m.bank || 0) * .025)
  out.flex = options.wingFlex * activity * Math.sin(warped - .65) * (rear ? .75 : 1)
  return out
}
