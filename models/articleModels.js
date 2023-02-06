const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const blogSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4(),
        unique: true
    },
    author: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
});


module.exports = mongoose.model("Blog", blogSchema);