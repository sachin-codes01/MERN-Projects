import { useEffect, useRef } from 'react'

// ==========================================================
// useReveal - element screen me aate hi neeche se upar fade hota hai
//
// SABSE ZAROORI BAAT: content ko chhupane wali class (.reveal-armed)
// JS lagata hai, JSX nahi. Matlab JS ya observer kisi bhi wajah se
// na chale to content jaisa hai waisa dikhta rehta hai
//
// Pehle chhupana seedha CSS me tha. Tab agar observer na chala to
// poora section opacity:0 par atak jata aur bilkul khali dikhta -
// exactly wahi hua tha "Who it's for" section ke saath
//
// IntersectionObserver browser ka apna API hai jo batata hai ki koi
// element screen me dikh raha hai ya nahi. Scroll event par khud
// calculate karne se sasta hai - browser ise main thread ke bahar
// handle karta hai
//
// Istemaal:
//   const ref = useReveal()
//   <section ref={ref} className="reveal">...</section>
//   ...andar ke cards par className="reveal-child"
// ==========================================================
const useReveal = () => {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Observer hi nahi hai (bahut purana browser) to kuch mat karo -
    // content bina animation ke dikhta rahega, jo chhupe rehne se behtar hai
    if (typeof IntersectionObserver === 'undefined') return

    // Ab chhupao - yahan se aage animation ka zimma hamara hai
    el.classList.add('reveal-armed')

    // Observer observe() karte hi ek baar callback zaroor deta hai,
    // chahe element dikh raha ho ya nahi. Isse pata chal jata hai ki
    // observer sach me chal raha hai
    let gotCallback = false

    const show = () => {
      el.classList.add('is-visible')
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        gotCallback = true
        if (!entry.isIntersecting) return

        show()
        // Ek baar dikh gaya to bas - warna har scroll par animation
        // dobara chalti rehti
        observer.disconnect()
      },
      // threshold 0 = thoda sa bhi dikha to chala do. Pehle 0.15 tha,
      // ab jaan-boojh kar simple rakha hai - kam shart, kam gadbad
      { threshold: 0, rootMargin: '0px 0px -60px 0px' },
    )

    observer.observe(el)

    // Safety net: agar 1.5s me observer ne ek baar bhi kuch nahi bola
    // to wo kaam nahi kar raha (jaise background tab me hota hai).
    // Aisi soorat me content bina animation ke dikha do
    const failsafe = setTimeout(() => {
      if (gotCallback) return
      show()
      observer.disconnect()
    }, 1500)

    return () => {
      clearTimeout(failsafe)
      observer.disconnect()
    }
  }, [])

  return ref
}

export default useReveal
