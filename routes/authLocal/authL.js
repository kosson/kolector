require('dotenv').config();
/* === DEPENDINȚE === */
const mongoose   = require('mongoose');
const UserSchema = require('../../models/user'); // adu schema
const UserModel  = mongoose.model('users', UserSchema); // constituie modelul

const {validPassword} = require('../utils/password.js');

// cerut pe /routes/login [POST]
module.exports = function verifyClbk4LocalStrat (email, password, done) {
        /* passport.authenticate() va executa acest callback */
        // Caută în bază userul
        UserModel.findOne({ email: email }).then((user) => {
            // console.log('[authL::UserModel.findOne] user este: ', user);
            if (!user) {
                return done(null, false, {message: 'Problemă la user sau la parolă!'}); // nu este nicio eroare, dar nici user n-ai. trimite un 401
            }
            const userValid = validPassword(password, user.hash, user.salt);
            // console.log('[authL] Funcția `userValid` returnează valoarea: ', userValid);
            if (userValid) {
                 // Since we have a valid user, we want to return no err and the user object
                return done(null, user); // este permisă trecerea în rută
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