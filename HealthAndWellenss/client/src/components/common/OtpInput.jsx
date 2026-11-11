import { useEffect, useRef } from 'react'

const LENGTH = 6

// 6 alag box wala OTP input — type karte hi agla box, backspace pe pichhla, paste pe sab bhar jaata hai
const OtpInput = ({ value, onChange, onComplete, error = false, disabled = false }) => {
  const refs = useRef([])
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] || '')

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  const update = (next) => {
    onChange(next)
    if (next.length === LENGTH) onComplete?.(next)
  }

  const handleChange = (index, raw) => {
    const typed = raw.replace(/\D/g, '')
    if (!typed) return
    // Ek se zyada digit (autofill) aaye to aage ke boxes bhi bhar do
    const chars = [...digits]
    typed.split('').forEach((d, k) => {
      if (index + k < LENGTH) chars[index + k] = d
    })
    const next = chars.join('').slice(0, LENGTH)
    update(next)
    refs.current[Math.min(index + typed.length, LENGTH - 1)]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const chars = [...digits]
      if (chars[index]) {
        chars[index] = ''
      } else if (index > 0) {
        chars[index - 1] = ''
        refs.current[index - 1]?.focus()
      }
      onChange(chars.join('').replace(/\s/g, ''))
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < LENGTH - 1) refs.current[index + 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (!pasted) return
    e.preventDefault()
    update(pasted)
    refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus()
  }

  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-6 gap-1.5 sm:gap-3" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={LENGTH}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={`h-12 w-full min-w-0 rounded-xl border-2 bg-white text-center text-xl font-semibold outline-none transition sm:h-14
            ${error ? 'border-red-400 text-red-600' : d ? 'border-brand-500 text-brand-700' : 'border-brand-100'}
            focus:border-brand-700 focus:ring-4 focus:ring-brand-100 disabled:opacity-60`}
        />
      ))}
    </div>
  )
}

export default OtpInput
