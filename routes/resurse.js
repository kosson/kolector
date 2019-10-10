// const express = require('express');
// const router  = express.Router();

// const multer  = require('multer');
// var upload    = multer({ dest: 'repo/' });
// var BagIt     = require('bagit-fs');
// const fileUpload = require('express-fileupload');
// const app = express();

// // default options
// app.use(fileUpload({
//     createParentPath: true
// }));

module.exports = function (router) {

    // ========== RESURSE PUBLICE ==========
    /* ========== GET */
    router.get('/resursepublice', function (req, res) {
        res.render('resursepublice', {
            title: "R.E.D.",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "img/rED-logo192.png",
        });
    });

    // ========== RESURSE ==========
    let checkRole = require('./controllers/checkRole.helper');

    /* ========== GET */
    // Cere helperul `checkRole` cu care verifică dacă există rolurile necesare accesului
    router.get('/', function (req, res) {
        // ACL
        let roles = ["user"];   //FIXME: DREPTURI ACL hardcodate. Constituie ceva centralizat!!!
        // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
        let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
        
        /* ====== VERIFICAREA CREDENȚIALELOR ====== */
        if(req.session.passport.user.roles.admin){
            // Dacă avem un admin, atunci oferă acces neîngrădit
            res.render('resurse', {
                user:    req.user,
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                title:   "Resurse",
                logoimg: "/img/rED-logo192.png",
            });
        } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
            res.render('resurse', {
                user:    req.user,
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                title:   "Resurse",
                logoimg: "/img/rED-logo192.png",
            });
        } else {
            res.redirect('/401');
        }
        // console.log(req.session.passport.user.roles); // { rolInCRED: [], unit: [], admin: true }
    });

    /* ========== GET - Pe această rută se obține formularul de adăugare a resurselor doar dacă ești logat, având rolurile menționate */
    // Cere helperul `checkRole`
    router.get('/adauga', function (req, res) {
        // pentru evitarea dependițelor din CDN-uri, se vor încărca dinamic scripturile necesare generării editorului
        let scripts = [
            {script: '/lib/editorjs/editor.js'},
            {script: '/lib/editorjs/header.js'},
            {script: '/lib/editorjs/paragraph.js'},
            {script: '/lib/editorjs/list.js'},
            {script: '/lib/editorjs/image.js'},
            {script: '/lib/editorjs/table.js'},
            {script: '/lib/editorjs/attaches.js'},
            {script: '/lib/editorjs/embed.js'},
            {script: '/lib/editorjs/code.js'},
            {script: '/lib/editorjs/inlinecode.js'},
            {script: '/js/form01adres.js'}         
        ];
        let roles = ["user", "educred", "validator"];
        let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

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
        } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
            res.render('adauga-res', {
                title: "Adauga",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                logoimg: "/img/rED-logo192.png",
                credlogo:"/img/CREDlogo.jpg",
                scripts
            });
        } else {
            res.redirect('/401');
        }
    });

    /*======== POST RUTĂ DE ÎNCĂRCARE FIȘIERE ========== */
    // router.post('upload', function (req, res, next) {
        
    //     let roles = ["user", "educred", "validator"];
    //     let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    //     if (Object.keys(req.files).length == 0) {
    //         return res.status(400).send('No files were uploaded.');
    //     }

    //     /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    //     if(req.session.passport.user.roles.admin){
    //         // Dacă avem un admin, atunci oferă acces neîngrădit
    //         // putFilesInBag(req.files, req.body);
    //         let data = [];
    //         req.files.forEach((imagine) => {
    //             // console.log(Object.keys(imagine[key]));
    //             let img = req.files.imagine[key];
    //             img.mv('./repo/' + img.name);

    //             data.push({
    //                 name: img.name,
    //                 mimetype: img.mimetype,
    //                 size: img.size
    //             });
    //         });
    //         res.send({
    //             status: true,
    //             message: 'Files are uploaded',
    //             data: data
    //         });

    //     } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.

    //     } else {
    //         res.redirect('/401');
    //     }
    // });

    // router.get('/resurse/:id', function (req, res) {
    //     res.render('resursa', {
    //         title: "Resursa",
    //         logoimg: "/img/rED-logo192.png",
    //     });
    // });

    // un middleware specific acestei miniaplicații de routare
    // router.use(function timeLog (req, res, next) {
    //     console.log('Time: ', Date.now());
    //     next();
    // });

    return router;
};