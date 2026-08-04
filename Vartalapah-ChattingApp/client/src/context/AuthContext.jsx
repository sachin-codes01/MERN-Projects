import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '@/api/authApi.js'
import { clearCsrfToken } from '@/api/httpClient.js'

// ==========================================================
// CONTEXT
// Context isliye use kiya kyunki logged-in user ki information
// app ke har component ko chahiye (sidebar, chat header, messages).
// Bina Context ke ye data har component me props se pass karna padta - "prop drilling"
// ==========================================================
const AuthContext = createContext(null)

// Chhota custom hook - har component me useContext(AuthContext) likhne ki zarurat nahi
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)      // logged-in user, null matlab logged out
  const [loading, setLoading] = useState(true) // pehli baar check ho raha hai

  // App khulte hi ek baar check karte hain ki cookie me valid session hai ya nahi
  // Isse page refresh karne par user logged in hi rehta hai
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const data = await authApi.getCurrentUser()
        setUser(data.user)
      } catch {
        // 401 aaya matlab logged in nahi hai - ye normal hai, error nahi
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkLogin()
  }, []) // khali array matlab sirf ek baar chalega

  // Google se mila token backend ko bhejte hain, backend verify karke user wapas deta hai
  const loginWithGoogle = async (credential) => {
    const data = await authApi.loginWithGoogle(credential)
    setUser(data.user)
    return data.user
  }

  // Email + password se login - koi bhi device ho, wahi purana account khul jata hai
  const loginWithPassword = async (email, password, rememberMe) => {
    const data = await authApi.loginWithPassword(email, password, rememberMe)
    setUser(data.user)
    return data.user
  }

  // Naya account - username + email + password. verificationToken =
  // email par aaya 6-digit code verify karne se mila token (dekho
  // EmailOtpStep.jsx). Success hote hi turant login bhi ho jata hai
  // (backend cookie bhej deta hai)
  const register = async (username, email, password, confirmPassword, verificationToken) => {
    const data = await authApi.register(username, email, password, confirmPassword, verificationToken)
    setUser(data.user)
    return data.user
  }

  // Google se pehli baar aaya user apna application password banata hai
  const setPassword = async (password, confirmPassword) => {
    const data = await authApi.setPassword(password, confirmPassword)
    setUser(data.user)
    return data.user
  }

  // "Forgot password" Step 1 - email se account check karna
  const checkEmail = (email) => authApi.checkEmail(email)

  // ---- EMAIL VERIFICATION (OTP) ----
  // Signup aur "forgot password" dono me EmailOtpStep.jsx yahi do
  // bulata hai. verifyEmailOtp ka jawab { verificationToken } hota hai -
  // wahi aage register / resetPassword ko jata hai
  const sendEmailOtp = (email, purpose) => authApi.sendOtp(email, purpose)

  const verifyEmailOtp = (email, code, purpose) => authApi.verifyOtp(email, code, purpose)

  // "Forgot password" - email verify karke naya password set karte hain.
  // Jaan-boojhkar setUser NAHI karte - backend yahan login nahi karata
  // (koi cookie nahi bhejta), user ko wapas login page par bhejkar apne
  // naye password se khud login karwate hain
  const resetPassword = (verificationToken, password, confirmPassword) =>
    authApi.resetPassword(verificationToken, password, confirmPassword)

  // Logout - backend cookie hata dega aur user ko offline mark karega
  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      // Backend fail bhi ho jaye to frontend par to logout kar hi dena chahiye
      setUser(null)

      // Purana CSRF token bhool jao - agle login par nayi cookie milegi
      clearCsrfToken()
    }
  }

  // Naam / profile photo update karna
  const updateProfile = async (updates) => {
    const data = await authApi.updateProfile(updates)
    setUser(data.user)
    return data.user
  }

  // Account delete karna
  // Backend "soft delete" karta hai - document mitata nahi, sirf chhupa deta hai
  // Isse saamne wale ki purani chat toot ti nahi
  // Delete karne se pehle email par code jata hai - ye do step hain:
  // pehle code mangao, phir wahi code bhej kar delete karo
  const sendDeleteOtp = () => authApi.sendDeleteOtp()

  const deleteAccount = async (code) => {
    await authApi.deleteAccount(code)
    setUser(null)
    clearCsrfToken()
  }

  // Jo bhi is value me hai, wo poori app me kahin bhi useAuth() se mil jayega
  const value = {
    user, loading,
    loginWithGoogle, loginWithPassword, register, setPassword,
    checkEmail, sendEmailOtp, verifyEmailOtp, resetPassword,
    logout, updateProfile, sendDeleteOtp, deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
