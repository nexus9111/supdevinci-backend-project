const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const commentSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true
    },
    author: {
        type: String,
        required: true,
    },
    authorName: {
        type: String,
        required: true,
    },
    date : {
        type: Date,
        default: Date.now
    },
    article: {
        type: String,
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
});

commentSchema.pre("save", function(next) {
    this.id = uuidv4();
    next();
});

module.exports = mongoose.model("Comment", commentSchema);