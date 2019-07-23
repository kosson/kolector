const mongoose = require('mongoose');

let Eticheta = new mongoose.Schema({
    nume:    String,
    uri:     String,
    context: [],
    reduri: [{
        type: Schema.Types.ObjectId,
        ref: 'resursedu'
    }]
});

module.exports = new mongoose.model('eticheta', Eticheta);