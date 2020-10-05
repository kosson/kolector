require('dotenv').config();
/* === DEPENDINȚE === */
const express  = require('express');
const router   = express.Router();
const mongoose   = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; // passport-local este un middleware care modifică obiectul creat de express-session

/* === LOGIN [GET] - Afișează template-ul === */
router.get('/', (req, res, next) => {
    // console.log('Din ruta /routes/login [GET] obiectul cookies înainte de orice este: ', req.session, ' cu headere ', req.headers);
    let csrf = req.csrfToken();
    
    let scripts = [
        // FONTAWESOME
        {script: '/lib/npm/all.min.js'},
    ];

    let styles = [
        {style: '/lib/npm/all.min.css'}
    ];

    let modules = [
        {module: '/lib/npm/popper.min.js'},
        {module: '/lib/npm/popper-utils.min.js'},
        {module: '/js/indexpub.mjs'}
    ];

    res.cookie('_csrf', csrf);
    // res.locals.csrfToken = csrf;

    // console.log("Din user.ctrl avem din req.body pe /login: ", req.body);
    res.render('login', {
        title:       "login",
        language:    "ro",
        logoimg:     "img/" + process.env.LOGO,
        creator:     process.env.CREATOR,
        publisher:   process.env.PUBLISHER,
        brandname:   process.env.BRAND_NAME,
        description: process.env.DESCRIPTION,
        contact:     process.env.CONTACT,
        googlelogo:  "img/Google-logo.png",
        csrfToken:   csrf,
        // csrfToken:   req.cookies._csrf,
        scripts,
        modules,
        styles
    });
});

/* === LOGIN [POST] - Autentificare locală ===*/
// https://zachgoll.github.io/blog/2019/choosing-authentication-strategy/
let clbkLocal = require('./authLocal/authL'); // controlerul pentru autentificare locală cu Passport Local

passport.use('local', new LocalStrategy(clbkLocal));
// Pentru a putea susține sesiuni de login persistent, 
// Passport trebuie să serializeze și deserializeze 
// obiectul user din sesiune
passport.serializeUser((user, done) => {
    // console.log('[authL::serializeuser] user este: ', user);
    done(null, user); // în momentul acesta `passport` creează proprietatea `passport` în obiectul `req.session`: {user: dso8fs89afds998fsda}.
});

passport.deserializeUser((userId, done) => {
    // preia datele din `req.session.passport.user`, aduci datele din bază și
    // se va contrui cu acele date specifice user-ului obiectul `req.user`.
    UserModel.findById(userId).then((user) => {
        done(null, user);
    }).catch(err => done(err));
});

router.post('/', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/401' }), (err, req, res, next) => {
    if (err) next(err);
    console.log('You are logged in!');
    res.redirect('/');
});

module.exports = router;