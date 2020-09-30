require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();
const passport= require('passport');
const mongoose = require('mongoose');
const connectEnsureLogin = require('connect-ensure-login');
const LocalStrategy = require('passport-local').Strategy;

// Încarcă controlerul necesar tratării rutelor de autentificare
const UserPassport = require('./controllers/user.ctrl')(passport);

/* === LOGIN [GET] === */
router.get('/', (req, res, next) => {

    let scripts = [
        // FONTAWESOME
        {script: '/lib/npm/all.min.js'},
    ];

    let styles = [
        {style: '/lib/npm/all.min.css'}
    ];

    let modules = [
        {module: '/lib/npm/popper.min.js'},
        {module: '/lib/npm/popper-utils.min.js'}
    ]
    // console.log("Din user.ctrl avem din req.body pe /login: ", req.body);
    res.render('login', {
        title:    "login",
        logoimg:  process.env.LOGO ,
        googlelogo: "img/Google-logo.png",
        scripts,
        modules,
        styles
    });
});

/* === LOGIN [POST] ===*/ // passport.authenticate('local', {failureRedirect: '/login'}),
router.post('/',  passport.authenticate('local', { failureRedirect: '/login'}), (req, res, next) => {
    // console.log("Din login.js avem din req.body pe /login: ", req.body);
    res.redirect('/');
});

module.exports = router;
