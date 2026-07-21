import { useEffect, useState } from "react";

// Reactive `window.matchMedia` check — re-renders on viewport/orientation
// changes (unlike a one-time `window.innerWidth` read), so components can
// mount/unmount viewport-gated features (e.g. WebGL effects) correctly.
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
