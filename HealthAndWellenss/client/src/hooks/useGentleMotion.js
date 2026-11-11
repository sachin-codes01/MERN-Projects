import { useEffect, useRef } from 'react'

// Reveal once on arrival. Content stays visible if observers are unavailable.
export function useScrollReveal() {
  const root = useRef(null)
  useEffect(() => {
    const element = root.current
    if (!element || !('IntersectionObserver' in window)) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let observer
    const setup = () => {
      observer?.disconnect()
      if (preference.matches) return
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('motion-arrived')
          observer.unobserve(entry.target)
        })
      }, { threshold: 0.12 })
      element.querySelectorAll('.decorated-heading, .studio-section .botanical-scene, .studio-journey-steps article, .studio-loyalty-details article').forEach(target => {
        if (!target.classList.contains('motion-arrived')) observer.observe(target)
      })
    }
    setup()
    preference.addEventListener('change', setup)
    return () => {
      observer?.disconnect()
      preference.removeEventListener('change', setup)
    }
  }, [])
  return root
}

// Run ambient decoration only while its scene and the browser tab are visible.
export function useAmbientMotion() {
  const root = useRef(null)
  useEffect(() => {
    const element = root.current
    if (!element) return
    let visible = !('IntersectionObserver' in window)
    const update = () => {
      element.dataset.motionPaused = String(!visible || document.hidden)
    }
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting
      update()
    }) : null
    observer?.observe(element)
    document.addEventListener('visibilitychange', update)
    update()
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return root
}
