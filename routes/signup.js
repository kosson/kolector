require('dotenv').config();
/* === DEPENDINȚE === */
const express    = require('express');
const router     = express.Router();
const passport   = require('passport');
const mongoose   = require('mongoose');
const UserSchema = require('../models/user');
const UserModel  = mongoose.model('users', UserSchema); // constituie modelul
const {generatePassword} = require('./utils/password.js');

/* O implementare https://www.npmjs.com/package/passport-local-mongoose */
// const UserDetails = mongoose.model('users', UserSchema, 'users'); // creează Modelul
// passport.use(UserDetails.createStrategy());
// passport.serializeUser(UserDetails.serializeUser());
// passport.deserializeUser(UserDetails.deserializeUser());

/* === SIGNUP [GET] - Afișarea formularului ===*/
router.get('/', function clbkSignUpGet (req, res, next) {
    // LOGO
    let logoimg = "img/" + process.env.LOGO;
    let scripts = [
        // LOCALE
        {script: '/js/signup.js'} 
    ];
    res.render('signup', {
        title:   "Signup",
        logoimg,
        scripts
    });
});

/* === SIGNUP [POST] - Crearea contului ===*/
router.post('/', function clbkPostSignUp (req, res, next) {
    
    const saltHash = generatePassword(req.body.password);
    const salt = saltHash.salt;
    const hash = saltHash.hash;
    const newUser = new UserModel({
        _id:      mongoose.Types.ObjectId(),
        username: req.body.email, 
        email:    req.body.email,
        roles: {
            admin:     false,
            public:    false,
            rolInCRED: ['general']
        },
        hash: hash,
        salt: salt
    });

    newUser.save().then((user) => {
        // console.log('Am creat contul utilizatorului: ', user);
        if (user) {
            res.redirect('/login');
        } 
    }).catch((err) => {
        console.error(err);
        next(err);
    });
    
    /* Vechea implementare https://www.npmjs.com/package/passport-local-mongoose */
    // Încarcă modelul `UserDetails` cu date
    // UserDetails.register(new UserDetails({
    //     _id:      mongoose.Types.ObjectId(),
    //     username: req.body.email, 
    //     email:    req.body.email,
    //     roles: {
    //         admin:     false,
    //         public:    false,
    //         rolInCRED: ['general']
    //     }
    // }), req.body.password, function (err, user) {
    //     if (err) {
    //         console.error(err);
    //         next(err);
    //     }
    //     var authenticate = UserDetails.authenticate();
    //     authenticate(req.body.email, req.body.password, function(err, result) {
    //         if (err) {
    //             console.error(err);
    //             return next(err);
    //         }
    //         if (result) {
    //             res.redirect('/login');
    //         }
    //     });
    // });
});

module.exports = router;