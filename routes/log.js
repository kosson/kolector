const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const moment     = require('moment');
const logger     = require('../util/logger');
var content2html = require('./controllers/editorJs2HTML');
const Log        = require('../models/logentry');               // Adu modelul unei înregistrări de jurnal
const Mgmtgeneral = require('../models/MANAGEMENT/general');    // Adu modelul management

// CONSTANTE
const LOGO_IMG = "img/" + process.env.LOGO;

// === VERIFICAREA ROLURILOR ===
let checkRole = require('./controllers/checkRole.helper');

// Jurnalier - toate intrările
async function logRoot (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    // Setare hardcodată de ACL
    let roles = ["user", "cred"];
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    let loguriPublice = Log.find().sort({"date": -1}).limit(10); // Hardcodare loguri: doar ultimele zece anunțuri.
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

            // console.log(newResultArr[0]);

            let scripts = [
                // FA
                {script: `${gensettings.template}/lib/npm/all.min.js`},
                // MOMENT.JS
                {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
                // JQUERY
                {script: `${gensettings.template}/lib/npm/jquery.slim.min.js`},                
                // BOOTSTRAP
                {script: `${gensettings.template}/lib/npm/bootstrap.bundle.min.js`},
                // HOLDERJS
                {script: `${gensettings.template}/lib/npm/holder.min.js`}       
            ];

            let modules = [
                // {module: `${gensettings.template}/js/main.mjs`},
                // LOCAL
                // {module: `${gensettings.template}/js/form02log.js`} 
            ];

            let styles = [
                // FONTAWESOME
                {style: `${gensettings.template}/lib/npm/all.min.css`},
                // JQUERY TOAST
                {style: `${gensettings.template}/lib/npm/jquery.toast.min.css`},
                // BOOTSTRAP
                {style: `${gensettings.template}/lib/npm/bootstrap.min.css`},
            ];
            
            res.render(`log_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:      "Noutăți",
                user:       req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken:  req.csrfToken(),
                logentries: newResultArr,
                scripts,
                styles,
                modules 
            });
        }).catch((err) => {
            console.error(err);
            logger.error(err);
            next(err);
        });
    } else {
        res.redirect('/401');
    }
}
router.get('/', (req, res, next) => {
    logRoot(req, res, next).catch((error) => {
        console.log(error);
        logger.error(error);
    })
});

// Jurnalier - introducere articol
async function addLog (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    let scripts = [
        // FA
        {script: `${gensettings.template}/lib/npm/all.min.js`},
        // MOMENT.JS
        {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
        // JQUERY
        {script: `${gensettings.template}/lib/npm/jquery.slim.min.js`},                
        // BOOTSTRAP
        {script: `${gensettings.template}/lib/npm/bootstrap.bundle.min.js`},
        // HOLDERJS
        {script: `${gensettings.template}/lib/npm/holder.min.js`}   
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
        // JQuery
        {module: `${gensettings.template}/lib/npm/jquery.min.js`},
        // Toast
        {module: `${gensettings.template}/lib/npm/jquery.toast.min.js`},
        // LOCAL
        {module: `${gensettings.template}/js/uploader.mjs`},
        {module: `${gensettings.template}/js/form02log.mjs`} 
    ];

    let styles = [
        // FONTAWESOME
        {style: `${gensettings.template}/lib/npm/all.min.css`},
        // JQUERY TOAST
        {style: `${gensettings.template}/lib/npm/jquery.toast.min.css`},
        // BOOTSTRAP
        {style: `${gensettings.template}/lib/npm/bootstrap.min.css`},
    ];

    /* === VERIFICAREA CREDENȚIALELOR === */
    if(req.session.passport.user.roles.admin){
        // Dacă avem un admin, atunci oferă acces neîngrădit
        res.render(`logentry-form_${gensettings.template}`, {
            template: `${gensettings.template}`,
            title:     "Noutate",
            user:      req.user,
            logoimg:   `${gensettings.template}/${LOGO_IMG}`,
            csrfToken: req.csrfToken(),
            scripts,
            modules,
            // styles
        });
    } else {
        res.redirect('/401');
    }
};
router.get('/new', (req, res, next) => {
    addLog(req, res, next).catch((error) => {
        console.log(error);
        logger.error(error);
    })
});

// Jurnalier - accesare înregistrare individuală
async function logEntry (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    // Adu obiectul întregistrării în funcție de alias. Dacă la câmpul alias există valoarea căutată, înseamnă că e o intrare modernă.
    let entry = await Log.findOne({alias: req.params.alias});
    // În cazul în care înregistrarea nu are alias, o vom căuta după id.
    if (entry === null) {
        entry = await Log.findById(req.params.alias);
    }

    // Setare hardcodată de ACL
    let roles = ["user", "cred"];
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    let scripts = [
        // FA
        {script: `${gensettings.template}/lib/npm/all.min.js`},
        // MOMENT.JS
        {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
        // JQUERY
        {script: `${gensettings.template}/lib/npm/jquery.slim.min.js`},                
        // BOOTSTRAP
        {script: `${gensettings.template}/lib/npm/bootstrap.bundle.min.js`},
        // HOLDERJS
        {script: `${gensettings.template}/lib/npm/holder.min.js`}   
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
        // JQuery
        {module: `${gensettings.template}/lib/npm/jquery.min.js`},
        // Toast
        {module: `${gensettings.template}/lib/npm/jquery.toast.min.js`},
        // LOCAL
        {module: `${gensettings.template}/js/uploader.mjs`},
        {module: `${gensettings.template}/js/logentry.mjs`} 
    ];

    let styles = [
        // FONTAWESOME
        {style: `${gensettings.template}/lib/npm/all.min.css`},
        // JQUERY TOAST
        {style: `${gensettings.template}/lib/npm/jquery.toast.min.css`},
        // BOOTSTRAP
        {style: `${gensettings.template}/lib/npm/bootstrap.min.css`},
    ];

    if (confirmedRoles.length > 0) {
        const newObi = Object.assign({}, entry._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
        // https://github.com/wycats/handlebars.js/blob/master/release-notes.md#v460---january-8th-2020
        newObi.dataRo = moment(newObi.date).locale('ro').format('LLL');
        // newObi.content = content2html(entry.content);

        // console.log('Obiectul care pleacă ', newObi);

        /* === VERIFICAREA CREDENȚIALELOR === */
        if(req.session.passport.user.roles.admin){
            // Dacă avem un admin, atunci oferă acces neîngrădit
            res.render(`logentry_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:     entry.title,
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                scripts,
                modules,
                styles,
                newObi
            });
        } else {
            res.redirect('/401');
        }
    }
};
router.get('/:alias', (req, res, next) => {
    logEntry(req, res, next).catch((error) => {
        console.log(error);
        logger.error(error);
    })
});

module.exports = router;