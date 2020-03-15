const mongoose = require('mongoose');
const mexp     = require('mongoose-elasticsearch-xp');

let Comment = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    titlu: String,
    contributor: String,
    continut: {},
    value: Number,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
});

Comment.plugin(mexp);

module.exports = new mongoose.model('comment', Comment);