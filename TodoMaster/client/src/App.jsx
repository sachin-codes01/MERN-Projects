import React, { useState } from 'react'
import './App.css'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import Todo from './components/Todo/Todo'
import Home from './components/Home/Home'

const App = () => {
  let savedUser = null
  try {
    const raw = localStorage.getItem("user")
    savedUser = raw ? JSON.parse(raw) : null
  } catch (error) {
    savedUser = null
  }

  const savedToken = localStorage.getItem("token")
  const isValidSession = savedToken && savedUser?.username && savedUser?.userId

  const [page, setPage] = useState(isValidSession ? "todo" : "home")
  const [prefill, setPrefill] = useState({ email: "", password: "" })

  return (
    <div>
      {page === "home" && <Home setPage={setPage}/>}
      {page === "login" && <Login setPage={setPage} prefill={prefill} />}
      {page === "register" && <Register setPage={setPage} setPrefill={setPrefill} />}
      {page === "todo" && <Todo setPage={setPage} />}
    </div>
  )
}

export default App
