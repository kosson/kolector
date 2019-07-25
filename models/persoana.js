const mongoose = require('mongoose');

let Persoana = new mongoose.Schema({
    nume: String,
    prenume: String,
    ids: [],
    unit: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'unit'
    }]
});