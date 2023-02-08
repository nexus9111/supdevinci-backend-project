const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const roles = ["user", "admin", "superadmin", "banned"];

const profileSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true
    },
    avatar: {
        type: String,
        default: "https://imgur.com/uyUFvIp"
    },
    bio: {
        type: String,
        default: "This user has not written a bio yet."
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, {
    discriminatorKey: "kind"
});

profileSchema.pre("save", function(next) {
    this.id = uuidv4();
    next();
});

module.exports = mongoose.model("Profile", profileSchema);