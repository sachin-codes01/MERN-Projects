import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getLenis } from "../lib/useSmoothScroll";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Lenis keeps its own internal scroll-position cache to drive its
    // easing — a raw window.scrollTo/scrollIntoView call moves the page
    // without updating that cache, so the very next wheel tick snaps
    // back toward wherever Lenis still thinks it is. Routing through the
    // shared instance (when there is one — reduced-motion visitors have
    // none) keeps the two in sync; `getLenis()` returning null just means
    // "fall back to the native call" below.
    const lenis = getLenis();

    // Links like Footer's "FAQs" (/#faq) or CustomerSupportPage's "Browse
    // FAQs" cards navigate here with a hash — scroll to that section
    // instead of the page top. The target may not be in the DOM on the
    // very first paint yet (route/section still mounting), so retry once
    // shortly after if the initial lookup comes up empty.
    if (hash) {
      const id = hash.slice(1);
      const scrollToHash = () => {
        const el = document.getElementById(id);
        if (!el) return false;
        if (lenis) lenis.scrollTo(el, { offset: -8 });
        else el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      };
      if (!scrollToHash()) {
        const timeout = setTimeout(scrollToHash, 150);
        return () => clearTimeout(timeout);
      }
      return;
    }

    if (pathname === "/") return;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}