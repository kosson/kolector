require('dotenv').config();

/* === DEPENDINȚE === */
const moment       = require('moment');
const crypto       = require('crypto');
const logger       = require('../../util/logger');
/* === LIVRESQ - CONNECTOR === */
const LivresqConnect = require('../../models/livresq-connect').LivresqConnect;

/* === MODELE === */
const Resursa     = require('../../models/resursa-red');        // Adu modelul resursei
const Mgmtgeneral = require('../../models/MANAGEMENT/general'); // Adu modelul management
/* === HELPERE === */
// Cere helperul `checkRole` cu care verifică dacă există rolurile necesare accesului
let checkRole     = require('./checkRole.helper');
let content2html  = require('./editorJs2HTML');
// cere helperul pentru cache-ing
require('./cache.helper');
const {clearHash} = require('./cache.helper');
let cookieHelper  = require('./cookie2obj.helper');
let {getStructure} = require('../../util/es7');

// INDECȘII ES7
let RES_IDX_ES7 = '', RES_IDX_ALS = '', USR_IDX_ES7 = '', USR_IDX_ALS = '';
getStructure().then((val) => {
    // console.log(`Am obținut `, val);
    USR_IDX_ALS = val.USR_IDX_ALS;
    USR_IDX_ES7 = val.USR_IDX_ES7;
    RES_IDX_ALS = val.RES_IDX_ALS;
    RES_IDX_ES7 = val.RES_IDX_ES7;
}).catch((error) => {
    console.log(`[resurse.ctrl.js::getStructure] nu a adus datele`, error);
    logger.error(error);
});

// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

/* === AFIȘAREA RESURSELOR :: /resurse === */
exports.loadRootResources = async function loadRootResources (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);
    //  ACL
    let roles = ["user", "validator", "cred"];
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles); 
    // console.log("Am următoarele roluri (resurse.ctrl) din req.session.passport: ", req.session.passport.user.roles.rolInCRED);

    // Adu-mi ultimele 9 resursele validate în ordinea ultimei intrări.
    let resursePublice = Resursa.find({'expertCheck': 'true'}).sort({"date": -1}).limit(9);

    // ===> SCRIPTURI
    let scripts = [       
        // MOMENT.JS
        {script: `moment/min/moment-with-locales.min.js`},
        // HOLDERJS
        {script: `holderjs/holder.min.js`}
    ];
    // ===> MODULE
    let modules = [
        // LOCALE
        // {module: `${gensettings.template}/js/redincredall.mjs`}
        {module: `${gensettings.template}/js/redincredallcursor.mjs`}
    ];
    // console.log(`Valorile dorite sunt `, RES_IDX_ES7, RES_IDX_ALS);
    if (!RES_IDX_ALS) {
        let err = new Error('[resurse.ctrl.js]::Verificarea existenței alias-ului a dat chix');
        next(err);
    }
    
    /* ===> VERIFICAREA CREDENȚIALELOR <=== */
    if(req.session.passport.user.roles.admin){
        resursePublice.then((result) => {

            let fullstar = `<i class="bi bi-star-fill"></i>`,
                emptystart = `<i class="bi bi-star"></i>`,
                halfempty = `<i class="bi bi-star-half"></i>`;

            let newResultArr = result.map(function clbkMapResult (obi) {
                const newObi = Object.assign({}, obi._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
                // https://github.com/wycats/handlebars.js/blob/master/release-notes.md#v460---january-8th-2020
                newObi.dataRo = moment(obi.date).locale('ro').format('LLL');
                // introdu template-ul ca proprietare (necesar stabilirii de linkuri corecte in fiecare element afișat în client)
                newObi.template = `${gensettings.template}`;
                newObi.logo = `${gensettings.template}/${LOGO_IMG}`;

                newObi.ratingrepresentation = '';
                let kontor = newObi.contorRating ?? 0;
                let lastRating = newObi.rating ?? 0;
                let ratingTotal = newObi.ratingTotal ?? 0;
                let presentRating = ratingTotal / kontor;

                // 0 - 0.5 | 0.5 - 1 | 1 - 1.5 | 1.5 - 2 | 2 - 2.5 | 2.5 - 3 | 3 - 3.5 | 3.5 - 4 | 4 - 4.5 | 4.5 - 5
                if (isNaN(presentRating)) {
                    newObi.ratingrepresentation = `${emptystart}${emptystart}${emptystart}${emptystart}${emptystart}`;
                } else if (presentRating > 0 && presentRating < 0.5) {
                    newObi.ratingrepresentation = `${halfempty}${emptystart}${emptystart}${emptystart}${emptystart}`;
                } else if (presentRating > 0.6 && presentRating <= 1) {
                    newObi.ratingrepresentation = `${fullstar}${emptystart}${emptystart}${emptystart}${emptystart}`;
                } else if (presentRating > 1 && presentRating <= 1.5) {
                    newObi.ratingrepresentation = `${fullstar}${halfempty}${emptystart}${emptystart}${emptystart}`;
                } else if (presentRating > 1.6 && presentRating <= 2) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${emptystart}${emptystart}${emptystart}`;
                } else if (presentRating > 2 && presentRating <= 2.5) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${halfempty}${emptystart}${emptystart}`;
                } else if (presentRating > 2.6 && presentRating <= 3) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${emptystart}${emptystart}`;
                } else if (presentRating > 3 && presentRating <= 3.5) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${halfempty}${emptystart}`;
                } else if (presentRating > 3.6 && presentRating <= 4) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${emptystart}`;
                } else if (presentRating > 4 && presentRating <= 4.5) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${halfempty}`;
                } else if (presentRating > 4.6 && presentRating <= 5) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${fullstar}`;
                }
                // newResultArr.push(newObi);
                return newObi;
            });

            let user = req.user;
            let csrfToken = req.csrfToken();

            res.render(`resurse_${gensettings.template}`, {
                template:     `${gensettings.template}`,
                title:        "interne",
                user,
                logoimg:      `${gensettings.template}/${LOGO_IMG}`,
                csrfToken,
                resurse:      newResultArr,
                activeResLnk: true,
                resIdx:       RES_IDX_ES7,
                scripts,
                modules
            });
        }).catch((err) => {
            if (err) {
                console.log(JSON.stringify(err.body, null, 2));
                logger.error(err);
                next(err);
            }
        });
    } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
        // promiseResPub.then((result) => {
        resursePublice.then(function (result) {

            let fullstar = `<i class="bi bi-star-fill"></i>`,
                emptystart = `<i class="bi bi-star"></i>`,
                halfempty = `<i class="bi bi-star-half"></i>`;

            let newResultArr = result.map(function clbkMapResult (obi) {
                const newObi = Object.assign({}, obi._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
                // https://github.com/wycats/handlebars.js/blob/master/release-notes.md#v460---january-8th-2020
                newObi.dataRo = moment(obi.date).locale('ro').format('LLL');
                newObi.template = `${gensettings.template}`;
                newObi.logo = `${gensettings.template}/${LOGO_IMG}`;

                newObi.ratingrepresentation = '';
                let kontor = newObi.contorRating ?? 0;
                let lastRating = newObi.rating ?? 0;
                let ratingTotal = newObi.ratingTotal ?? 0;
                let presentRating = ratingTotal / kontor;

                // 0 - 0.5 | 0.5 - 1 | 1 - 1.5 | 1.5 - 2 | 2 - 2.5 | 2.5 - 3 | 3 - 3.5 | 3.5 - 4 | 4 - 4.5 | 4.5 - 5
                if (isNaN(presentRating)) {
                    newObi.ratingrepresentation = `${emptystart}${emptystart}${emptystart}${emptystart}${emptystart}`;
                } else if (presentRating > 0 && presentRating < 0.5) {
                    newObi.ratingrepresentation = `${halfempty}${emptystart}${emptystart}${emptystart}${emptystart}`;
                } else if (presentRating > 0.6 && presentRating <= 1) {
                    newObi.ratingrepresentation = `${fullstar}${emptystart}${emptystart}${emptystart}${emptystart}`;
                } else if (presentRating > 1 && presentRating <= 1.5) {
                    newObi.ratingrepresentation = `${fullstar}${halfempty}${emptystart}${emptystart}${emptystart}`;
                } else if (presentRating > 1.6 && presentRating <= 2) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${emptystart}${emptystart}${emptystart}`;
                } else if (presentRating > 2 && presentRating <= 2.5) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${halfempty}${emptystart}${emptystart}`;
                } else if (presentRating > 2.6 && presentRating <= 3) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${emptystart}${emptystart}`;
                } else if (presentRating > 3 && presentRating <= 3.5) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${halfempty}${emptystart}`;
                } else if (presentRating > 3.6 && presentRating <= 4) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${emptystart}`;
                } else if (presentRating > 4 && presentRating <= 4.5) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${halfempty}`;
                } else if (presentRating > 4.6 && presentRating <= 5) {
                    newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${fullstar}`;
                }                
                // newResultArr.push(newObi);
                return newObi;
            });

            res.render(`resurse_${gensettings.template}`, {
                template:     `${gensettings.template}`,
                title:        "interne",
                user:         req.user,
                logoimg:      `${gensettings.template}/${LOGO_IMG}`,
                csrfToken:    req.csrfToken(),                
                resurse:      newResultArr,
                activeResLnk: true,
                resIdx:       RES_IDX_ES7,
                scripts,
                modules
            });
        }).catch((err) => {
            if (err) {
                console.log(JSON.stringify(err.body, null, 2));
                logger.error(err);
                next(err);
            }
        });
    } else {
        res.redirect('/401');
    }
    // console.log(req.session.passport.user.roles); // { rolInCRED: [], unit: [], admin: true }
};

/* AFIȘAREA UNEI SINGURE RESURSE / ȘTERGERE / EDITARE :: /resurse/:id */
exports.loadOneResource = async function loadOneResource (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    let scripts = [
        // MOMENT.JS
        {script: `moment/min/moment-with-locales.min.js`},
        // HOLDER.JS
        // {script: `${gensettings.template}/lib/npm/holder.min.js`},
        // HELPER DETECT URLS or PATHS
        {script: `${gensettings.template}/js/check4url.js`},
        // DOWNLOADFILE
        {script: `${gensettings.template}/lib/downloadFile.js`},
        // STAR RATING
        {script: `${gensettings.template}/lib/jquery.star-rating-svg.js`}
    ];

    let modules = [
        // EDITOR.JS
        {module: `${gensettings.template}/lib/editorjs/editor.js`},
        {module: `${gensettings.template}/lib/editorjs/header.js`},
        {module: `${gensettings.template}/lib/editorjs/paragraph.js`},
        {module: `${gensettings.template}/lib/editorjs/checklist.js`},
        {module: `${gensettings.template}/lib/editorjs/list.js`},
        {module: `${gensettings.template}/lib/editorjs/image.js`},
        {module: `${gensettings.template}/lib/editorjs/embed.js`},
        {module: `${gensettings.template}/lib/editorjs/code.js`},
        {module: `${gensettings.template}/lib/editorjs/quote.js`},
        {module: `${gensettings.template}/lib/editorjs/inlinecode.js`},
        {module: `${gensettings.template}/lib/editorjs/table.js`},
        {module: `${gensettings.template}/lib/editorjs/attaches.js`},
        {module: `${gensettings.template}/lib/editorjs/ajax.js`},

        // MOTORUL FORM-ULUI
        {module: `${gensettings.template}/js/custom.js`},
        {module: `${gensettings.template}/js/uploader.mjs`},
        // LOCALE
        {module: `${gensettings.template}/js/cred-res.js`}           
    ];

    function renderRED (resursa) {
        if (resursa.id) {
            // transformă obiectul document de Mongoose într-un obiect normal.
            const obi = Object.assign({}, resursa._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is

            // obiectul competenței specifice cu toate datele sale trebuie curățat.
            obi.competenteS = obi.competenteS.map(obi => {
                return Object.assign({}, obi._doc);
            });

            // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client a întregii înregistrări serializate]
            obi.editorContent = JSON.stringify(resursa);

            // resursa._doc.content = editorJs2html(resursa.content);
            let localizat = moment(obi.date).locale('ro').format('LLL');
            obi.dataRo = `${localizat}`; // formatarea datei pentru limba română.            

            // Array-ul activităților modificat
            let activitatiRehashed = obi.activitati.map((elem) => {
                let sablon = /^([aA-zZ])+\d/g;
                let cssClass = elem[0].match(sablon);
                let composed = '<span class="' + cssClass[0] + 'data-code="' + elem[0] + '">' + elem[1] + '</span>';
                return composed;
            });
            
            obi.activitati = activitatiRehashed;

            let fullstar = `<i class="bi bi-star-fill"></i>`,
                emptystart = `<i class="bi bi-star"></i>`,
                halfempty = `<i class="bi bi-star-half"></i>`;

            obi.ratingrepresentation = '';
            let kontor = obi.contorRating ?? 0;
            let lastRating = obi.rating ?? 0;
            let ratingTotal = obi.ratingTotal ?? 0;
            let presentRating = ratingTotal / kontor;

            // 0 - 0.5 | 0.5 - 1 | 1 - 1.5 | 1.5 - 2 | 2 - 2.5 | 2.5 - 3 | 3 - 3.5 | 3.5 - 4 | 4 - 4.5 | 4.5 - 5
            if (isNaN(presentRating)) {
                obi.ratingrepresentation = `${emptystart}${emptystart}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 0 && presentRating < 0.5) {
                obi.ratingrepresentation = `${halfempty}${emptystart}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 0.6 && presentRating <= 1) {
                obi.ratingrepresentation = `${fullstar}${emptystart}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 1 && presentRating <= 1.5) {
                obi.ratingrepresentation = `${fullstar}${halfempty}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 1.6 && presentRating <= 2) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 2 && presentRating <= 2.5) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${halfempty}${emptystart}${emptystart}`;
            } else if (presentRating > 2.6 && presentRating <= 3) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${emptystart}${emptystart}`;
            } else if (presentRating > 3 && presentRating <= 3.5) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${halfempty}${emptystart}`;
            } else if (presentRating > 3.6 && presentRating <= 4) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${emptystart}`;
            } else if (presentRating > 4 && presentRating <= 4.5) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${halfempty}`;
            } else if (presentRating > 4.6 && presentRating <= 5) {
                obi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${fullstar}`;
            }

            let data = {
                uuid: obi.uuid,
                publisher: gensettings.publisher
            };            

            res.render(`resursa-interna_${gensettings.template}`, {   
                template: `${gensettings.template}`,             
                title:     obi.title,
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                resursa:   obi,
                data,
                scripts,
                modules                
            });
        }
    };

    Resursa.findById(req.params.id).populate({path: 'competenteS'})
            .then(renderRED).catch(err => {
                if (err) {
                    console.log(JSON.stringify(err.body, null, 2));
                    logger.error(err);
                    next(err);
                }
            });
};

/* Afișarea meniului de selecție pentru tipologia de resurse posibile */
exports.resourcesPool = async function resourcesPool (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);
    // pentru evitarea dependițelor din CDN-uri, se vor încărca dinamic scripturile necesare generării editorului
    let scripts = [
        // MOMENT.JS
        {script: `moment/min/moment-with-locales.min.js`},     
        // HELPER DETECT URLS or PATHS
        {script: `${gensettings.template}/js/check4url.js`}
    ];

    let modules = [
        // MOTORUL FORM-ULUI
        {module: `${gensettings.template}/js/custom.js`}      
    ];

    let styles = [
        // FONTAWESOME
        {style: `${gensettings.template}/lib/npm/all.min.css`},
        // JQUERY TOAST
        {style: `${gensettings.template}/lib/npm/jquery.toast.min.css`},
        // BOOTSTRAP
        {style: `${gensettings.template}/lib/npm/bootstrap.min.css`}
    ];

    let data = {
        publisher: gensettings.publisher
    };

    // roluri pe care un cont le poate avea în proiectul CRED.
    let roles = ["cred", "validator"]; //_ TODO: când vei permite tuturor să adauge resurse, introdu și `user`!!
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    // console.log(req.session.passport.user.roles.rolInCRED);

    /* === VERIFICAREA CREDENȚIALELOR === */
    if(req.session.passport.user.roles.admin){

        // Dacă avem un admin, atunci oferă acces neîngrădit
        res.render(`add-res_${gensettings.template}`, {
            template: `${gensettings.template}`,       
            title:   "Adauga",
            user:    req.user,
            logoimg: `${gensettings.template}/${LOGO_IMG}`,
            csrfToken: req.csrfToken(),
            styles,
            modules,
            scripts,
            data
        });
        // trimite informații despre user care sunt necesare formularului de încărcare pentru autocompletare
    } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere al resursei.

        res.render(`add-res_${gensettings.template}`, {   
            template: `${gensettings.template}`,         
            title:     "Adauga",
            user:      req.user,
            logoimg:   `${gensettings.template}/${LOGO_IMG}`,
            csrfToken: req.csrfToken(),
            styles,
            modules,
            scripts,
            data
        });
    } else {
        res.redirect('/401');
    }
};

/* FORM DESCRIERE RESURSE (ADAUGĂ) */
exports.describeRED = async function describeRED (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);
    // const cookieObj = cookieHelper.cock2obj(req.headers.cookie);
    // Unică sursă de identificator
    let uuid = crypto.randomUUID({disableEntropyCache : true});
    // console.log("Sesiunea de la /resurse/adaugă arată așa: ", req.session);
    // pentru evitarea dependințelor din CDN-uri, se vor încărca dinamic scripturile necesare generării editorului
    let scripts = [
        // DATATABLES
        {script: `datatables.net/js/jquery.dataTables.min.js`},
        {script: `datatables.net-dt/js/dataTables.dataTables.min.js`},
        {script: `datatables.net-select-dt/js/select.dataTables.min.js`},
        {script: `datatables.net-buttons-dt/js/buttons.dataTables.min.js`},
        {script: `datatables.net-responsive-dt/js/responsive.dataTables.min.js`},      
        // HELPER DETECT URLS or PATHS
        {script: `${gensettings.template}/js/check4url.js`},
        // CUSTOM
        {script: `${gensettings.template}/js/custom.js`}        
    ];

    let modules = [
        // EDITOR.JS
        {module: `${gensettings.template}/lib/editorjs/editor.js`},
        {module: `${gensettings.template}/lib/editorjs/header.js`},
        {module: `${gensettings.template}/lib/editorjs/paragraph.js`},
        {module: `${gensettings.template}/lib/editorjs/checklist.js`},
        {module: `${gensettings.template}/lib/editorjs/list.js`},
        {module: `${gensettings.template}/lib/editorjs/image.js`},
        {module: `${gensettings.template}/lib/editorjs/embed.js`},
        {module: `${gensettings.template}/lib/editorjs/code.js`},
        {module: `${gensettings.template}/lib/editorjs/quote.js`},
        {module: `${gensettings.template}/lib/editorjs/inlinecode.js`},
        {module: `${gensettings.template}/lib/editorjs/table.js`},
        {module: `${gensettings.template}/lib/editorjs/attaches.js`},
        {module: `${gensettings.template}/lib/editorjs/ajax.js`},

        // MOTORUL FORM-ULUI
        {module: `${gensettings.template}/js/custom.js`},
        {module: `${gensettings.template}/js/uploader.mjs`},
        {module: `${gensettings.template}/js/form01adres.mjs`}        
    ];

    let styles = [
        {style: `/datatables.net-dt/css/jquery.dataTables.min.css`},
        {style: `/datatables.net-buttons-dt/css/buttons.dataTables.min.css`},
        {style: `/datatables.net-responsive-dt/css/responsive.dataTables.min.css`},
        {style: `/datatables.net-select-dt/css/select.dataTables.min.css`}
    ];

    let data = {
        uuid: uuid,
        publisher: gensettings.publisher
    };

    // roluri pe care un cont le poate avea în proiectul CRED.
    let roles = ["user", "cred", "validator"]; // _REVIEW: când vei permite tuturor să adauge resurse, introdu și `user`!!
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    // console.log(req.session.passport.user.roles.rolInCRED);

    /* === VERIFICAREA CREDENȚIALELOR === */
    if(req.session.passport.user.roles.admin){
        let user = req.session.passport.user;

        let given_name =  '' || user.googleProfile?.given_name;
        let family_name = ''  || user.googleProfile?.family_name;
        
        /* === LIVRESQ CONNECTOR === */
        let url = new LivresqConnect().prepareProjectRequest(user.email, given_name, family_name);
        if(!url.startsWith("http")) url = "#";

        // Dacă avem un admin, atunci oferă acces neîngrădit
        res.render(`add-red_${gensettings.template}`, {   
            template: `${gensettings.template}`,      
            title:     "RED nou",
            user:      req.user,
            logoimg:   `${gensettings.template}/${LOGO_IMG}`,
            csrfToken: req.csrfToken(),
            styles,
            modules,
            scripts,
            data,
            livresqProjectRequest: url /* === LIVRESQ CONNECTOR === */
        });
        // trimite informații despre user care sunt necesare formularului de încărcare pentru autocompletare
    } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
        
        let user = req.session.passport.user;
        let given_name = '' || user.googleProfile?.given_name;
        let family_name = '' || user.googleProfile?.family_name;
        
        /* === LIVRESQ CONNECTOR === */
        let url = new LivresqConnect().prepareProjectRequest(user.email, given_name, family_name);
        if(!url.startsWith("http")) url = "#";

        // res.render('adauga-res', {            
        //     title:     "Adauga",
        res.render(`add-red_${gensettings.template}`, {
            template: `${gensettings.template}`,     
            title:     "RED nou",
            user:      req.user,
            logoimg:   `${gensettings.template}/${LOGO_IMG}`,
            csrfToken: req.csrfToken(),
            styles,
            modules,
            scripts,
            data,
            livresqProjectRequest: url /* === LIVRESQ CONNECTOR === */
        });
    } else {
        res.redirect('/errors/403');
    }
};

/* FORM DESCRIERE MONOGRAFII */
exports.describeBFMonograph = async function describeBFMonograph (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);
    const cookieObj = cookieHelper.cock2obj(req.headers.cookie);
    // Unică sursă de identificator
    let uuid = crypto.randomUUID({disableEntropyCache : true});
    // console.log("Sesiunea de la /resurse/adaugă arată așa: ", req.session);
    // pentru evitarea dependițelor din CDN-uri, se vor încărca dinamic scripturile necesare generării editorului
    let scripts = [
        // MOMENT.JS
        {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`}, 
        // FONTAWESOME
        {script: `${gensettings.template}/lib/npm/all.min.js`},
        // Bootstrap 4
        {script: `${gensettings.template}/lib/npm/bootstrap.bundle.min.js`},
        // Datatables
        {script: `${gensettings.template}/lib/npm/jquery.dataTables.min.js`},
        {script: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.js`},
        {script: `${gensettings.template}/lib/npm/dataTables.select.min.js`},
        {script: `${gensettings.template}/lib/npm/dataTables.buttons.min.js`},
        {script: `${gensettings.template}/lib/npm/dataTables.responsive.min.js`},        
        // HELPER DETECT URLS or PATHS
        {script: `${gensettings.template}/js/check4url.js`}
    ];

    let modules = [
        // EDITOR.JS
        {module: `${gensettings.template}/lib/editorjs/editor.js`},
        {module: `${gensettings.template}/lib/editorjs/header.js`},
        {module: `${gensettings.template}/lib/editorjs/paragraph.js`},
        {module: `${gensettings.template}/lib/editorjs/checklist.js`},
        {module: `${gensettings.template}/lib/editorjs/list.js`},
        {module: `${gensettings.template}/lib/editorjs/image.js`},
        {module: `${gensettings.template}/lib/editorjs/embed.js`},
        {module: `${gensettings.template}/lib/editorjs/code.js`},
        {module: `${gensettings.template}/lib/editorjs/quote.js`},
        {module: `${gensettings.template}/lib/editorjs/inlinecode.js`},
        {module: `${gensettings.template}/lib/editorjs/table.js`},
        {module: `${gensettings.template}/lib/editorjs/attaches.js`},
        {module: `${gensettings.template}/lib/editorjs/ajax.js`},

        // MOTORUL FORM-ULUI
        {module: `${gensettings.template}/js/custom.js`},
        {module: `${gensettings.template}/js/uploader.mjs`},
        {module: `${gensettings.template}/js/form02admonograph.mjs`}        
    ];

    let styles = [
        // FONTAWESOME
        {style: `${gensettings.template}/lib/npm/all.min.css`},
        // JQUERY TOAST
        {style: `${gensettings.template}/lib/npm/jquery.toast.min.css`},
        // BOOTSTRAP
        {style: `${gensettings.template}/lib/npm/bootstrap.min.css`},
        // DATATABLES
        {style: `${gensettings.template}/lib/npm/jquery.dataTables.min.css`},
        {style: `${gensettings.template}/lib/npm/buttons.dataTables.min.css`},
        {style: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.css`},
        {style: `${gensettings.template}/lib/npm/responsive.dataTables.min.css`},
        {style: `${gensettings.template}/lib/npm/select.dataTables.min.css`}
    ];

    let data = {
        uuid: uuid,
        publisher: gensettings.publisher
    };

    // roluri pe care un utilizator le poate folosi pentru a încărca monografii
    let roles = ["cred", "validator", "user"]; //- TODO: când vei permite tuturor să adauge resurse, introdu și `user`!!
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    // console.log(req.session.passport.user.roles.rolInCRED);

    /* === VERIFICAREA CREDENȚIALELOR === */
    if(req.session.passport.user.roles.admin){
        let user = req.session.passport.user;

        let given_name =  "" || user.googleProfile?.given_name;
        let family_name = ""  || user.googleProfile?.family_name;

        // Dacă avem un admin, atunci oferă acces neîngrădit
        res.render(`add-bf-monograph_${gensettings.template}`, {            
            template: `${gensettings.template}`,
            title:   "Monografie",
            user:    req.user,
            logoimg:   `${gensettings.template}/${LOGO_IMG}`,
            csrfToken: req.csrfToken(),
            styles,
            modules,
            scripts,
            data
        });
        // trimite informații despre user care sunt necesare formularului de încărcare pentru autocompletare
    } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere al resursei.
        
        let user = req.session.passport.user;

        let given_name = '' || user.googleProfile?.given_name;
        let family_name = '' || user.googleProfile?.family_name;

        res.render(`add-bf-monograph_${gensettings.template}`, {
            template: `${gensettings.template}`,        
            title:     "Carte",
            user:      req.user,
            logoimg:   `${gensettings.template}/${LOGO_IMG}`,
            csrfToken: req.csrfToken(),
            styles,
            modules,
            scripts,
            data
        });
    } else {
        res.redirect('/errors/403');
    }
};

/* ÎNCĂRCAREA RESURSELOR (inactiv) */
exports.uploadResource = function uploadResource (req, res, next) {
    let roles = ["user", "educred", "validator"];

    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    if (Object.keys(req.files).length == 0) {
        return res.status(400).send('Nu s-a încărcat nimic.');
    }

    /* === VERIFICAREA CREDENȚIALELOR === */
    if(req.session.passport.user.roles.admin){
        // Dacă avem un admin, atunci oferă acces neîngrădit
        // putFilesInBag(req.files, req.body);
        let data = [];
        req.files.forEach((imagine) => {
            // console.log(Object.keys(imagine[key]));
            let img = req.files.imagine[key];
            img.mv('./repo/' + img.name);

            data.push({
                name: img.name,
                mimetype: img.mimetype,
                size: img.size
            });
        });
        res.send({
            status: true,
            message: 'Files are uploaded',
            data: data
        });

    } else if (confirmedRoles.length > 0) {
        // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.

    } else {
        res.redirect('/errors/403');
    }
};