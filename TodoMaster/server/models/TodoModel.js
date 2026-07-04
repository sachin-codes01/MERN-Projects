const mongoose = require("mongoose")

const TodoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["Pending", "In Pending", "Completed"],
        default: "Pending",
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AuthDocument",
        require: true,
    }
}
)

const Todo = mongoose.model("TodoDocument", TodoSchema)
module.exports = Todo;