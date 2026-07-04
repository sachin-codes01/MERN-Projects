const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
           return res.status(401).json({ message: "Token nahi mila" })
        }
        const Token = authHeader.split(" ")[1]

        const decoded = await jwt.verify(Token, JWT_SECRET)
        req.userId = decoded.userId
        next()
    } catch (error) {
        res.status(401).json({ message: "Token is Invalid" })
    }
}

module.exports = authMiddleware;