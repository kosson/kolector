const mongoose = require('mongoose');

let adresaSchema = new mongoose.Schema({
    tara:   String,
    loco:   String, // localitate
    strada: String,
    numar:  String,
    cladire:String,
    cod:    String,
    geoRef: String,
    contact:[]  // pot fi numere de telefon, email, etc.
});

let Unit = new mongoose.Schema({
    nume:    String,
    acronim: String,
    logo:    [],
    adresa:  [adresaSchema]
});

module.exports = new mongoose.model('unit', Unit);