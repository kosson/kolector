const mongoose = require('mongoose');
// const User     = require('./user');

let Coment = new mongoose.Schema({
    continut: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
});

module.exports = new mongoose.model('coment', Coment);