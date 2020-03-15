const mongoose = require('mongoose');
const mexp     = require('mongoose-elasticsearch-xp');

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

Resursa.plugin(mexp);

module.exports = new mongoose.model('resursa', Resursa);