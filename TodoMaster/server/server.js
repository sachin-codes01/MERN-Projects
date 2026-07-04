const express = require("express")
const app = express()
app.use(express.json())

require("dotenv").config()

const cors = require("cors")
app.use(cors())

const db = require("./database")

const TodoRouter = require("./routes/TodoRoutes")
app.use("/todomaster", TodoRouter)

const AuthRouter = require("./routes/AuthRoutes")
app.use("/auth", AuthRouter)

app.listen(process.env.PORT || 4000, () => {
    console.log(`Port ${process.env.PORT} is Running`)
})