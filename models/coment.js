const mongoose = require('mongoose');
// const User     = require('./user');
const mexp     = require('mongoose-elasticsearch-xp');

let Comment = new mongoose.Schema({
    continut: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
});

Comment.plugin(mexp);

module.exports = new mongoose.model('comment', Comment);