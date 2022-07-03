require('dotenv').config();

/* ACEST MODUL VA FI UTIL CÂND NU VOI MAI FOLOSI MODULUL `passport-local-mongo` care este folosit pentru autentificarea locală */

/* === DEPENDINȚE === */
const mongoose      = require('mongoose');
const passport      = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User          = require('../../models/user');

const {validPassword} = require('../utils/password.js');

// acest obiect este necesar pentru cazul în care numele câmpurilor de la care vin valorile parolei si a numelui userului sunt 
// diferite de cele canonice așteptate de funcția callback de verificare: `username` și `passport`.
const customFields = {
    usernameField: "email", 
    passportField: "password"
};

// cerut pe /routes/login [POST]
/**
 * Funcția este callbackul de verificare a strategie locale.
 * Callback-ul este pasat la momentul în care se instanțiază un nou obiect `LocalStrategy`.
 * const passport = require('passport');
 * const LocalStrategy = require('passport-local').Strategy;
 * passport.use(new LocalStrategy(verifyClbk));
 * @param {*} username 
 * @param {*} password 
 * @param {*} done 
 */
function verifyClbk (username, password, done) {
        /* passport.authenticate() va executa acest callback */
        // Caută în bază userul
        User.findOne({ email: username }).lean()
            .then((user) => {
                // console.log('[authL::User.findOne] user este: ', user, 'Parola primită este', password);
                if (!user) {
                    return done(null, false, {message: 'Problemă la user sau la parolă!'}); // nu este nicio eroare, dar nici user n-ai. trimite un 401
                }
                // ia parola, hash-ul (parola hashuită din bază) și salt-ul venite prin obiectul `user` și validează
                const userValid = validPassword(password, user.hash, user.salt);
                // console.log('[authL] Funcția `userValid` returnează valoarea: ', userValid);
                if (userValid) {
                    // Since we have a valid user, we want to return no err and the user object
                    return done(null, user, {success: true}); // este permisă trecerea în rută
                    /* The user object is then serialized with `passport.serializeUser()` and added to the  `req.session.passport` object. */
                } else {
                    return done(null, false, {message: 'Problemă la user sau la parolă!'});
                }
            }).catch(err => {
                if (err) {
                    console.error(err);
                    done(err);
                }
            });
    };


passport.serializeUser(function (user, done) {
    done(null, user.id);
});
    
passport.deserializeUser(function (id, done) {
    // User este un document Mongoose
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

// passport.use(new LocalStrategy(customFields, verifyClbk)); // FOLOSEȘTE DOAR CÂND CÂMPURILE SUNT DIFERITE! Configurează `customFields` cu numele noi din form.
passport.use(new LocalStrategy(verifyClbk)); // folosit în /routes/controllers/user.ctrl.js