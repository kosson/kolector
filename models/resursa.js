const mongoose = require('mongoose');

let Resursa = new mongoose.Schema({
    _id:  mongoose.Types.ObjectId,
    name: String,
    email: String,
    link: String,
    descriere: {},
    etichete: [],
    coperta: String,
    value: Number,
    comments: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment'
    }
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

module.exports = new mongoose.model('resursa', Resursa);