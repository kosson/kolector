const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var softwareSchema = new mongoose.Schema({
    nume:     {
        type: String,
        trim: true
    },
    versiune: {
        type: String,
        trim: true
    },
    homepage: String,
    logoUri:  String
});

var recomSchema = new mongoose.Schema({
    contorRecom: Number, // este numărul recomandării
    continut:    String, // este conținutul recomandării
});

var Resursa = new mongoose.Schema({
    _id: Schema.Types.ObjectId,

    // #1. INIȚIALIZARE ÎNREGISTRARE
    date:          Date,  // este data la care resursa intră în sistem. Data este introdusă automat la momentul în care este trimisă către baza de date.
    idContributor: String,// este id-ul celui care a creat resursa. Dacă sunt mai mulți autori, este cel care face propunerea de resursă.
    autori:        String,
    dateContext:   ['http://purl.org/dc/elements/1.1/date', 'https://schema.org/datePublished'],
    langRED:       String,  // Este limba primară a resursei. Modelul ar fi 'ro', care indică limba pentru care s-a optat la deschiderea formularului pentru depunederea resursei. Valoarea va fi conform ISO 639-1 (https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).
    langContext:   ['http://purl.org/dc/elements/1.1/language', 'https://schema.org/Language'],

    // #2. TITLU ȘI RESPONSABILITATE
    title: {        
        type: String,  // Aici se introduce titlul lucrării în limba de elaborare
        // validate: {
        //     required: [true, 'Titlul este absolut necesar']
        // },
        index: true,
        trim: true
    },
    titleI18n:      [],  // Un titlu poate fi tradus în mai multe limbi. Modelul este: {ro:'Numele RED-ului',de:'Titel der RED'}. Cheia va fi o valoare conform ISO 639-2. Modificare la 639-2 pentru a permite și rromani - http://www.bibnat.ro/dyn-doc/Coduri%20de%20%20limba_639_2_2009_fin.pdf.
    titleContext:   ['http://purl.org/dc/elements/1.1/title', 'https://schema.org/name'],
    
    // #3. ÎNCADRAREA RESURSEI ÎN CONTEXTUL CURRICULEI
    arieCurriculara:    [],
    level:              [],    // menționează clasa. Ex: Clasa I. În form, va fi un range. În înregistrare va fi un array de numere de la 0 la 8. Vezi colecția „niveluri-gimnaziu” din initdata
    levelContext:       ['http://purl.org/dcx/lrmi-vocabs/alignmentType/educationalLevel', 'https://schema.org/alignmentType'],
    discipline:         [],    // [valoare din vocabular] Sunt disciplinele pentru care se poate folosi această resursă, dar propuse intern. Este un array de coduri aferente disciplinelor. Codurile acestora devin etichete automat
    disciplinePropuse:  [],    // Aici vor intra sugestiile publicului. I se va oferi un câmp de introducere etichete, cu autocompletare primele sugestii fiind disciplinele din vocabularul controlat. Codurile acestora devin automat etichete
    disciplineContext:  ['http://purl.org/dcx/lrmi-vocabs/alignmentType/educationalSubject', 'https://schema.org/identifier'],
    competenteGen:      [],    // Va fi un array de id-uri ale competențelor specifice
    competenteS:        [{     // Primul va fi cel din ierarhie, restul vor fi cele care sunt propuse (public sau experți).
        type: mongoose.Schema.Types.ObjectId,    // va lua id-uri din altă colecție
        ref: 'competentaspecifica'      // este numele modelului de competență specifică, în cazul de față (ceea ce exporți din modul)
    }],    // [valoare din vocabular] Set de competențe specifice. Este ținta de învățare specificată ca obiectiv clar identificabil într-un vocabular controlat al elementelor stabilite de specialiști, dar codate. Sunt cele care sunt alese inițial la selecția când resursa a fost încărcată. Codurile acestora devin automat etichete. Când identficatorul unei comptențe specifice este introdus în acest set, automat, va fi actualizat setul `REDuri` cu id-ul resursei constituite. Astfel, o competență va ști mereu de care REDuri este referită.
    competentaSContext: ['https://schema.org/targetName', 'http://purl.org/dcx/lrmi-vocabs/alignmentType/teaches'],
    activitati:         [],    // sunt activitățile selectate de contribuitor și/sau adăugate de acesta suplimentar.
    prerequisite:       [],    // sunt toate competențele necesare celui care accesează resursa. Gândește-te la nivelurile de cunoaștere a unei limbi (A1, B2, etc). Aici va sta valoarea sau valorile pentru limba primară în care au fost introduse informațiile. La un moment dat este posibilă o interfațare cu Open Badges ca prerequisite în scop de gamificare.
    prerequisiteContext:['http://purl.org/dcx/lrmi-vocabs/alignmentType/prerequisite', 'https://schema.org/targetName'],

    // #4. ADMINISTRATIV
    administrator:      [], // indică numele persoanei/lor care au evaluat și validat resursa.
    administratorContext: ['http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/administrator'],

    // #5. ELEMENTE OBLIGATORII PENTRU VALIDAREA RESURSEI
    grupuri:          [], // [valoare din vocabular] Va fi o listă de coduri care identifică câte o categorie reglementată de un vocabular controlat. De ex: „elev”, „profesor”, „aparținător”
    domeniu:          [], // [valoare din vocabular] De ex: „cognitiv”, „psiho-motor”, „afectiv”, „social”
    functii:          [], // [valoare din vocabular] De ex: „cunoștințe noi” („predare”, „explicare”), „acomodare”, „actualizare”, „aprofundare”, „recapitulare”, „evaluare”
    demersuri:        [], // [valoare din vocabular] De ex: „inductiv”, „deductiv”, „dialectic”, „analogic”
    spatii:           [], // [valoare din vocabular] De ex. „la clasă”, „acasă”, „în laborator”, „în aer liber”
    invatarea:        [], // [valoare din vocabular] De ex: „la clasă”, „individual”, „grupat”

    // #5 DESCRIERE
    description: {
        type: String
    },
    descriptionContext: ['http://purl.org/dc/elements/1.1/description', 'https://schema.org/description'],
    identifier:         [], // Sunt diferiții identificatori ai unei resurse. Poate fi orice string, fie text, nume fișier, fie url sau ISBN... Se generează automat la încărcare. Va apărea doar la momentul accesării! Nu este disponibil la momentul încărcării.
    identifierContext:  ['http://purl.org/dc/elements/1.1/identifier', 'https://schema.org/identifier'],

    // #6. CONȚINUT
    dependinte:    String, // În cazul în care resursa are nevoie de un context de execuție, acesta va fi menționat aici.
    coperta:       String, // [este un URI] dacă resursa are o imagine reprezentativă, video, audio, etc. Aceasta se numește generic „copertă” și va fi folosită pentru a ilustra resursa în landing page și acces restricționat specialiști
    licenta:       String,
    contextLicenta:['http://purl.org/dcx/lrmi-terms/useRightsUrl'],
    comentarii:    [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'coment'
    }],     // este o listă de identificatori pentru comentariile aduse unei anumite resurse.
    content:       {}, // Este conținutul pe care îl permiți să fie adăugat cu Editor.js
    bibliografie:  String, // este o listă de referințe bibliografice dacă acest lucru există. Formatul este APA, versiunea 6.

    // #7. METRICI
    contorAcces:      Number,  // de câte ori a fost accesată individual resursa
    generalPublic:    Boolean, // o valoare 'true' semnifică faptul că prezenta resursă intră în zona publică
    contorDescarcare: Number,  // de câte ori a fost descărcată resursa
    etichete:         [],      // Sunt toate etichetele primite la momentul introducerii resursei la care se vor adăuga cele introduse ulterior de public
    utilMie:          Number,  // Este echivalentul lui „Like” pentru un utilizator indiferent de rangul ACL. Acesta va cumula cu cele date de public.
    expertCheck:      Boolean  // indică faptul că expertul a declarat resursa educațională a fi una validă după ce s-au operat revizuirile. Va avea o bifă în form
    // o resursă educațională va avea cel puțin o referință, care să indice prin textul introdus de expert acordul la publicare în baza algoritmului de validare. Câta vreme expertCheck este false, resursa nu va fi publicată
});

// HOOKS
// Stergerea comentariilor asociate utiliatorului atunci când acesta este șters din baza de date.
Resursa.pre('remove', function hRemoveCb() {
    const Coment = monoose.model('coment'); // acces direct la model fără require
    Coment.remove({ // -> Parcurge întreaga colecție a comentariilor
        // -> iar dacă un `_id`  din întreaga colecție de comentarii se potrivește cu id-urile de comentariu din întregistrarea resursei (`$in: this.Coment`), șterge-le. 
        _id: {$in: this.Coment} // se va folosi operatorul de query `in` pentru a șterge înregistrările asociate
    }).then(() => next()); // -> acesta este momentul în care putem spune că înregistrarea a fost eliminată complet.
});

module.exports = mongoose.model('resursedu', Resursa);