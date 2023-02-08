const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const commentSchema = new mongoose.Schema({
    article: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    authorName: {
        type: String,
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    date : {
        type: Date,
        default: Date.now
    },
    id: {
        type: String,
        unique: true
    },
});

commentSchema.pre("save", function(next) {
    this.id = uuidv4();
    next();
});

module.exports = mongoose.model("Comment", commentSchema);