require('dotenv').config();
/* === DEPENDINȚE === */
const express       = require('express');
const router        = express.Router();
const mongoose      = require('mongoose');
const passport      = require('passport');
const LocalStrategy = require('passport-local').Strategy; // passport-local este un middleware care modifică obiectul creat de express-session
// constituie modelul user-ului -> necesar fazei de logare
const UserSchema = require('../models/user');               // Cere schema unui `User`
const UserModel  = mongoose.model('users', UserSchema);     // constituie modelul `UserModel` din schema cerută
const {validPassword, generatePassword, issueJWT} = require('./utils/password.js');  // cere funcția de hashing și cea de emitere a unui JWT

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

router.post('/', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/401' }));
// router.post('/', function (req, res, next) {
//     console.log('[/routes/login POST::Am ajuns în rută!!! Body este: ]', req.body);
//     UserModel.findOne({email: req.body.username})
//     .then((user) => {
//         // cazul în care nu au userul în baza de date!!!
//         if (!user) {
//             res.status(401).json({succes: false, msg: "nu am găsit userul"});
//             // res.redirect('401');
//         }
//         // dacă ai userul
//         const isValid = validPassword(req.body.password, user.hash, user.salt);
//         if (isValid) {
//             const tokenObj = issueJWT(user);
            
//             // FIXME: Pune tokenul într-un cookie sau asigură mecanism în client de stocare în local storage
//             res.json({success: true, user: user, token: tokenObj.token, expires: tokenObj.expires});

//         } 
//         else {
//             res.status(401).json({success: false, message: "Ceva nu este în regulă cu utilizatorul!"});
//             // res.redirect('/401');
//             // next();
//         }
//     }).catch((err) => {
//         console.error(err);
//         next(err);
//     });
// });

module.exports = router;