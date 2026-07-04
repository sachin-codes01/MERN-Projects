const express = require("express")
const router = express.Router()
const Todo = require("../models/TodoModel")
const authMiddleware = require("../authMiddleware/AuthMiddleware")

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, description, status, priority } = req.body;
        const newData = new Todo({ title, description, status, priority, UserId: req.userId })
        const response = await newData.save()
        res.status(200).json({ message: "Data Send Successfully", response })
    } catch (error) {
        res.status(500).json({ message: "Data not Sended" })
    }
})

router.get("/", authMiddleware, async (req, res) => {
    try {
        const response = await Todo.find({ UserId: req.userId })
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json({ message: "Data not Rescieved" })
    }
})

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { title, description, status, priority } = req.body;
        const response = await Todo.findOneAndUpdate({ _id: req.params.id, UserId: req.userId }, { title, description, status, priority }, { new: true })
        res.status(200).json({ message: "Data Updated", response })
    } catch (error) {
        res.status(500).json({ message: "Data not Updated" })
    }
})

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const response = await Todo.findOneAndDelete({ _id: req.params.id, UserId: req.userId })
        res.status(200).json({ message: "Data Deleted", response })
    } catch (error) {
        res.status(500).json({ message: "Data not Deleted" })
    }
})

module.exports = router;