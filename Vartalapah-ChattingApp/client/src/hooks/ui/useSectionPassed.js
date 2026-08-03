import { useEffect, useState } from 'react'

// ==========================================================
// useSectionPassed - batata hai ki diya hua section viewport se
// poori tarah bahar ja chuka hai ya nahi
//
// Navbar ke liye banaya hai: hero screen par hai to false,
// hero poora upar nikal gaya to true
//
// scrollY > 700 jaisa fixed number use nahi kiya kyunki hero ki
// height har screen par alag hai (desktop par h-screen, mobile par
// content jitni). IntersectionObserver ye khud handle kar leta hai
// aur scroll event ke muqable sasta bhi hai - browser ise main
// thread ke bahar chalata hai
//
// threshold 0 = jaise hi element ka aakhri pixel bahar jata hai
// isIntersecting false ho jata hai
//
// Istemaal:
//   const ref = useRef(null)
//   const passed = useSectionPassed(ref)
//   <div ref={ref}><HeroSection /></div>
// ==========================================================
const useSectionPassed = (ref) => {
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Purane browser me observer na mile to navbar hamesha dikha
    // dete hain - chhup kar reh jane se behtar hai
    if (typeof IntersectionObserver === 'undefined') {
      setPassed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Sirf "dikh raha hai ya nahi" kaafi nahi hai - page ke
        // bilkul neeche se wapas upar aate waqt bhi element bahar
        // hota hai. Isliye ye bhi check karte hain ki wo UPAR gaya
        // hai (bottom <= 0), neeche nahi
        setPassed(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0)
      },
      { threshold: 0 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return passed
}

export default useSectionPassed
