const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const REGULAR_ACCOUNT = "regular";
const type = [REGULAR_ACCOUNT, "google"];

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
    },
    type: {
        type: String,
        enum: type,
        default: REGULAR_ACCOUNT,
        required: true,
    },
});

accountSchema.pre("save", function (next) {
    this.id = uuidv4();
    if (this.type === REGULAR_ACCOUNT && !this.password) {
        next(new Error("missing password"));
    }
    next();
});

// un account peut contenir N profiles (person, company)
// chaque profile a un owner (account)
// un article est publié par un profile (person, company)

module.exports = mongoose.model("Account", accountSchema);