import React, { useState } from 'react'
import axios from "axios"

const Login = ({ setPage, prefill }) => {
    const [login, setLogin] = useState({
        email: prefill?.email || "",
        password: prefill?.password || "",
    })

    const userLogin = async () => {

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (login.email.trim() === "") {
            return alert("Email is required");
        }

        if (!emailRegex.test(login.email)) {
            return alert("Please enter a valid email address");
        }

        if (login.password === "") {
            return alert("Password is required");
        }

        if (login.password.length < 6) {
            return alert("Password must be at least 6 characters");
        }

        try {
            if (!login.email || !login.password) return alert("Fill all fields")
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, login)
            alert(response.data.message)

            const userInfo = { userId: response.data.userId, username: response.data.username }
            const token = response.data.token
            if (token) {
                localStorage.setItem("token", token)
                localStorage.setItem("user", JSON.stringify(userInfo))
                setPage("todo")
            }
            setLogin({
                email: "",
                password: "",
            })
        } catch (error) {
            alert(error.response?.data?.message)
        }
    }

    return (
        <div className='container'>
            <div className="logo-auth" onClick={() => setPage("home")}>
                <span>✓</span> TodoMaster
            </div>
            <h3 className='heading'>Login</h3>
            <div className='input-box'>
                <input className='input-username' type="email" placeholder='Enter Email...' value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
                <input className='input-password' type="password" placeholder='Enter Password...' minLength={6} maxLength={20} value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
                <button type='button' onClick={userLogin}>Login</button>
                <p>No account? <span onClick={() => setPage("register")}>Register</span></p>
            </div>
        </div>
    )
}

export default Login