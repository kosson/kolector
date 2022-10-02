require('dotenv').config();
/* === DEPENDINȚE === */
const express     = require('express');
const router      = express.Router();
const hb          = require('handlebars');
const fs          = require('fs');
const path        = require('path');
const logger      = require('../../util/logger');

// Încarcă mecanismele de verificare ale rolurilor
let makeSureLoggedIn = require('connect-ensure-login');
let checkRole        = require('../controllers/checkRole.helper');

// MODELE
const Resursa     = require('../../models/resursa-red'); // Adu modelul resursei
const Mgmtgeneral = require('../../models/MANAGEMENT/general'); // Adu modelul management
const Log         = require('../../models/logentry');


// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

/* === TEST === */
async function clbkProfile (req, res) {
    try {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);

        res.render(`devnull_${gensettings.template}`, {
            template:     `${gensettings.template}`,
            title:        "Profil",
            user:         req.user,
            logoimg:      `${gensettings.template}/${LOGO_IMG}`,
            csrfToken:    req.csrfToken(),
            activePrfLnk: true
        });
    } catch (error) {
        console.log(error);
    }
};
router.get('/', makeSureLoggedIn.ensureLoggedIn(), (req, res, next) => {
    clbkProfile(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);    
    })
});

module.exports = router;