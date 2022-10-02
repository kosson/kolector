require('dotenv').config();
const express = require('express');
const router  = express.Router();
// Încarcă mecanismele de verificare ale rolurilor
let makeSureLoggedIn = require('connect-ensure-login');
const logger      = require('../util/logger');
// MODELE
const Mgmtgeneral = require('../models/MANAGEMENT/general'); // Adu modelul management

// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

// Setări în funcție de template
let filterMgmt = {focus: 'general'};

/* === EROARE 500 === */
async function clbk500 (req, res) {
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    res.render(`500_${gensettings.template}`, {
        template:     `${gensettings.template}`,
        title:        "500",
        user:         req.user,
        logoimg:      `${gensettings.template}/${LOGO_IMG}`,
        csrfToken:    req.csrfToken(),
        activePrfLnk: true
    });
};
router.get('/500', makeSureLoggedIn.ensureLoggedIn(), (req, res, next) => {
    clbk500(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);    
    })
});

/* === EROARE 404 === */
async function clbk404 (req, res) {
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    res.render(`404_${gensettings.template}`, {
        template:     `${gensettings.template}`,
        title:        "404",
        user:         req.user,
        logoimg:      `${gensettings.template}/${LOGO_IMG}`,
        csrfToken:    req.csrfToken(),
        activePrfLnk: true
    });
};
router.get('/404', makeSureLoggedIn.ensureLoggedIn(), (req, res, next) => {
    clbk404(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);    
    })
});

/* === EROARE 404 === */
async function clbk403 (req, res) {
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    res.render(`403_${gensettings.template}`, {
        template:     `${gensettings.template}`,
        title:        "403",
        user:         req.user,
        logoimg:      `${gensettings.template}/${LOGO_IMG}`,
        csrfToken:    req.csrfToken(),
        activePrfLnk: true
    });
};
router.get('/403', makeSureLoggedIn.ensureLoggedIn(), (req, res, next) => {
    clbk403(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);    
    })
});

module.exports = router;