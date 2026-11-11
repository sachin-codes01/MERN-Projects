import { createContext, useContext, useEffect, useState } from 'react'
import { publicApi } from '../api/index.js'
import { FALLBACK_SETTINGS } from '../config.js'

const SettingsContext = createContext({ settings: FALLBACK_SETTINGS, reloadSettings: () => {} })

// Centre ka naam, phone, address, slots — admin panel se badalte hain, poori site yahin se padhti hai
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    publicApi
      .settings()
      .then((res) => setSettings({ ...FALLBACK_SETTINGS, ...res.data }))
      .catch(() => {})
  }, [version])

  const reloadSettings = () => setVersion((v) => v + 1)

  return <SettingsContext.Provider value={{ settings, reloadSettings }}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
