const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

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
    lastUpdated: {
        type: Date,
        default: Date.now
    },
});

blogSchema.pre("save", function(next) {
    this.id = uuidv4();
    this.lastUpdated = new Date();
    next(); 
});


module.exports = mongoose.model("Blog", blogSchema);