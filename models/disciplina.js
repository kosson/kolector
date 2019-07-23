const mongoose = require('mongoose');

let Disciplina = new mongoose.Schema({
    nume:        String,      // numele ariei curiculare este membru al unui vocabular controlat. Acesta trebuie definit.
    descriere:   String,      // descrierea ariei curiculare
    ids:         Array,       // sunt toți identificatorii, fie string, fie URI care adresează aria
    cod:         String,      // cod intern agreat (parte a vocabularului controlat)
    codArie:     String,      // motivul pentru care arie devine un descriptor al disciplinei este chiar pentru că este unul. De fapt, binomul de lucru este disciplină - competență
    nivelScolar: [] // este un alt descriptor. Primul din array este cel corespondent programei, restul fiind completări după sugestiile specialiștilor sau ale publicului.
});
/*
{
    nume: ['Limbă și comunicare'],
    subcomponente: ['Limba şi literatura română','Limba engleză','Limba rusă','Limba germană','Limba italiană','Limba franceză','Limba spaniolă','Limba latină']
}   
*/
module.exports = new mongoose.model('disciplina', Disciplina);