const mongoose = require('mongoose');

let subComponenteAriiCurriculare = new mongoose.Schema({
    nume: String,   // Aceste nume trebuie să facă parte dintr-un vocabular controlat.
    cod: String,    // cod intern agreat (parte a vocabularului controlat)
});

let nivelScolar = new mongoose.Schema({
    nume: String,   // Aceste nume trebuie să facă parte dintr-un vocabular controlat.
    cod: String     // cod intern agreat (parte a vocabularului controlat)
});

let AriePrimar = new mongoose.Schema({
    arie: [
        {
            nume:      String,      // numele ariei curiculare este membru al unui vocabular controlat. Acesta trebuie definit.
            descriere: String,      // descrierea ariei curiculare
            ids: [],                // sunt toți identificatorii, fie string, fie URI care adresează aria
            cod:       String,      // cod intern agreat (parte a vocabularului controlat)
            subComponente: [subComponenteAriiCurriculare],
            nivel: [nivelScolar]    // nivelurile școlare compatibile.
        }
    ]
});
module.exports = new mongoose.model('acurricula', AriePrimar);

/*
{
    nume: ['Limbă și comunicare'],
    subcomponente: ['Limba şi literatura română','Limba engleză','Limba rusă','Limba germană','Limba italiană','Limba franceză','Limba spaniolă','Limba latină']
}   
*/