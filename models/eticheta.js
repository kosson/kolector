const mongoose = require('mongoose');
const mexp     = require('mongoose-elasticsearch-xp');

let Eticheta = new mongoose.Schema({
    nume: {
        type:      String,
        lowercase: true, // normalizează toate etichetele
        // index:     true,
        trim:      true
    },
    uri:     String,
    context: [],
    reduri: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'resursedu'
    }]
});

Eticheta.plugin(mexp);

module.exports = new mongoose.model('eticheta', Eticheta);