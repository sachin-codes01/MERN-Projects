import { lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import { Route, Routes, useLocation } from 'react-router-dom'
import { RequireCustomer, RequireStaff, ScrollToTop } from './components/common/Guards.jsx'
import { Loader } from './components/common/Feedback.jsx'
import CustomerLayout from './components/layout/CustomerLayout.jsx'
import Welcome from './pages/Welcome.jsx'
import CheckIn from './pages/CheckIn.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/register/Register.jsx'
import RegisterSuccess from './pages/register/RegisterSuccess.jsx'
import Scan from './pages/Scan.jsx'
import NotFound from './pages/NotFound.jsx'
import Dashboard from './pages/customer/Dashboard.jsx'
import Therapies from './pages/customer/Therapies.jsx'
import TherapyDetail from './pages/customer/TherapyDetail.jsx'
import BookAppointment from './pages/customer/BookAppointment.jsx'
import AppointmentConfirmed from './pages/customer/AppointmentConfirmed.jsx'
import Appointments from './pages/customer/Appointments.jsx'
import VisitHistory from './pages/customer/VisitHistory.jsx'
import Reminders from './pages/customer/Reminders.jsx'
import RateVisit from './pages/customer/RateVisit.jsx'
import Loyalty from './pages/customer/Loyalty.jsx'
import Profile from './pages/customer/Profile.jsx'
import More from './pages/customer/More.jsx'

const GoldenButterfly = lazy(() => import('./components/GoldenButterfly.jsx'))
const SiteButterfly = () => {
  const { pathname } = useLocation()
  const { customer, staff, ready } = useAuth()
  if (!ready.customer || !ready.staff || customer || staff || pathname.startsWith('/admin')) return null
  return <Suspense fallback={null}><GoldenButterfly size={145} speed={.9} /></Suspense>
}

// Admin panel alag chunk me load hota hai (charts bhaari hain) — customer ki site fast rehti hai
const AdminLayout = lazy(() => import('./components/layout/AdminLayout.jsx'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'))
const Customers = lazy(() => import('./pages/admin/Customers.jsx'))
const CustomerDetail = lazy(() => import('./pages/admin/CustomerDetail.jsx'))
const AppointmentCalendar = lazy(() => import('./pages/admin/AppointmentCalendar.jsx'))
const TherapyManager = lazy(() => import('./pages/admin/TherapyManager.jsx'))
const FollowUps = lazy(() => import('./pages/admin/FollowUps.jsx'))
const FeedbackList = lazy(() => import('./pages/admin/FeedbackList.jsx'))
const OfferManager = lazy(() => import('./pages/admin/OfferManager.jsx'))
const Reports = lazy(() => import('./pages/admin/Reports.jsx'))
const Settings = lazy(() => import('./pages/admin/Settings.jsx'))

// Saare routes yahan — naya page banao to pages/ me file aur yahan ek <Route>
const App = () => (
  <>
    <ScrollToTop />
    <SiteButterfly />
    <Suspense fallback={<Loader full />}>
      <Routes>
        {/* Onboarding (bina navbar) */}
        <Route path="/" element={<Welcome />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/scan/:customerId" element={<Scan />} />
        <Route element={<RequireCustomer />}>
          <Route path="/register/success" element={<RegisterSuccess />} />
        </Route>

        {/* Customer site (navbar + bottom tabs) */}
        <Route element={<CustomerLayout />}>
          <Route path="/therapies" element={<Therapies />} />
          <Route path="/therapies/:slug" element={<TherapyDetail />} />
          <Route element={<RequireCustomer />}>
            <Route path="/home" element={<Dashboard />} />
            <Route path="/book" element={<BookAppointment />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/:id/confirmed" element={<AppointmentConfirmed />} />
            <Route path="/history" element={<VisitHistory />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/rate/:id" element={<RateVisit />} />
            <Route path="/loyalty" element={<Loyalty />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/more" element={<More />} />
          </Route>
        </Route>

        {/* Staff & Admin panel */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<RequireStaff />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/customers/:id" element={<CustomerDetail />} />
            <Route path="/admin/appointments" element={<AppointmentCalendar />} />
            <Route path="/admin/therapies" element={<TherapyManager />} />
            <Route path="/admin/follow-ups" element={<FollowUps />} />
            <Route path="/admin/feedback" element={<FeedbackList />} />
            <Route path="/admin/offers" element={<OfferManager />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </>
)

export default App


