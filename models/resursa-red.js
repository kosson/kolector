require('dotenv').config();
const mongoose      = require('mongoose');
const validator     = require('validator');
const Schema        = mongoose.Schema;
const redisClient   = require('../redis.config');
const schema        = require('./resursa-red-es7'); // aceasta este schema de mapping pentru indexul din Elasticsearch (necesar pe hook save)
const editorJs2TXT  = require('../routes/controllers/editorJs2TXT'); 
const ES7Helper     = require('./model-helpers/es7-helper');
const logger        = require('../util/logger');

/* INDECȘII ES7 */
let {getStructure}  = require('../util/es7');
let RES_IDX_ES7 = '', RES_IDX_ALS = '', USR_IDX_ES7 = '', USR_IDX_ALS = '';
getStructure().then((val) => {
    // creează valori default pentru numele indecșilor ES7 necesari în cazul în care indexul și alias-ul său nu au fost create încă
    USR_IDX_ALS = val.USR_IDX_ALS ?? 'users';
    USR_IDX_ES7 = val.USR_IDX_ES7 ?? 'users0';
    RES_IDX_ALS = val.RES_IDX_ALS ?? 'resursedus';
    RES_IDX_ES7 = val.RES_IDX_ES7 ?? 'resursedus0';
}).catch((error) => {
    console.log(`Schema mongoose pentru resurse`, error);
    logger.error(error);
});

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

var recomSchema = Schema({
    contorRecom: Number, // este numărul recomandării
    continut:    String, // este conținutul recomandării
});

var ResursaSchema = Schema({
    _id: Schema.Types.ObjectId,

    // #1. INIȚIALIZARE ÎNREGISTRARE
    date:          Date,  // este data la care resursa intră în sistem. Data este introdusă automat la momentul în care este trimisă către baza de date.
    idContributor: {type: String},// este id-ul celui care a introdus resursa.
    angel:         {type: String},// este id-ul celui care a făcut ingestul înregistrării în sistem înainte să existe contul unui user care mai apoi poate face claiming.
    emailContrib:  String,  // este emailul celui care a făcut contribuția. În cazul unui claiming, aici va sta emailul creatorului. În baza acestuia se va putea face claim.
    autori:        {type: String},// Dacă sunt mai mulți autori, vor fi adăugați cu virgule între ei.
    langRED:       String,  // Este limba primară a resursei. Modelul ar fi 'ro', care indică limba pentru care s-a optat la deschiderea formularului pentru depunederea resursei. Valoarea va fi conform ISO 639-1 (https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).
    uuid:          String,  // Este numele subdirectorului în care sunt depozitate resursele
    // #2. TITLU ȘI RESPONSABILITATE
    title: {        
        type: String,  // Aici se introduce titlul lucrării în limba de elaborare
        // validate: {
        //     required: [true, 'Titlul este absolut necesar']
        // },
        index: true,
        trim: true
    },
    titleI18n:         [],  // Un titlu poate fi tradus în mai multe limbi. Modelul este: {ro:'Numele RED-ului',de:'Titel der RED'}. Cheia va fi o valoare conform ISO 639-2. Modificare la 639-2 pentru a permite și rromani - http://www.bibnat.ro/dyn-doc/Coduri%20de%20%20limba_639_2_2009_fin.pdf.
    
    // #3. ÎNCADRAREA RESURSEI ÎN CONTEXTUL CURRICULEI
    arieCurriculara:   [],
    level:             [],    // menționează clasa. Ex: Clasa I. În form, va fi un range. În înregistrare va fi un array de numere de la 0 la 8. Vezi colecția „niveluri-gimnaziu” din initdata
    discipline:        [],    // [valoare din vocabular] Sunt disciplinele pentru care se poate folosi această resursă, dar propuse intern. Este un array de coduri aferente disciplinelor. Codurile acestora devin etichete automat
    disciplinePropuse: [],    // Aici vor intra sugestiile publicului. I se va oferi un câmp de introducere etichete, cu autocompletare primele sugestii fiind disciplinele din vocabularul controlat. Codurile acestora devin automat etichete
    competenteGen:     [],    // Va fi un array de id-uri ale competențelor generale
    competenteS:       [{     // Va fi un array de id-uri ale competențelor specifice.
        type: Schema.Types.ObjectId, // va lua id-uri din altă colecție
        ref: "competentaspecifica" // este numele modelului de competență specifică, în cazul de față (ceea ce exporți din modul)
    }],
    activitati:    [], // sunt activitățile selectate de contribuitor și/sau adăugate de acesta suplimentar.
    prerequisite:  [], // sunt toate competențele necesare celui care accesează resursa. Gândește-te la nivelurile de cunoaștere ale unei limbi (A1, B2, etc). Aici va sta valoarea sau valorile pentru limba primară în care au fost introduse informațiile. La un moment dat este posibilă o interfațare cu Open Badges ca prerequisite în scop de gamificare.
    relatedTo:     [], // indică URL-urile, URN-urile, URI-urile care identifică resursele de la care s-a pornit în elaborarea RED-ului curent.
    
    // #4. ADMINISTRATIV
    administrator: [], // indică numele persoanei/lor care au evaluat și validat resursa.

    // #5. ELEMENTE OBLIGATORII PENTRU VALIDAREA RESURSEI
    grupuri:       [], // [valoare din vocabular] Va fi o listă de coduri care identifică câte o categorie reglementată de un vocabular controlat. De ex: „elev”, „profesor”, „aparținător”
    domeniu:       [], // [valoare din vocabular] De ex: „cognitiv”, „psiho-motor”, „afectiv”, „social”
    functii:       [], // [valoare din vocabular] De ex: „cunoștințe noi” („predare”, „explicare”), „acomodare”, „actualizare”, „aprofundare”, „recapitulare”, „evaluare”
    demersuri:     [], // [valoare din vocabular] De ex: „inductiv”, „deductiv”, „dialectic”, „analogic”
    spatii:        [], // [valoare din vocabular] De ex. „la clasă”, „acasă”, „în laborator”, „în aer liber”
    invatarea:     [], // [valoare din vocabular] De ex: „la clasă”, „individual”, „grupat”

    // #5 DESCRIERE
    rol:           String, // Activități de învățare susținute sustine/complementar
    abilitati:     String, // RED-ul necesită competențe digitale de nivelul: avansat/mediu/minim
    componente:    String, // Sunt linkuri către părți componente care au fost luate din alte părți sau care au for incorporate prin reinterpretare, devzoltare, etc
    materiale:     [],     // Sunt materialele necesare creări mediului de vizualizare, reproducere, interpretare, etc
    description:   {type: String},
    identifier:    [], // Sunt diferiții identificatori ai unei resurse. Poate fi orice string, fie text, nume fișier, fie url sau ISBN... Se generează automat la încărcare. Va apărea doar la momentul accesării! Nu este disponibil la momentul încărcării.
    // la primele resurse create în 2020, uuid-ul era introdus drept prim identificator.

    // #6. CONȚINUT
    dependinte:    String, // În cazul în care resursa are nevoie de un context de execuție, acesta va fi menționat aici.
    coperta:       String, // [este un URI] dacă resursa are o imagine reprezentativă, video, audio, etc. Aceasta se numește generic „copertă” și va fi folosită pentru a ilustra resursa în landing page și acces restricționat specialiști
    licenta:       String,
    comentarii:    [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment'
    }],     // este o listă de identificatori pentru comentariile aduse unei anumite resurse.
    content: {}, // Este conținutul adăugat cu Editor.js
    bibliografie:  String, // este o listă de referințe bibliografice dacă acest lucru există. Formatul este APA, versiunea 6.

    // #7. METRICI
    generalPublic:    Boolean, // o valoare 'true' semnifică faptul că prezenta resursă intră în zona publică
    claimed:          Boolean, // indică dacă o resursă a fost recunoscută și însușită de un utilizator care are cont. Dacă e `true` înseamnă ca a fost o resursă încărcată de admin. Dacă `false` emailul n-are user.
    contorAcces:      Number,  // de câte ori a fost accesată individual resursa
    contorRating:     Number,  // de câte ori a fost apreciată resursa
    contorDescarcare: Number,  // de câte ori a fost descărcată resursa
    etichete:         [{
        type: String
    }],      // Sunt toate etichetele primite la momentul introducerii resursei la care se vor adăuga cele introduse ulterior de public
    expertCheck:      Boolean, // indică faptul că expertul a declarat resursa educațională a fi una validă după ce s-au operat revizuirile. Va avea o bifă în form
    // o resursă educațională va avea cel puțin o referință, care să indice prin textul introdus de expert acordul la publicare în baza algoritmului de validare. Câta vreme expertCheck este false, resursa nu va fi publicată
    badges: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'badge'
    }],
    ratingTotal: Number, // este numarul la care se adaugă valoarea pentru care a optat un utilizator
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    }
},
{
    toJSON:   { virtuals: true },  // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true } // So `toObject()` output includes virtuals
});

/* === HOOKS PRE REMOVE === */
// Stergerea comentariilor asociate utiliatorului atunci când acesta este șters din baza de date.
ResursaSchema.pre('remove', function hRemoveClbk (next) {
    const Coment = mongoose.model('coment'); // acces direct la model fără require
    Coment.remove({ // -> Parcurge întreaga colecție a comentariilor
        // -> iar dacă un `_id`  din întreaga colecție de comentarii se potrivește cu id-urile de comentariu din întregistrarea resursei (`$in: this.Coment`), șterge-le. 
        _id: {$in: this.Coment} // se va folosi operatorul de query `in` pentru a șterge înregistrările asociate
    }).then(() => next()); // -> acesta este momentul în care putem spune că înregistrarea a fost eliminată complet.
});

/* === HOOKS POST === */
// Fii foarte atent să coordoneze toate câmpurile existente în fișierul de mapping pentru indexul din Elasticsearch
// cu cele precizate la `const data` în `.post('save'` și `post(/^find/`. Trebuie să fie unu-la-unu cu mapping-ul `/models/resursa-red-es7.js`

/* === POST SAVE === */
// Indexare în Elasticsearch după ce resursa a fost salvată în baza de date!
ResursaSchema.post('save', function clbkPostSave1 (doc, next) {
    // console.log("[models/sursa-red.js] a primit în post save următorul obiect pentru doc._doc: ", doc._doc._id);
    
    let obi = Object.assign({}, doc._doc);
    // verifică dacă există conținut
    var content2txt = '';
    if ('content' in obi) {
        content2txt = editorJs2TXT(obi.content.blocks); // transformă obiectul în text
    }
    // indexează documentul
    const data = {
        id:               obi._id,
        date:             obi.date,
        idContributor:    obi.idContributor,
        emailContrib:     obi.emailContrib,
        uuid:             obi.uuid,
        autori:           obi.autori,
        langRED:          obi.langRED,
        title:            obi.title,
        titleI18n:        obi.titleI18n,
        arieCurriculara:  obi.arieCurriculara,
        level:            obi.level,
        discipline:       obi.discipline,
        disciplinePropuse:obi.disciplinePropuse,
        competenteGen:    obi.competenteGen,
        rol:              obi.rol,
        abilitati:        obi.abilitati,
        materiale:        obi.materiale,
        grupuri:          obi.grupuri,
        domeniu:          obi.demersuri,
        spatii:           obi.spatii,
        invatarea:        obi.invatarea,
        description:      obi.description,
        dependinte:       obi.dependinte,
        coperta:          obi.coperta,
        content:          content2txt,
        bibliografie:     obi.bibliografie,
        contorAcces:      obi.contorAcces,
        generalPublic:    obi.generalPublic,
        contorDescarcare: obi.contorDescarcare,
        etichete:         obi.etichete,
        utilMie:          obi.utilMie,
        expertCheck:      obi.expertCheck,
        rating:           obi.rating
    };

    // NOTE: Vezi ca acest helper răspunde cazului in care ai de-a face cu prima resursă, caz în care nu ai nici idx, nici alias-ul său în Elasticsearch
    if (RES_IDX_ES7) {
        ES7Helper.searchIdxAndCreateDoc(schema, data, RES_IDX_ES7, RES_IDX_ALS).catch((error) => {
            console.log(error);
            logger.error(error);
        });
    }
    next();
});

/* === CAZUL ÎN CARE SUNT CĂUTATE MAI MULTE ÎNREGISTRĂRI SAU UNA SINGURĂ ==== */

/**
 * Funcția se aplică pe fiecare înregistrarea dintr-un array, dacă sunt mai multe (`doc.map(checkRecord)`)
 * Funcția este cerută de `clbkResFindPostHookREDschema()`
 * @param {Array} res Este un set de resurse care au fost găsite pe find+ceva
 */
function checkRecord (res) {
    // console.log('[resursa-red.js] Ptr cazul array-ului, indexul este ', RES_IDX_ALS, 'iar documentul este ', res);

    // MAI ÎNTÂI VERIFICĂ DACĂ EXISTĂ INDEXUL ȘI ALIAS-uL. POATE INTRE TIMP NU MAI E SAU ESTI CHIAR LA INCEPUT CAND NU EXISTA
    if (RES_IDX_ALS) {
        // console.log("[models/sursa-red.js] De pe hook-ul `post` metoda ^find, ramura unui singur document. Titlul doc: ", res.title);
        
        // verifică dacă înregistrarea din Mongo este indexată în ES?
        ES7Helper.recExists(res._id, RES_IDX_ALS).then((e) => {
            // console.log("resursa-red::test daca exista in ES", e);
            if (e === false) {
                // console.log("[models/sursa-red.js] Documentul adus cu ES6Helper.recExists este:", e);
                
                let obi = Object.assign({}, res._doc); // recast la înregistrare pentru a elimina artefacte Mongoose document
                var content2txt = ''; // verifică dacă există conținut
                if ('content' in obi) {
                    content2txt = editorJs2TXT(obi.content.blocks); // transformă obiectul în text
                }
                // indexează documentul
                const data = {
                    id:               obi._id,
                    date:             obi.date,
                    idContributor:    obi.idContributor,
                    emailContrib:     obi.emailContrib,
                    uuid:             obi.uuid,
                    autori:           obi.autori,
                    langRED:          obi.langRED,
                    title:            obi.title,
                    titleI18n:        obi.titleI18n,
                    arieCurriculara:  obi.arieCurriculara,
                    level:            obi.level,
                    discipline:       obi.discipline,
                    disciplinePropuse:obi.disciplinePropuse,
                    competenteGen:    obi.competenteGen,
                    rol:              obi.rol,
                    abilitati:        obi.abilitati,
                    materiale:        obi.materiale,
                    grupuri:          obi.grupuri,
                    domeniu:          obi.demersuri,
                    spatii:           obi.spatii,
                    invatarea:        obi.invatarea,
                    description:      obi.description,
                    dependinte:       obi.dependinte,
                    coperta:          obi.coperta,
                    content:          content2txt,
                    bibliografie:     obi.bibliografie,
                    contorAcces:      obi.contorAcces,
                    generalPublic:    obi.generalPublic,
                    contorDescarcare: obi.contorDescarcare,
                    etichete:         obi.etichete,
                    utilMie:          obi.utilMie,
                    expertCheck:      obi.expertCheck,
                    rating:           obi.rating
                };

                ES7Helper.searchIdxAndCreateDoc(schema, data, RES_IDX_ES7, RES_IDX_ALS);
            }   
        }).catch((error) => {
            console.error(JSON.stringify(error, null, 2));
            logger.error(error);
        });
    }
}

/**
 * Funcția are rol de callback pentru hook-ul mongoose post definit prin regexp-ul `/^find/`
 * Când se face căutarea unei resurse folosindu-se metodele `find`, `findOne`, `findOneAndUpdate`, vezi dacă a fost indexat. 
 * Dacă nu, se indexează!
 * @param {Array | Object} doc înregistrarea(le)
 * @param {*} next 
 */
function clbkResFindPostHookREDschema (doc, next) {
    // cazul când rezultatele sunt multiple într-un array.
    if (Array.isArray(doc)){
        // doc.map(checkRecord);
        doc.map((doc) => {
            console.log(`Am primit obiectul `, doc);
        });
    // cazul unei singure înregistrări
    } else if(doc.id) {
        // checkRecord(doc);
        checkRecord(doc);
    } else {
        next();
    }
}

/* === POST /^find/ === */
// ResursaSchema.post(/^find/, clbkResFindPostHookREDschema);  // Adăugare middleware pe `post` pentru toate operațiunile `find` folosind un regexp

// Resursa.methods.nume_metodă = function () {}; // metodă care poate fi folosită pe un singur obiect instanțiat în baza schemei. obiectul adus din bază!!!
// Resursa.static.nume_metodă = function () {}; // metodă care poate fi folosită pe model

/**
 * Modelul mongoose pentru o Resursă Educațională Deschisă
 */
module.exports = mongoose.model('resursedu', ResursaSchema);