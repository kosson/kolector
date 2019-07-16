const mongoose = require('mongoose');
let AriePrimar = new mongoose.Schema({
    arie: [
        {
            nume:      String,  // numele ariei curiculare (este membru unui vocabular controlat)
            descriere: String,  // descrierea ariei curiculare
            ids: [],            // sunt toți identificatorii, fie string, fie URI care adresează aria
            cod:       String,  // cod intern agreat (parte a vocabularului controlat)
            nivel: []           // nivelurile școlare compatibile.
        }
    ]
});
module.exports = new mongoose.model('acurricula', AriePrimar);