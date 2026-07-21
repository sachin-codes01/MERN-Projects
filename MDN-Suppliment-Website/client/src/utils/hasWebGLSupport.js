/**
 * Checks WebGL support once, using a disposable canvas — completely
 * separate from SplashCursor's own canvas/context. Lets callers avoid
 * ever mounting a WebGL-dependent component on a browser that can't
 * support it, instead of finding out only after it throws.
 *
 * Note: this catches the "WebGL genuinely isn't available" case. It
 * can't catch a same-canvas context failure caused by React StrictMode
 * double-invoking effects in development (a timing issue, not a support
 * issue) — that's what the ErrorBoundary around SplashCursor is for.
 * StrictMode's double-invoke only happens in dev, so that particular
 * scenario shouldn't occur in a production build at all.
 */
export function hasWebGLSupport() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      (window.WebGL2RenderingContext && canvas.getContext("webgl2")) ||
      (window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")))
    );
  } catch {
    return false;
  }
}
