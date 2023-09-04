require('dotenv').config();
const config = require('config');

/* === DEPENDINȚE === */
const crypto      = require('crypto');
const logger      = require('../../util/logger');
const calcAverageRating = require('../../util/rating'); // încarcă funcția de rating pentru resursă

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
    logger.info(JSON.stringify(val));
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

/* === AFIȘAREA TUTUROR RESURSELOR VALIDATE :: /exposed (expuse intern în sistem) === */
exports.exposed = async function exposed (req, res, next) {
    try {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);
        //  ACL
        let roles = ["user", "validator", "cred"];
        // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
        let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles); 

        // Adu-mi ultimele 9 resursele validate în ordinea ultimei intrări. Resursele trebuie validate într-o procedură de examinare. 
        // Creatorul trimite id-urile resurselor celui care le va valida. Dacă nu sunt validate, nu vor apărea altcuiva decât adminilor și creatorului.
        let resursePublice = Resursa.find({'expertCheck': 'true'}).sort({"date": -1}).limit(9).lean();
        let dataArray = await resursePublice; // datele celor nouă înregistrări aduse din bază

        let scripts = [];
        let modules = [
            // LOCALE
            {module: `${gensettings.template}/js/redincredallcursor.mjs`},
            {module: `${gensettings.template}/js/resources-exposed.mjs`}
        ];
        let styles = [
            {style: `${gensettings.template}/css/resource_unit_exposed.css`},
            {style: `${gensettings.template}/css/rating.css`}
        ];
        
        /* ===> VERIFICAREA CREDENȚIALELOR <=== */
        if(req.session.passport.user.roles.admin){
            let fullstar = `<i class="bi bi-star-fill"></i>`,
                emptystart = `<i class="bi bi-star"></i>`,
                halfempty = `<i class="bi bi-star-half"></i>`;

            // înjectează proprietăți utile clientului în obiectul existent pentru a realiza UX și comportament când datele sunt la dispoziția sa
            let newDataArray = dataArray.map(function clbkMapResult (obi) {
                obi['template'] = `${gensettings.template}`;
                obi['logo'] = `${gensettings.template}/${LOGO_IMG}`;
                
                // pentru fiecare resursă, fă calculul rating-ului de cinci stele și trimite o valoare în client
                if (obi?.metrics?.fiveStars) {
                    // console.log(`Datele găsite sunt: ${obi.metrics.fiveStars}, de tipul ${Array.isArray(obi.metrics.fiveStars)}`);
                    obi['rating5stars'] = calcAverageRating(obi.metrics.fiveStars.map(n => Number(n)), config?.metrics?.values4levels);
                } else if (obi?.metrics?.fiveStars === undefined || obi.metrics.fiveStars.reduce((v) => v += v) === 0) {
                    // în cazul în care nu există propritățile în obiect sau array-ul are numai zero, crează un array de inițializare cu toate valorile la zero
                    obi['rating5stars'] = 0;
                    // completează înregistrarea cu valori goale în array
                }
                return obi;
            });

            res.render(`resources_exposed_${gensettings.template}`, {
                template:     `${gensettings.template}`,
                title:        "validated",
                user:         req.user,
                logoimg:      `${gensettings.template}/${LOGO_IMG}`,
                csrfToken:    req.csrfToken(),
                resurse:      newDataArray,
                activeResLnk: true,
                resIdx:       RES_IDX_ES7,
                styles,
                scripts,
                modules,
            });
        } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
            // înjectează proprietăți utile clientului în obiectul existent pentru a realiza UX și comportament când datele sunt la dispoziția sa
            let newDataArray = dataArray.map(function clbkMapResult (obi) {
                obi['template'] = `${gensettings.template}`;
                obi['logo'] = `${gensettings.template}/${LOGO_IMG}`;
                
                // pentru fiecare resursă, fă calculul rating-ului de cinci stele și trimite o valoare în client
                if (obi?.metrics?.fiveStars) {
                    // console.log(`Datele găsite sunt: ${obi.metrics.fiveStars}, de tipul ${Array.isArray(obi.metrics.fiveStars)}`);
                    obi['rating5stars'] = calcAverageRating(obi.metrics.fiveStars.map(n => Number(n)), config?.metrics?.values4levels);
                } else if (obi?.metrics?.fiveStars === undefined || obi.metrics.fiveStars.reduce((v) => v += v) === 0) {
                    // în cazul în care nu există propritățile în obiect sau array-ul are numai zero, crează un array de inițializare cu toate valorile la zero
                    obi['rating5stars'] = 0;
                    // completează înregistrarea cu valori goale în array
                }
                return obi;
            });

            res.render(`resources_exposed_${gensettings.template}`, {
                template:     `${gensettings.template}`,
                title:        "validated",
                user:         req.user,
                logoimg:      `${gensettings.template}/${LOGO_IMG}`,
                csrfToken:    req.csrfToken(),
                resurse:      newDataArray,
                activeResLnk: true,
                resIdx:       RES_IDX_ES7,
                styles,
                scripts,
                modules,
            });
        } else {
            res.redirect('/401');
        }
        // console.log(req.session.passport.user.roles); // { rolInCRED: [], unit: [], admin: true }
    } catch (error) {
        logger.error(error);
        next(error);
    }
};
/* AFIȘAREA UNEI SINGURE RESURSE / ȘTERGERE / EDITARE :: /resurse/:id */
exports.loadOneResource = async function loadOneResource (req, res, next) {
    try {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);

        let scripts = [
            // vendor_moment_js,
            {script: `${gensettings.template}/js/check4url.js`},
            // DOWNLOADFILE
            {script: `${gensettings.template}/lib/downloadFile.js`}
        ];

        let modules = [
            ...vendor_editor_js, ...vendor_editor_js_plugins,
            {module: `${gensettings.template}/js/uploader.mjs`},
            // LOCALE
            {module: `${gensettings.template}/js/resource-internal.js`}           
        ];

        let styles = [
            {style: `${gensettings.template}/css/rating.css`}
        ];

        function renderRED (obi) {
            // creează din `resursa` un alt POJO
            // const obi = Object.assign({}, resursa);
            console.log(`Obiectul primit este`, obi);

            obi['template'] = `${gensettings.template}`;
            obi['logo'] = `${gensettings.template}/${LOGO_IMG}`;
            
            // pentru fiecare resursă, fă calculul rating-ului de cinci stele și trimite o valoare în client
            if (obi?.metrics?.fiveStars) {
                // console.log(`Datele găsite sunt: ${obi.metrics.fiveStars}, de tipul ${Array.isArray(obi.metrics.fiveStars)}`);
                obi['rating5stars'] = calcAverageRating(obi.metrics.fiveStars.map(n => Number(n)), config.metrics.values4levels);
            }

            // obiectul competenței specifice cu toate datele sale trebuie curățat.
            // obi.competenteS = obi.competenteS.map(obi => {
            //     return Object.assign({}, obi);
            // });

            // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client a întregii înregistrări serializate]
            obi.editorContent = JSON.stringify(resursa);

            // resursa._doc.content = editorJs2html(resursa.content);       

            // Array-ul activităților modificat
            let activitatiRehashed = obi.activitati.map((elem) => {
                let sablon = /^([aA-zZ])+\d/g;
                let cssClass = elem[0].match(sablon);
                let composed = '<span class="' + cssClass[0] + 'data-code="' + elem[0] + '">' + elem[1] + '</span>';
                return composed;
            });
            
            obi.activitati = activitatiRehashed;

            let data = {
                uuid: obi.uuid,
                publisher: gensettings.publisher
            };            

            return res.render(`resource-internal_${gensettings.template}`, {   
                template: `${gensettings.template}`,             
                title:     obi.title,
                user:      req.user,
                logoimg:      `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                resursa:   obi,
                data,
                scripts,
                modules,
                styles
            });
        };

        let resursa = await Resursa.findById(req.params.id).populate({path: 'competenteS'}).lean();

        //  ACL
        let roles = ["user", "validator", "cred"];
        // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
        let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles); 


        renderRED(resursa);

        // verifică ca userului să-i fie randată versiunea proprie.
        // if (resursa || confirmedRoles.length > 0) {
        //     renderRED(resursa);
        // } else if (resursa) {
        //     renderRED(resursa);
        //     // logger.error(`Resursa ${req.params.id} nu mai există.`);
        // }
    } catch (error) {
        if (error) {
            // console.log(JSON.stringify(err.body, null, 2));
            logger.error(error);
            next(error);
        }       
    }
};

/* Afișarea meniului de selecție pentru tipologia de resurse posibile */
exports.resourcesPool = async function resourcesPool (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);
    // pentru evitarea dependițelor din CDN-uri, se vor încărca dinamic scripturile necesare generării editorului
    let scripts = [   
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