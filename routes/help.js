require('dotenv').config();
const express = require('express');
const router  = express.Router();
// Încarcă mecanismele de verificare ale rolurilor
let makeSureLoggedIn = require('connect-ensure-login');
let checkRole = require('./controllers/checkRole.helper');
const logger      = require('../util/logger');
const mongoose    = require('mongoose');
const Mgmtgeneral = require('../models/MANAGEMENT/general'); // Adu modelul management

// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

/* === Sistem de asistență - HELP === */
async function clbkHelp (req, res) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    res.render(`help_${gensettings.template}`, {
        template:     `${gensettings.template}`,
        title:        "Asistență",
        user:         req.user,
        logoimg:      `${gensettings.template}/${LOGO_IMG}`,
        csrfToken:    req.csrfToken(),
        activePrfLnk: true
    });
};
router.get('/', makeSureLoggedIn.ensureLoggedIn(), (req, res, next) => {
    clbkHelp(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);    
    })
});

module.exports = router;