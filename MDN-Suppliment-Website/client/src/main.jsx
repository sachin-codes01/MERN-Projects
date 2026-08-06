import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MotionConfig } from "motion/react";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartBadgeProvider } from "./context/CartBadgeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* `reducedMotion="user"` is what lets prefers-reduced-motion reach
        Motion's inline transforms — a CSS @media block on its own only
        touches CSS transitions, never Motion's animated `transform`. */}
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <BrowserRouter>
              <AuthProvider>
                <ToastProvider>
                  <CartBadgeProvider>
                    <App />
                  </CartBadgeProvider>
                </ToastProvider>
              </AuthProvider>
            </BrowserRouter>
        </GoogleOAuthProvider>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>
);
