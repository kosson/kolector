const mongoose = require('mongoose');

let Coment = new mongoose.Schema({
    continut: String,
    user: {
        type: Schema.Types.ObjectID,
        ref: 'user'
    }
});

module.exports = new mongoose.model('coment', Coment);