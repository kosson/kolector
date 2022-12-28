require('dotenv').config();
const config = require('config');

/* === DEPENDINȚE === */
const crypto       = require('crypto');
const logger       = require('../../util/logger');

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


// CONFIG - ASSETS
let vendor_editor_js = config.get('vendor.editorjs.js'),                // Adu-mi EDITOR.JS (sursa ca modul)
    vendor_editor_js_plugins = config.get('vendor.editorjs.plugins'),   // Adu-mi pluginurile Editor.js (sursele js ca module)
    vendor_datatables_js = config.get('vendor.datatables.js'),          // Adu-mi DATATABLES (sursele js)
    vendor_datatables_css = config.get('vendor.datatables.css');        // Adu-mi DATATABLES (sursele css)

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

    let scripts = [       
        vendor_moment_js,
        // HOLDERJS
        {script: `holderjs/holder.min.js`}
    ];
    let modules = [
        // LOCALE
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
        vendor_moment_js,
        {script: `${gensettings.template}/js/check4url.js`},
        // DOWNLOADFILE
        {script: `${gensettings.template}/lib/downloadFile.js`},
        // STAR RATING
        {script: `${gensettings.template}/lib/jquery.star-rating-svg.js`}
    ];

    let modules = [
        ...vendor_editor_js, ...vendor_editor_js_plugins,
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
        vendor_moment_js,     
        // HELPER DETECT URLS or PATHS
        {script: `${gensettings.template}/js/check4url.js`}
    ];

    let modules = [
        // MOTORUL FORM-ULUI
        {module: `${gensettings.template}/js/custom.js`}      
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
        // HELPER DETECT URLS or PATHS
        {script: `${gensettings.template}/js/check4url.js`},
        // CUSTOM
        {script: `${gensettings.template}/js/custom.js`}        
    ];
    let modules = [
        ...vendor_editor_js, ...vendor_editor_js_plugins,
        // MOTORUL FORM-ULUI
        {module: `${gensettings.template}/js/uploader.mjs`},
        {module: `${gensettings.template}/js/form01adres.mjs`}        
    ];

    let styles = [];

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
            data
        });
        // trimite informații despre user care sunt necesare formularului de încărcare pentru autocompletare
    } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
        
        let user = req.session.passport.user;
        let given_name = '' || user.googleProfile?.given_name;
        let family_name = '' || user.googleProfile?.family_name;
        
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
            data
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
        vendor_moment_js, ...vendor_datatables_js,      
        // HELPER DETECT URLS or PATHS
        {script: `${gensettings.template}/js/check4url.js`}
    ];

    let modules = [
        ...vendor_editor_js, ...vendor_editor_js_plugins,
        // MOTORUL FORM-ULUI
        {module: `${gensettings.template}/js/uploader.mjs`},
        {module: `${gensettings.template}/js/form02admonograph.mjs`}        
    ];

    let styles = [...vendor_datatables_css];

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