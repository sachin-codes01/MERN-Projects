const mongoose = require("mongoose")
const mongoURL = "mongodb://localhost:27017/TodoMaster"

mongoose.connect(process.env.MONGO_URL).catch((error) => {
    console.log("Server give Error: ", error)
})
const db = mongoose.connection;

db.on("connected", () => {
    console.log("Database Connected")
})

db.on("disconnected", () => {
    console.log("Database Disconnected")
})

db.on("error", () => {
    console.log("Database Show Error")
})

module.exports = db;