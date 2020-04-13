const mongoose = require('mongoose');

let Resursa = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    name: String,
    email: String,
    link: String,
    descriere: {},
    etichete: [],
    coperta: String,
    value: Number,
    coment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment'
    }
});

module.exports = new mongoose.model('resursa', Resursa);