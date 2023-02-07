const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

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
        default: uuidv4(),
        unique: true
    },
});


module.exports = mongoose.model("User", userSchema);