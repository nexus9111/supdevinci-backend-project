const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const accountSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
    },
    id: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
});

accountSchema.pre("save", function(next) {
    this.id = uuidv4();
    next();
});

// un account peut contenir N profiles (person, company)
// chaque profile a un owner (account)
// un article est publié par un profile (person, company)

module.exports = mongoose.model("Account", accountSchema);