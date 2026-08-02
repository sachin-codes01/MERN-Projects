import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ==========================================================
// SOCKET CONTEXT
// Poori app me EK hi socket connection rakhna hai
// Agar har component apna socket banayega to 10 connections khul jayenge
// Isliye connection yahan ek baar banate hain aur Context se sabko de dete hain
// ==========================================================
const SocketContext = createContext(null)

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()

  // socket ko state me rakha hai taki banne ke baad components ko turant mil jaye
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  // Kaun kaun online hai - Set isliye ki lookup fast hota hai
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    // Logged in nahi hai to socket banane ka koi matlab nahi
    if (!user) return

    // Server se connection banate hain
    // withCredentials: true -> cookie bhi jayegi, tabhi server pehchan payega ki kaun hai
    const newSocket = io(API_URL, { withCredentials: true })
    setSocket(newSocket)

    // ---- Connection events ----
    newSocket.on('connect', () => setConnected(true))
    newSocket.on('disconnect', () => setConnected(false))

    newSocket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message)
      setConnected(false)
    })

    // Connect hote hi server batata hai ki abhi kaun online hai
    newSocket.on('online-users', (ids) => setOnlineUsers(new Set(ids)))

    // Koi online/offline hua to list update karo
    newSocket.on('user-status', ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        if (isOnline) next.add(userId)
        else next.delete(userId)
        return next
      })
    })

    // Cleanup: logout ya page band hone par connection band kar do
    // Ye zaroori hai warna purane connections khule reh jate hain (memory leak)
    return () => {
      newSocket.disconnect()
      setSocket(null)
      setConnected(false)
      setOnlineUsers(new Set())
    }
  }, [user]) // user badla (login/logout) to socket dobara banega

  const value = { socket, connected, onlineUsers }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
