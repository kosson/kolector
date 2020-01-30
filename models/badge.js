const mongoose = require('mongoose');
// const User     = require('./user');
const mexp     = require('mongoose-elasticsearch-xp');

let Badge = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    name: String,
    continut: {},
    resursa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'resursedu'
    }
});

Badge.plugin(mexp);

module.exports = new mongoose.model('badge', Badge);