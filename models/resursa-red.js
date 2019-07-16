const mongoose = require('mongoose');

var Resursa = new mongoose.Schema({
    title:   {
        context: ['http://purl.org/dc/elements/1.1/title', 'https://schema.org/name'],
        value: String,  // Aici se introduce titlul lucrării în limba de elaborare
        label: '',      // este proprietatea name a câmpului de înregistrare în limba celui care a introdus resursa. Ce era în formular trecut
        i18n: {        
            value: {},  // modelul ar fi {ro:'Numele RED-ului',de:'Titel der RED'} pentru cazul în care resursa are titlul în mai multe limbi
            label: {}   // eticheta câmpului în mai multe posibile limbi. Modelul este fix la fel: {ro:'Numele RED-ului',de:'Titel der RED'}
        }
    },
    creator: {
        context: ['http://purl.org/dc/elements/1.1/creator', 'https://schema.org/creator'],
        value: []       // este ceea ce numim autor / autori ai resursei
    },
    description: {
        context: ['http://purl.org/dc/elements/1.1/description', 'https://schema.org/description'],
        value: String
    },
    date: {
        context: ['http://purl.org/dc/elements/1.1/date', 'https://schema.org/datePublished'],
        value: Date
    },
    identifier: {
        context: ['http://purl.org/dc/elements/1.1/identifier', 'https://schema.org/identifier'],
        value: []   // poate fi orice string, fie text, nume fișier, fie url sau ISBN...
    },
    language: {
        context: ['http://purl.org/dc/elements/1.1/language', 'https://schema.org/Language'],
        value: String   // Dacă avem o resursă cu fațete în mai multe limbi, aceste fațete sunt entități diferite, care stabilesc o legătură related
    },
    target: {
        context: ['https://schema.org/targetName'],
        value: []       // Este ținta de învățare specificată ca obiectiv clar identificabil într-un vocabular controlat al elementelor stabilite de specialiști, dar coddate. Codul respectiv va fi valoarea
    },
    level: {
        context: ['http://purl.org/dcx/lrmi-vocabs/alignmentType/educationalLevel', 'https://schema.org/alignmentType'],
        value: [],      // menționează clasa
        related: []     // menționează la care alte clase mai ajută prezenta resursă.
    },
    subject: {
        context: ['http://purl.org/dcx/lrmi-vocabs/alignmentType/educationalSubject', 'https://schema.org/identifier'],
        value: {            // sunt disciplinele pentru care resursa se pretează
            canonic: [],    // sunt disciplinele care au fost alese în baza unui vocabular controlat de către specialist la momentul introducerii în bază
            proposed: [],   // discipline propuse în baza vocabularului controlat a fi luate în considerare de ceilalți specialiști la momentul unei posibile evaluări
            public: []      // sunt discipline propuse în baza unui vocabular controlat de către public.
        }
    },
    prerequisite: {
        context: ['http://purl.org/dcx/lrmi-vocabs/alignmentType/prerequisite', 'https://schema.org/targetName'],
        value: []           // sunt toate competențele necesare celui care accesează resursa.
    },
    literacy: {
        context: ['http://purl.org/dcx/lrmi-vocabs/alignmentType/readingLevel'],
        value: []   // ce niveluri de educație/cultură/literacy sunt necesare pentru această resursă. Este nevoie de un vocaular controlat.
    },
    teaches: {
        context: ['http://purl.org/dcx/lrmi-vocabs/alignmentType/teaches'],
        value: []   // Indică competențele pe care le va dobândi cel care va învăța folosind resursa. Ideal ar fi să se constituie seturi de competențe pe fiecare disciplină. E nevoie de vocabulare controlate.
    },
    administrator: {
        context: ['http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/administrator'],
        value: []   // indică numele persoanei care a evaluat și validat resursa.
    }
});
// Acestea sunt competențele care vor fi menționate ca etichete ale competențelor

module.exports = mongoose.model('resursed', Resursa);