const mongoose = require('mongoose');

let CompetentaS = new mongoose.Schema({
    nume: {             // este chiar numele competenței specifice. Ex: 1.1. Identificarea semnificaţiei unui mesaj oral, pe teme accesibile, rostit cu claritate
        type: String,
        validate: {
            validator: (nume) => {                
                return nume.length > 2; // este absolut necesar să returnaze true sau false
            },
            message: 'Numele resursei trebuie să fie mai mare de trei caractere'
        },
        required: [true, 'Fără numele resursei, nu se poate face înregistrarea']
    },   
    ids:        [],     // În programă este codat cu 1.1. Aici se poate trece orice secvență alfanumerică care să ofere o adresă rapidă către competența specifică
    cod:        String, // cod intern agreat (parte a vocabularului controlat)
    token:      [],     // cunoștințe, abilități, atitudini: „utilizarea imaginilor pentru indicarea semnificaţiei unui mesaj audiat”, altul: „realizarea unui desen care corespunde subiectului textului audiat”
    disciplina: String, // COMUNICARE ÎN LIMBA ROMÂNĂ
    nivel:      [],     // toate acestea sunt cuvinte cheie. Sintagma în document este „Clasa pregătitoare, clasa I şi clasa a II-a”. Cheile: „clasa pregătitoare”, „clasa I”, „clasa a II-a”
    ref:        [],     // De ex: „Ordin al ministrului Nr. 3418/19.03.2013” sau poate fi link către ordin sau orice URI care poate identifica sursa informației sau orice asemenea
    din:        Date,
    nrRED:      Number  // numărul de resurse care vizează această competență   
});
let Competentaspecifica = new mongoose.model('competentaspecifica', CompetentaS);
module.exports = Competentaspecifica;