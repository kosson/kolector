var express      = require('express');
var router       = express.Router();
const mongoose   = require('mongoose');
const moment     = require('moment');
var content2html = require('./controllers/editorJs2HTML');
const Log        = require('../models/logentry'); // Adu modelul unei înregistrări de jurnal

// === VERIFICAREA ROLURILOR ===
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
                const newObi = Object.assign({}, obi._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
                // https://github.com/wycats/handlebars.js/blob/master/release-notes.md#v460---january-8th-2020
                newObi.dataRo = moment(newObi.date).locale('ro').format('LLL');
                newObi.content = content2html(obi.content);
                newResultArr.push(newObi);
            });

            let scripts = [
                // FA
                {script: '/lib/npm/all.min.js'},
                // MOMENT.JS
                {script: '/lib/npm/moment-with-locales.min.js'},
                // JQUERY
                {script: '/lib/npm/jquery.slim.min.js'},                
                // BOOTSTRAP
                {script: '/lib/npm/bootstrap.bundle.min.js'},
                // HOLDERJS
                {script: '/lib/npm/holder.min.js'}       
            ];

            let modules = [
                // {module: '/js/main.mjs'},
                // LOCAL
                // {module: '/js/form02log.js'} 
            ];

            let styles = [
                // FONTAWESOME
                {style: '/lib/npm/all.min.css'},
                // JQUERY TOAST
                {style: '/lib/npm/jquery.toast.min.css'},
                // BOOTSTRAP
                {style: '/lib/npm/bootstrap.min.css'},
            ];
            
            res.render('logentry', {
                title:      "Noutăți",
                user:       req.user,
                logoimg:    "/img/red-logo-small30.png",
                credlogo:   "../img/CREDlogo.jpg",
                csrfToken:  req.csrfToken(),
                logentries: newResultArr,
                scripts,
                styles,
                modules 
            });
        }).catch((err) => {
            console.error(err);
            next(err);
        });
    } else {
        res.redirect('/401');
    }
});

// Jurnalier - introducere articol
router.get('/new', function (req, res) {
    let scripts = [
        // FA
        {script: '/lib/npm/all.min.js'},
        // MOMENT.JS
        {script: '/lib/npm/moment-with-locales.min.js'},
        // JQUERY
        {script: '/lib/npm/jquery.slim.min.js'},                
        // BOOTSTRAP
        {script: '/lib/npm/bootstrap.bundle.min.js'},
        // HOLDERJS
        {script: '/lib/npm/holder.min.js'}   
    ];

    let modules = [
        // EDITOR.JS
        {module: '/lib/editorjs/editor.js'},
        {module: '/lib/editorjs/header.js'},
        {module: '/lib/editorjs/paragraph.js'},
        {module: '/lib/editorjs/checklist.js'},
        {module: '/lib/editorjs/list.js'},
        {module: '/lib/editorjs/image.js'},
        {module: '/lib/editorjs/embed.js'},
        {module: '/lib/editorjs/code.js'},
        {module: '/lib/editorjs/quote.js'},
        {module: '/lib/editorjs/inlinecode.js'},
        {module: '/lib/editorjs/table.js'},
        {module: '/lib/editorjs/attaches.js'},
        {module: '/lib/editorjs/ajax.js'},
        // LOCAL
        {module: '/js/uploader.mjs'},
        {module: '/js/form02log.js'} 
    ];

    let styles = [
        // FONTAWESOME
        {style: '/lib/npm/all.min.css'},
        // JQUERY TOAST
        {style: '/lib/npm/jquery.toast.min.css'},
        // BOOTSTRAP
        {style: '/lib/npm/bootstrap.min.css'},
    ];

    /* === VERIFICAREA CREDENȚIALELOR === */
    if(req.session.passport.user.roles.admin){
        // Dacă avem un admin, atunci oferă acces neîngrădit
        res.render('logentry-form', {
            title:     "Adaugă în log",
            user:      req.user,
            logoimg:   "/img/red-logo-small30.png",
            credlogo:  "../img/CREDlogo.jpg",
            csrfToken: req.csrfToken(),
            scripts,
            modules,
            styles
        });
    } else {
        res.redirect('/401');
    }
});

module.exports = router;