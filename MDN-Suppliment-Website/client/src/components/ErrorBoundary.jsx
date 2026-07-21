import { Component } from "react";

/**
 * Generic error boundary. Used to wrap SplashCursor (a WebGL effect) so
 * that if it throws — e.g. `getContext('webgl')` returning null because
 * WebGL is unavailable, or a context that gets rejected on React
 * StrictMode's intentional double-mount in development — it silently
 * disables just that visual effect instead of crashing the entire
 * Navbar/Footer around it (which is exactly what was happening: React's
 * own error message even suggests this — "Consider adding an error
 * boundary to your tree").
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env?.DEV) {
      // Still visible in the console for debugging, but no longer crashes
      // the component tree or shows React's red error overlay.
      console.warn("[ErrorBoundary] Suppressed a render-time error:", error, info?.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
