const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const commentSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4(),
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
    }
});


module.exports = mongoose.model("Comment", commentSchema);