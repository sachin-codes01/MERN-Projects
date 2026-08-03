import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '@/api/authApi.js'

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

  // Logout - backend cookie hata dega aur user ko offline mark karega
  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      // Backend fail bhi ho jaye to frontend par to logout kar hi dena chahiye
      setUser(null)
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
  const deleteAccount = async () => {
    await authApi.deleteAccount()
    setUser(null)
  }

  // Jo bhi is value me hai, wo poori app me kahin bhi useAuth() se mil jayega
  const value = { user, loading, loginWithGoogle, logout, updateProfile, deleteAccount }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
