const express = require("express")
const router = express.Router()
const Auth = require("../models/AuthModel")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userExist = await Auth.findOne({ email })
        if (userExist) {
           return res.status(400).json({ message: "Email Alerady Register" })
        }

        const hashPassword = await bcrypt.hash(password, 10)
        const newUser = new Auth({ username, email, password: hashPassword })
        const response = await newUser.save()
        res.status(200).json({ message: "Register Successfully", response })

    } catch (error) {
        res.status(500).json({ message: "Register show Error", error })
    }
})

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userExist = await Auth.findOne({ email })
        if (!userExist) {
           return res.status(400).json({ message: "Email Not Register" })
        }

        const PasswordCompare = await bcrypt.compare(password, userExist.password)
        if (!PasswordCompare) {
            return res.status(400).json({ message: "Invalid Password" })
        }

        const token = jwt.sign({ userId: userExist._id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })

        res.status(200).json({ message: "Successfully Login", token, userId: userExist._id, username: userExist.username })

    } catch (error) {
        res.status(500).json({ message: "Login show Error", error })
    }
})

module.exports = router;