import { Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import { useAuth } from '@/context/AuthContext.jsx'
import Home from '@/pages/Home.jsx'
import Login from '@/pages/Login.jsx'
import Chat from '@/pages/Chat.jsx'

// Poori screen par loader - jab tak pata na chale ki user logged in hai ya nahi
const FullPageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-app-bg">
    <CircularProgress />
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

  return children
}

// ==========================================================
// PUBLIC ROUTE
// Already logged-in user ko dobara login page dikhane ka koi matlab nahi
// ==========================================================
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (user) return <Navigate to="/chat" replace />

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
