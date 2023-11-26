require('dotenv').config();
/* === DEPENDINȚE === */
const express  = require('express');
const router   = express.Router();
const passport = require('passport');
const logger   = require('../util/logger');
const Mgmtgeneral = require('../models/MANAGEMENT/general'); // Adu modelul management

// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

async function clbkLogin (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    let scripts = [];

    let styles = [];

    let modules = [];
    
    res.render(`login_${gensettings.template}`, {
        template: `${gensettings.template}`,
        title:   "login",
        logoimg:   `${gensettings.template}/${LOGO_IMG}`,
        scripts,
        modules,
        styles
    });
};

/* === LOGIN [GET] Încărcarea paginii de login ===*/
router.get('/', (req, res, next) => {
    clbkLogin(req, res, next).catch((error) => {
        console.log(error);
        logger.error(error);
        next(error);
    });
});

/* === LOGIN [POST] Strategie locală ===*/
router.post('/',  passport.authenticate('local'), async (req, res, next) => {
    // console.log("Din login.js avem din req.body pe /login: ", req.body, 'USER este ', req.user);
    res.redirect(301, '/');
});

module.exports = router;
