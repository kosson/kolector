const mongoose = require('mongoose');
const mexp     = require('mongoose-elasticsearch-xp');

let Persoana = new mongoose.Schema({
    nume: String,
    prenume: String,
    ids: [],
    unit: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'unit'
    }]
});

Persoana.plugin(mexp);

module.exports = new mongoose.model('persoana', Persoana);