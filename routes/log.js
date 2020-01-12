var express = require('express');
var router  = express.Router();
var Log     = require('../models/logentry');
var content2html = require('./controllers/editorJs2HTML');

// ========== VERIFICAREA ROLURILOR ==========
let checkRole = require('./controllers/checkRole.helper');

router.get('/', function (req, res, next) {
    // Setare hardcodată de ACL
    let roles = ["user", "cred"];
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    let loguriPublice = Log.find().sort({"date": -1}).limit(10);
    let promiseLogPub = loguriPublice.exec();

    if (confirmedRoles.length > 0) {
        promiseLogPub.then((entries) => {
            entries.map(entry => {
                entry.content = content2html(entry.content);
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
                logentries: entries
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
            scripts
        });
    } else {
        res.redirect('/401');
    }
});

module.exports = router;