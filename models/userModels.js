const mongoose = require("mongoose");

const roles = ["user", "admin", "superadmin", "banned"];

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        default: roles[0],
        enum: roles
    },
    id: {
        type: String,
        unique: true
    },
});


module.exports = mongoose.model("User", userSchema);