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
        trim: true,
        lowercase: true,
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

userSchema.pre("save", function(next) {
    this.id = uuidv4();
    next();
});

module.exports = mongoose.model("User", userSchema);