const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const Profile = require("./profileModels");

const roles = ["user", "admin", "superadmin", "banned"];

const personSchema = new mongoose.Schema({
    username: {
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
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: roles[0],
        enum: roles
    },
});

// module.exports = Company = Profile.discriminator("Company", personSchema);
module.exports = Person = Profile.discriminator("Person", personSchema);