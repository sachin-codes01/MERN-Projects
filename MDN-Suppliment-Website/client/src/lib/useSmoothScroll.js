import { useEffect } from "react";
import Lenis from "lenis";

// This module owns the single Lenis instance for the whole app — nothing
// outside `useSmoothScroll`, `onPageScroll`, `setScrollLocked` and
// `getLenis` should touch `lenis` directly.
let lenis = null;

// Callbacks can subscribe before the instance exists (a child's effect
// runs before its parent's, and `useSmoothScroll` is called from the
// root), so this is module-level rather than living on the instance.
const scrollCallbacks = new Set();

function notify(e) {
  scrollCallbacks.forEach((cb) => cb(e));
}

/**
 * Subscribe to page scroll position changes. Fires for both Lenis-driven
 * scroll (desktop/trackpad, wheel, drag) and native `window` scroll —
 * Lenis-driven scrolling emits no native `scroll` event, so relying on
 * `window.addEventListener('scroll', …)` alone would never fire; the
 * native half is also what keeps this working for reduced-motion
 * visitors, who get no Lenis instance at all (see `useSmoothScroll`).
 */
export function onPageScroll(callback) {
  scrollCallbacks.add(callback);
  return () => {
    scrollCallbacks.delete(callback);
  };
}

/**
 * Lock or unlock Lenis's own scroll handling. Lenis ignores `overflow:
 * hidden` on the body, so a full-screen overlay needs BOTH a body lock
 * and this — otherwise the page keeps scrolling underneath it. No-op
 * when there's no instance (not yet mounted, or reduced-motion visitor).
 */
export function setScrollLocked(locked) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}

/** Read access to the live instance, e.g. for one-off `scrollTo` calls
 * (see ScrollToTop) that need to stay in sync with Lenis's internal
 * scroll state instead of fighting it with a raw `window.scrollTo`. */
export function getLenis() {
  return lenis;
}

/**
 * Call once, from the root component. Sets up inertial scrolling for the
 * whole page and tears it down on unmount.
 */
export function useSmoothScroll() {
  useEffect(() => {
    // The native listener is registered unconditionally — it's the path
    // that keeps onPageScroll subscribers alive for reduced-motion
    // visitors, who get everything below this check skipped entirely.
    const onWindowScroll = (e) => notify(e);
    window.addEventListener("scroll", onWindowScroll, { passive: true });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => window.removeEventListener("scroll", onWindowScroll);
    }

    const instance = new Lenis({ duration: 1.05, wheelMultiplier: 0.9 });
    lenis = instance;

    const onLenisScroll = (e) => notify(e);
    instance.on("scroll", onLenisScroll);

    let rafId;
    function raf(time) {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Native anchor jumps fight Lenis's animation and land in the wrong
    // place, so in-page `#hash` links are routed through lenis.scrollTo.
    const onClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href").slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      instance.scrollTo(target, { offset: -8 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onWindowScroll);
      cancelAnimationFrame(rafId);
      instance.off("scroll", onLenisScroll);
      instance.destroy();
      lenis = null;
    };
  }, []);
}
