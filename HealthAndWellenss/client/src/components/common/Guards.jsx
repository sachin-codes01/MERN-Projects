import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { Loader } from './Feedback.jsx'

// Customer login zaroori — nahi hai to /login pe bhejo, aur login ke baad wapas yahin
export const RequireCustomer = () => {
  const { customer, ready } = useAuth()
  const location = useLocation()
  if (!ready.customer) return <Loader full />
  if (!customer) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

// Staff login zaroori (admin panel)
export const RequireStaff = () => {
  const { staff, ready } = useAuth()
  const location = useLocation()
  if (!ready.staff) return <Loader full />
  if (!staff) return <Navigate to="/admin/login" replace state={{ from: location }} />
  return <Outlet />
}

// Naya page khulte hi upar scroll
export const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}
