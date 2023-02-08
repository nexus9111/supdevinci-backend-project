const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const Profile = require("./profileModels");

const roles = ["user", "admin", "superadmin", "banned"];

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
});

module.exports = Company = Profile.discriminator("Company", companySchema);