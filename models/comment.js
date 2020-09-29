const mongoose = require('mongoose');

let Comment = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    resourceId: {
        type: String,
        required: true,
        trim: true
    },
    user: String,
    title: String,
    content: {},
    value: Number
});

module.exports = new mongoose.model('comment', Comment);