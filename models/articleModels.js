const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const blogSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        unique: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        required: true,
    },
});

blogSchema.pre("save", function(next) {
    this.id = uuidv4();
    this.lastUpdated = new Date();
    next(); 
});


module.exports = mongoose.model("Blog", blogSchema);