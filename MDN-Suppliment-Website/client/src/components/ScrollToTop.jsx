import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
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
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      };
      if (!scrollToHash()) {
        const timeout = setTimeout(scrollToHash, 150);
        return () => clearTimeout(timeout);
      }
      return;
    }

    if (pathname === "/") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}