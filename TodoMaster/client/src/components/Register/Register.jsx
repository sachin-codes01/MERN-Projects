import React, { useState } from 'react'
import "./Register.css"
import axios from "axios"

const Register = ({ setPage, setPrefill }) => {
    const [register, setRegister] = useState({
        username: "",
        email: "",
        password: "",
    })

    const userRegister = async () => {

        if (register.username.trim() === "") {
            return alert("Username is required");
        }

        if (register.username.length < 3) {
            return alert("Username must be at least 3 characters");
        }

        if (register.username.length > 20) {
            return alert("Username cannot exceed 20 characters");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (register.email.trim() === "") {
            return alert("Email is required");
        }

        if (!emailRegex.test(register.email)) {
            return alert("Please enter a valid email address");
        }

        if (register.password === "") {
            return alert("Password is required");
        }

        if (register.password.length < 6) {
            return alert("Password must be at least 6 characters");
        }

        if (register.password.length > 20) {
            return alert("Password cannot exceed 20 characters");
        }


        try {
            if (!register.username || !register.email || !register.password) return alert("Fill all fields")
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, register)
            alert(response.data.message)
            if (response.data.message) {
                setPrefill({ email: register.email, password: register.password })
                setPage("login")
            }
            setRegister({
                username: "",
                email: "",
                password: "",
            })
        } catch (error) {
            alert(error.response.data.message)
        }
    }

    return (
        <div className='container'>
            <div className="logo-auth" onClick={() => setPage("home")}>
                <span>✓</span> TodoMaster
            </div>
            <h3 className='heading'>Register</h3>
            <div className='input-box'>
                <input className='input-username' type="text" placeholder='Enter Username...' maxLength={20} value={register.username} onChange={(e) => setRegister({ ...register, username: e.target.value })} />
                <input className='input-email' type="email" placeholder='Enter Email...' value={register.email} onChange={(e) => setRegister({ ...register, email: e.target.value })} />
                <input className='input-password' type="password" placeholder='Enter Password...' minLength={6} maxLength={20} value={register.password} onChange={(e) => setRegister({ ...register, password: e.target.value })} />
                <button type='button' onClick={userRegister}>Register</button>
                <p>Have account? <span onClick={() => setPage("login")}>Login</span></p>
            </div>
        </div>
    )
}

export default Register
