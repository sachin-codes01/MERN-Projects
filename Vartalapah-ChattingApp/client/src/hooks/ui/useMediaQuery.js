import { useEffect, useState } from 'react'

// Tailwind ka `md` breakpoint (768px). Ek hi jagah likha hai taaki
// CSS aur JS kabhi alag alag na sochne lagein
const MOBILE_QUERY = '(max-width: 767px)'

// Ungli wala device hai ya mouse wala. Chhoti window par khula desktop
// browser bhi "mobile" layout dikhata hai (wo theek hai), lekin uspar
// bottom sheet ki jagah normal menu behtar lagta hai
const COARSE_QUERY = '(pointer: coarse)'

// SSR nahi hai (Vite SPA) lekin phir bhi guard rakha hai - test/build
// environment me window nahi hota
const matches = (query) =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(query).matches
    : false

// ==========================================================
// useMediaQuery - ek chhota sa wrapper
//
// window.resize sunne ki zarurat nahi: matchMedia khud batata hai
// ki result badla hai ya nahi. Isse har pixel par re-render nahi hota,
// sirf breakpoint cross karne par ek baar hota hai
// ==========================================================
const useMediaQuery = (query) => {
  const [value, setValue] = useState(() => matches(query))

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (e) => setValue(e.matches)

    // Query badalne par turant sahi value
    setValue(list.matches)
    list.addEventListener('change', onChange)

    return () => list.removeEventListener('change', onChange)
  }, [query])

  return value
}

// Chhoti screen - layout ka faisla isse hota hai
export const useIsMobile = () => useMediaQuery(MOBILE_QUERY)

// Touch device - bottom sheet vs menu ka faisla isse hota hai
export const useIsTouch = () => useMediaQuery(COARSE_QUERY)
