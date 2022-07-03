require('dotenv').config();
/* === DEPENDINȚE === */
const path     = require('path');
const fs       = require('fs');
const express  = require('express');
const router   = express.Router();
const passport = require('passport');
const logger   = require('../util/logger');
const Mgmtgeneral = require('../models/MANAGEMENT/general'); // Adu modelul management

// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

/* === LOGIN [GET] === */
async function clbkLogin (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    let scripts = [
        // FONTAWESOME
        {script: `${gensettings.template}/lib/npm/all.min.js`},
    ];

    let styles = [
        {style: `${gensettings.template}/lib/npm/all.min.css`}
    ];

    let modules = [
        {module: `${gensettings.template}/lib/npm/popper.min.js`},
        {module: `${gensettings.template}/lib/npm/popper-utils.min.js`}
    ]
    // console.log("Din user.ctrl avem din req.body pe /login: ", req.body);
    res.render(`login_${gensettings.template}`, {
        template: `${gensettings.template}`,
        title:   "login",
        logoimg:   `${gensettings.template}/${LOGO_IMG}`,
        scripts,
        modules,
        styles
    });
};
router.get('/', (req, res, next) => {
    clbkLogin(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    });
});

// Utilitarele pentru validarea parolei și emiterea JWT-ul!
let {issueJWT, validPassword} = require('./utils/password');
/* === LOGIN [POST] ===*/
router.post('/',  passport.authenticate('local'), async (req, res, next) => {
    // console.log("Din login.js avem din req.body pe /login: ", req.body, 'USER este ', req.user);
    res.redirect(301, '/');
});

module.exports = router;
