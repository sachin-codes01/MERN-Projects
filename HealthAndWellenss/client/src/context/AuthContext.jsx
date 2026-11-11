import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getToken, setToken } from '../api/client.js'
import { customerApi, staffApi } from '../api/index.js'

const AuthContext = createContext(null)

// Customer aur staff dono ka login yahan — dono alag token, ek hi browser me dono login ho sakte hain
export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null)
  const [staff, setStaff] = useState(null)
  // ready = token check ho gaya ya nahi (tab tak protected page loader dikhata hai)
  const [ready, setReady] = useState(() => ({ customer: !getToken('customer'), staff: !getToken('staff') }))

  // Page refresh pe saved token se user wapas laao
  useEffect(() => {
    if (getToken('customer')) {
      customerApi
        .me()
        .then((res) => setCustomer(res.data))
        .catch(() => setToken('customer', null))
        .finally(() => setReady((r) => ({ ...r, customer: true })))
    }
    if (getToken('staff')) {
      staffApi
        .me()
        .then((res) => setStaff(res.data))
        .catch(() => setToken('staff', null))
        .finally(() => setReady((r) => ({ ...r, staff: true })))
    }
  }, [])

  // Kisi bhi API pe 401 aaye to us role ko logout
  useEffect(() => {
    const onExpired = (e) => (e.detail === 'customer' ? setCustomer(null) : setStaff(null))
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const loginCustomer = useCallback((token, data) => {
    setToken('customer', token)
    setCustomer(data)
  }, [])

  const logoutCustomer = useCallback(() => {
    setToken('customer', null)
    setCustomer(null)
  }, [])

  const refreshCustomer = useCallback(async () => {
    const res = await customerApi.me()
    setCustomer(res.data)
    return res.data
  }, [])

  const loginStaff = useCallback((token, data) => {
    setToken('staff', token)
    setStaff(data)
  }, [])

  const logoutStaff = useCallback(() => {
    setToken('staff', null)
    setStaff(null)
  }, [])

  const value = useMemo(
    () => ({ customer, setCustomer, staff, ready, loginCustomer, logoutCustomer, refreshCustomer, loginStaff, logoutStaff }),
    [customer, staff, ready, loginCustomer, logoutCustomer, refreshCustomer, loginStaff, logoutStaff],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
