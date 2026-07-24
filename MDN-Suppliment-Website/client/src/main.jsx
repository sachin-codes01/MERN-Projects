import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartBadgeProvider } from "./context/CartBadgeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsProvider>
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
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>
);
