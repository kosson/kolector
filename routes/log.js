var express      = require('express');
var router       = express.Router();
const mongoose   = require('mongoose');
const moment     = require('moment');
var content2html = require('./controllers/editorJs2HTML');
const Log        = require('../models/logentry'); // Adu modelul unei înregistrări de jurnal

// ========== VERIFICAREA ROLURILOR ==========
let checkRole = require('./controllers/checkRole.helper');

router.get('/', function clbkLog (req, res, next) {
    // Setare hardcodată de ACL
    let roles = ["user", "cred"];
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    let loguriPublice = Log.find().sort({"date": -1}).limit(10); // doar ultimele zece anunțuri.
    let promiseLogPub = loguriPublice.exec();

    if (confirmedRoles.length > 0) {
        promiseLogPub.then((entries) => {
            let newResultArr = []; // noul array al obiectelor resursă

            entries.map(function clbkLogAdd (obi) {
                const newObi = Object.assign({}, obi); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
                // https://github.com/wycats/handlebars.js/blob/master/release-notes.md#v460---january-8th-2020
                newObi.dataRo = moment(newObi.date).locale('ro').format('LLL');
                newObi.content = content2html(obi.content);
                newResultArr.push(newObi);
            });

            let scripts = [     
                {script: '/lib/moment/min/moment.min.js'}        
            ];
            res.render('logentry', {
                user:    req.user,
                scripts,
                title:   "Noutăți",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                logoimg: "/img/red-logo-small30.png",
                credlogo: "../img/CREDlogo.jpg",
                csfrToken: req.csrfToken(),
                user:    req.user,
                logentries: newResultArr
            });
        }).catch((err) => {
            if (err) throw err;
        });
    } else {
        res.redirect('/401');
    }
});

// Jurnalier - introducere articol
router.get('/new', function (req, res) {
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
        {script: '/lib/editorjs/inlinecode.js'}
    ];

    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    if(req.session.passport.user.roles.admin){
        // Dacă avem un admin, atunci oferă acces neîngrădit
        res.render('logentry-form', {
            user:    req.user,
            title:   "Adaugă în log",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            csfrToken: req.csrfToken(),
            scripts
        });
    } else {
        res.redirect('/401');
    }
});

module.exports = router;