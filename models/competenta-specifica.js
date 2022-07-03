const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let CompetentaS = Schema({
    _id: mongoose.Schema.Types.ObjectId,
    nume: {             // este chiar numele competenței specifice. Ex: 1.1. Identificarea semnificaţiei unui mesaj oral, pe teme accesibile, rostit cu claritate
        type: String,
        validate: {
            validator: (nume) => {                
                return nume.length > 2; // este absolut necesar să returneze true sau false
            },
            message: 'Numele resursei trebuie să fie mai mare de trei caractere'
        },
        required: [true, 'Fără numele resursei, nu se poate face înregistrarea']
    },
    idRED:      [{
        type: Schema.Types.ObjectId,
        ref: "resursedu"
    }],
    ids:        [],     // În programă este codat cu 1.1. Aici se poate trece orice secvență alfanumerică care să ofere o adresă rapidă către competența specifică
    cod:        String, // cod intern agreat (parte a vocabularului controlat)
    activitati: [],     // cunoștințe, abilități, atitudini: „utilizarea imaginilor pentru indicarea semnificaţiei unui mesaj audiat”, altul: „realizarea unui desen care corespunde subiectului textului audiat”
    disciplina: [],     // COMUNICARE ÎN LIMBA ROMÂNĂ
    coddisc:    String, // codul de disciplină
    nivel:      [],     // toate acestea sunt cuvinte cheie. Sintagma în document este „Clasa pregătitoare, clasa I şi clasa a II-a”. Cheile: „clasa pregătitoare”, „clasa I”, „clasa a II-a”
    ref:        [],     // De ex: „Ordin al ministrului Nr. 3418/19.03.2013” sau poate fi link către ordin sau orice URI care poate identifica sursa informației sau orice asemenea
    parteA:     String, // Se introduce numele grupei de competențe specifice. De ex: „Receptarea de mesaje orale în contexte de comunicare cunoscute” 
    REDuri:     [],     // Este setul de identificatori. Fiecare identificator este o resursă care este în setul modelului resursei ca element în setul `target.value`. Dacă în `target.value` este adăugat id-ul unei competențe, id-ul respectivei resurse va fi adăugat acestui set.
},
{
    toJSON:   { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true } // So `toObject()` output includes virtuals
});

// definim un virtual care va calcula automat numărul de RED-uri care menționează o anumită competență.
// https://mongoosejs.com/docs/populate.html#populate-virtuals
CompetentaS.virtual('nrREDuri', {
    ref: 'resursedu',
    localField: '_id',
    foreignField: 'competenteS',
    count: true
    // justOne: true // for many-to-1 relationships
});

module.exports = mongoose.model('competentaspecifica', CompetentaS);