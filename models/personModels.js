const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const Profile = require("./profileModels");

const personSchema = new mongoose.Schema({
    avatar: {
        type: String,
        default: "https://imgur.com/uyUFvIp"
    },
    bio: {
        type: String,
        default: "This user has not written a bio yet."
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
});

// module.exports = Company = Profile.discriminator("Company", personSchema);
module.exports = Person = Profile.discriminator("Person", personSchema);