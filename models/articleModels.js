const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
    id: {
        type: String,
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