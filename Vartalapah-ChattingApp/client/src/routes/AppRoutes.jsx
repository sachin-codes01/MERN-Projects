import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext.jsx'
import Home from '@/pages/Home.jsx'
import Login from '@/pages/Login.jsx'
import Signup from '@/pages/Signup.jsx'
import ForgotPassword from '@/pages/ForgotPassword.jsx'
import CreatePassword from '@/pages/CreatePassword.jsx'
import Chat from '@/pages/Chat.jsx'

// Poori screen par loader - jab tak pata na chale ki user logged in hai ya nahi.
// Plain spinner ki jagah app ka naam khud "saans" leta hua (halka bada-chhota +
// fade) dikhta hai, niche teen dot ek-ek karke uchalte hain - dekho index.css
// ki .brand-breathe / .loader-dot
const FullPageLoader = () => (
  <div
    className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-app-bg"
    role="status"
    aria-live="polite"
    aria-label="Loading"
  >
    <h1 className="brand-font brand-gradient-text text-4xl sm:text-5xl brand-breathe">
      Vārtālāpaḥ
    </h1>

    <div className="flex items-center gap-1.5" aria-hidden="true">
      <span className="loader-dot w-2 h-2 rounded-full bg-brand" style={{ animationDelay: '0s' }} />
      <span className="loader-dot w-2 h-2 rounded-full bg-brand" style={{ animationDelay: '0.15s' }} />
      <span className="loader-dot w-2 h-2 rounded-full bg-brand" style={{ animationDelay: '0.3s' }} />
    </div>
  </div>
)

// ==========================================================
// PROTECTED ROUTE
// Ye chat page ko bina login ke khulne se rokta hai
// ==========================================================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  // Pehle /auth/me ka jawab aane do, warna login user ko galti se bahar phenk denge
  if (loading) return <FullPageLoader />

  // Logged in nahi hai to login page par bhej do
  if (!user) return <Navigate to="/login" replace />

  // Google se pehli baar aaya hai aur abhi tak application password nahi
  // banaya - chat kholne se pehle wahi banwa lete hain
  if (user.needsPassword) return <Navigate to="/create-password" replace />

  return children
}

// ==========================================================
// PUBLIC ROUTE
// Already logged-in user ko dobara login page dikhane ka koi matlab nahi
// ==========================================================
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (user) return <Navigate to={user.needsPassword ? '/create-password' : '/chat'} replace />

  return children
}

// ==========================================================
// PASSWORD SETUP ROUTE
// /create-password sirf un logged-in users ke liye hai jinhone abhi
// tak password nahi banaya. Login hi nahi hai to login par bhej do.
// Password pehle se ban chuka hai to yahan dobara aane ka koi kaam
// nahi - seedha chat par
// ==========================================================
const PasswordSetupRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!user.needsPassword) return <Navigate to="/chat" replace />

  return children
}

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing page - sirf logged-out logon ke liye
          Logged-in user ko seedha chat par bhej dete hain */}
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <Home />
          </PublicOnlyRoute>
        }
      />

      {/* Login page - logged-in user ko yahan se chat par bhej dete hain */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      {/* Signup page - naya account, Google ke bina bhi */}
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />

      {/* Forgot Password - Google se pehchaan karke naya password banate hain */}
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPassword />
          </PublicOnlyRoute>
        }
      />

      {/* Create Password - sirf Google se aaye aur abhi tak password na
          banaye users ke liye */}
      <Route
        path="/create-password"
        element={
          <PasswordSetupRoute>
            <CreatePassword />
          </PasswordSetupRoute>
        }
      />

      {/* Chat page - sirf logged-in user ke liye */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />

      {/* Galat URL par user ko home par bhej do */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
