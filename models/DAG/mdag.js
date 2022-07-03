const mongoose = require('mongoose');

let options = { discriminatorKey: 'type'};

let MDAG = new mongoose.Schema({
    hash: String,
    algo: String,
    uri: String,
    label: [{lang: String, name: String}],
    definition: [{lang: String, def: String}],
    description: [{lang: String, comment: String}],
    attr: [{attribute: String, uri: String}],
    vocab: []
}, options);

let TypeOfTerm = new mongoose.Schema({
    typeofterm: String
});

module.exports = new mongoose.model('mdag', MDAG);

/*
MDAG
- hash: este hashul calculat al nodului sau al muchiei ori chiar al unui întreg arbore
- algo: precizează algoritmul cu care s-a făcut hashingul
- uri: este URI-ul care identifică tagul/nodul/entitatea/muchia/arborele
- label: (+) este numele tagului/nodului/entității/muchiei/arborelui. Fiecare element precizează limba și numele. Poate avea mai multe în mai multe limbi. 
    Pentru limbă, vei menționa tagul corespondent din https://iso639-3.sil.org/code_tables/639/data/r. De ex., pentru Română: ron.
- definition: (+) este definiția canonică a ceea ce reprezintă respectivul tag/nod/entitate/muchie/arbore. Poate avea mai multe limbi.
- description: (+) este descrierea pe larg a contextului în care poate fi folosit respectivul tag/nod/entitate/muchie/arbore. Poate avea mai multe limbi.
- attr: (+) sunt posibilele atribute pe care un tag/nod/entitate/muchie/arbore le poate avea. Ajută la o mai bună încadrare. 
    Vezi https://www.dublincore.org/specifications/dublin-core/dcmi-terms/
    "Where applicable, the following attributes provide additional information about a term"
    Tot aici poți introduce namespace-ul asociat în ecoding. De exemplu, pentru dublin core terms, ai dct -> {attribute: 'dcterms', uri: 'http://purl.org/dc/terms/'}
    Vezi și https://www.dublincore.org/specifications/dublin-core/dc-xml-guidelines/2003-04-02/
- vocab: sunt menționate toate vocabularele în care ar putea să existe respectivul tag/nod/entitate/muchie/arbore.

Discriminatorul este TypeOfTerm care va indica poziția ierarhică a tagului/nodului/entității/muchiei/arborelui față de cele cu care intră în relație
- Class
- Superclass
- Subclass
- Domain
- Property

https://schema.org/Thing > https://schema.org/CreativeWork > https://schema.org/Book
*/