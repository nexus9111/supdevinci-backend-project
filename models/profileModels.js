const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const roles = ["user", "admin", "superadmin", "banned"];

const profileSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    id: {
        type: String,
        unique: true
    },
    owner: {
        type: String,
        required: true,
    },
}, {
    discriminatorKey: "kind"
});

profileSchema.pre("save", function(next) {
    this.id = uuidv4();
    next();
});

module.exports = mongoose.model("Profile", profileSchema);