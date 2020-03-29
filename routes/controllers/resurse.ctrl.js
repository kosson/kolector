/* ==== DEPENDINȚE ==== */
const moment = require('moment');

/* ==== MODELE ==== */
const Resursa = require('../../models/resursa-red'); // Adu modelul resursei

/* ==== HELPERE  ==== */
// Cere helperul `checkRole` cu care verifică dacă există rolurile necesare accesului
let checkRole     = require('./checkRole.helper');
let editorJs2html = require('./editorJs2HTML');

/* AFIȘAREA RESURSELOR */
exports.loadRootResources = function loadRootResources (req, res, next) {
    // ACL
    let roles = ["user", "validator"];
    
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    // Adu-mi ultimele 8 resursele validate în ordinea ultimei intrări, te rog! Hey, hey, Mr. Serverman!
    let resursePublice = Resursa.find({'expertCheck': 'true'}).sort({"date": -1}).limit(8);
    let promiseResPub  = resursePublice.exec();

    // SCRIPTURI
    let scripts = [       
        {script: '/lib/moment/min/moment.min.js'}
    ];
    
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    if(req.session.passport.user.roles.admin){
        promiseResPub.then((result) => {
            let newResultArr = []; // noul array al obiectelor resursă
            result.map(function clbkMapResult (obi) {
                obi.dataRo = moment(obi.date).locale('ro').format('LLL');
                newResultArr.push(obi);
            });
            res.render('resurse', {
                title:   "CRED RED-uri",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                logoimg: "img/rED-logo192.png",
                user:    req.user,
                resurse: newResultArr,
                activeResLnk: true,
                scripts
            });
        }).catch((err) => {
            if (err) {
                console.log(err);
            }
        });
    } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
        promiseResPub.then((result) => {
            let newResultArr = []; // noul array al obiectelor resursă
            result.map(function clbkMapResult (obi) {
                obi.dataRo = moment(obi.date).locale('ro').format('LLL');
                newResultArr.push(obi);
            });
            res.render('resurse', {
                title:   "Resurse publice",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                logoimg: "img/rED-logo192.png",
                user:    req.user,
                resurse: newResultArr,
                scripts
            });
        }).catch((err) => {
            if (err) {
                console.log(err);
            }
        });
    } else {
        res.redirect('/401');
    }
    // console.log(req.session.passport.user.roles); // { rolInCRED: [], unit: [], admin: true }
};

/* AFIȘAREA UNEI SINGURE RESURSE / ȘTERGERE / EDITARE */
exports.loadOneResource = function loadOneResource (req, res, next) {
    // console.log(req.params);
    // var record = require('./resincredid.ctrl')(req.params); // aduce resursa și transformă conținutul din JSON în HTML
    Resursa.findById(req.params.id).populate({
            path: 'competenteS'
        }).exec().then( (resursa) => {
            if (resursa) {
                resursa.content = editorJs2html(resursa.content);
                let localizat   = moment(resursa.date).locale('ro').format('LLL');
                resursa.dataRo  = `${localizat}`; // formatarea datei pentru limba română.
            } else {
                console.log(`Nu a putut fi adusă resursa!`);
                pubcomm.emit('mesaje', `Nu am putut aduce resursa!`);
            }
            return resursa;
        }).then(result => {
            let scripts = [
                {script: '/lib/moment/min/moment.min.js'}      
            ];
            res.render('resursa-cred', {
                user:    req.user,
                title:   "RED in CRED",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                logoimg: "/img/red-logo-small30.png",
                credlogo: "../img/CREDlogo.jpg",
                resursa: result,
                scripts
            });
        }).catch(err => {
            if (err) {
                console.log(err);
            }
        });
};

/* FORM DESCRIERE RESURSE (ADAUGĂ) */
exports.describeResource = function describeResource (req, res, next) {
    // pentru evitarea dependițelor din CDN-uri, se vor încărca dinamic scripturile necesare generării editorului
    let scripts = [
        // EDITOR
        {script: '/lib/editorjs/editor.js'},
        {script: '/lib/editorjs/header.js'},
        {script: '/lib/editorjs/paragraph.js'},
        {script: '/lib/editorjs/list.js'},
        {script: '/lib/editorjs/image.js'},
        {script: '/lib/editorjs/table.js'},
        {script: '/lib/editorjs/attaches.js'},
        {script: '/lib/editorjs/embed.js'},
        {script: '/lib/editorjs/code.js'},
        {script: '/lib/editorjs/quote.js'},
        {script: '/lib/editorjs/inlinecode.js'},
        // FORM
        {script: '/js/form01adres.js'}
    ];
    // roluri pe care un cont le poate avea în proiectul CRED.
    let roles = ["user", "cred", "validator"];
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    // console.log(req.session.passport.user.roles.rolInCRED);

    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    if(req.session.passport.user.roles.admin){
        // Dacă avem un admin, atunci oferă acces neîngrădit
        res.render('adauga-res', {
            user:    req.user,
            title:   "Adauga",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/rED-logo192.png",
            credlogo:"/img/CREDlogo.jpg",
            scripts
        });
        // trimite informații despre user care sunt necesare formularului de încărcare pentru autocompletare
    } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere al resursei.
        res.render('adauga-res', {
            user:    req.user,
            title:   "Adauga",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/rED-logo192.png",
            credlogo:"/img/CREDlogo.jpg",
            scripts
        });
    } else {
        res.redirect('/401');
    }
};

/* ÎNCĂRCAREA RESURSELOR */
exports.uploadResource = function uploadResource (req, res, next) {
    let roles = ["user", "educred", "validator"];

    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    if (Object.keys(req.files).length == 0) {
        return res.status(400).send('No files were uploaded.');
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
        res.redirect('/401');
    }
};