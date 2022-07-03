const mongoose = require('mongoose');

let Nops = new mongoose.Schema({
    date: Date,
    uuid: String,
    content: String,
    error: String
});

module.exports = new mongoose.model('nop', Nops);