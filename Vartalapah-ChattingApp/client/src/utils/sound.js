// ==========================================================
// NOTIFICATION SOUND
//
// Naya message aane par halki si "ping" - koi .mp3 file nahi chahiye,
// Web Audio API se seedha do chhote tone bajate hain (bundle me kuch
// extra nahi judta)
//
// Browser policy: AudioContext bina kisi user click/tap ke shuru nahi
// ho sakta. Isliye ek hi context banate hain aur use bar-bar reuse
// karte hain - agar wo "suspended" hai (pehla message user ke kisi
// interaction se PEHLE aaya) to bas chup chaap kuch nahi karte, error
// nahi dikhate
// ==========================================================

let audioCtx = null

const getContext = () => {
  if (audioCtx) return audioCtx

  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null

  audioCtx = new Ctx()
  return audioCtx
}

// Ek chhota "tone" - frequency aur kab bajana hai (seconds me, ctx ke
// current time se relative)
const playTone = (ctx, frequency, startAt, duration) => {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  oscillator.connect(gain)
  gain.connect(ctx.destination)

  // Chatak se shuru/khatam na ho - halka fade in/out
  gain.gain.setValueAtTime(0, ctx.currentTime + startAt)
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + startAt + 0.02)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startAt + duration)

  oscillator.start(ctx.currentTime + startAt)
  oscillator.stop(ctx.currentTime + startAt + duration)
}

export const playNotificationSound = () => {
  try {
    const ctx = getContext()
    if (!ctx || ctx.state === 'suspended') return

    // Do sur ek ke baad ek - WhatsApp jaisi "ping-pong" feel
    playTone(ctx, 880, 0, 0.12)
    playTone(ctx, 1108, 0.09, 0.15)
  } catch {
    // Sound sirf ek chhota sa ishara hai - fail ho jaye to chup chaap ignore,
    // message to already screen par aa chuka hai
  }
}
