require('dotenv').config();
/* === DEPENDINȚE === */
const express    = require('express');
const router     = express.Router();
// Mongoose
const mongoose   = require('mongoose');
const UserSchema = require('../models/user');               // Cere schema unui `User`
const UserModel  = mongoose.model('users', UserSchema);     // constituie modelul `UserModel` din schema cerută
const {generatePassword, issueJWT} = require('./utils/password.js');  // cere funcția de hashing și cea de emitere a unui JWT

/* === SIGNUP [GET] - Afișarea formularului ===*/
router.get('/', function clbkSignUpGet (req, res, next) {
    let csrf = req.csrfToken();
    // LOGO
    let logoimg = "img/" + process.env.LOGO;

    let scripts = [
        // FONTAWESOME
        {script: '/lib/npm/all.min.js'},
        // LOCALE
        {script: '/js/signup.js'} 
    ];

    let styles = [
        {style: '/lib/npm/all.min.css'}
    ];

    let modules = [
        {module: '/lib/npm/popper.min.js'},
        {module: '/lib/npm/popper-utils.min.js'},
        {module: '/js/indexpub.mjs'}
    ];

    console.log('/routes/signup [GET] I-am trimis clientului următoarele cookies: ', req.cookies);

    res.render('signup', {
        title:       "Signup",
        language:    "ro",
        logoimg:     "img/" + process.env.LOGO,
        creator:     process.env.CREATOR,
        publisher:   process.env.PUBLISHER,
        brandname:   process.env.BRAND_NAME,
        description: process.env.DESCRIPTION,
        contact:     process.env.CONTACT,
        googlelogo:  "img/Google-logo.png",
        csrfToken:   csrf,
        scripts,
        modules,
        styles
    });
});

/* === SIGNUP [POST] - Crearea contului ===*/
router.post('/', function clbkPostSignUp (req, res, next) {
    // console.log('/routes/signup [POST] Am următoarele cookie-uri: ', req.cookies);
    const saltHash = generatePassword(req.body.password); // heșuiește parola și salt-ul
    // separă-le pe bucăți pentru a le băga în record-ul de user
    const salt = saltHash.salt;
    const hash = saltHash.hash;
    // încarcă modelul de User cu date
    const newUser = new UserModel({
        _id:      mongoose.Types.ObjectId(),
        username: req.body.email, 
        email:    req.body.email,
        roles: {
            admin:     false,
            public:    true,
            rolInCRED: ['general', 'user'] // permit astfel ca userii din public să propună resurse
        },
        hash: hash,
        salt: salt
    });
    // salvează în bază!
    newUser.save().then((user) => {
        // la momentul creării userului, pentru a emite JWT, trebuie să ai obiectul user
        const jwt = issueJWT(user); // îl iei chiar din bază după ce înregistrarea a fost făcută
        // console.log('Am creat contul utilizatorului: ', user);
        if (user) {
            // FIXME: Când treci complet la JWT, activează!!!
            // res.json({
            //     success:   true,
            //     user:      user,
            //     token:     jwt.token,
            //     expiresIn: jwt.expires,
            // });
            res.redirect('/login'); // TODO: Pune un link către pagina de landing în /login care să se activeze când este primit tokenul.
        } 
    }).catch((err) => {
        console.error(err);
        next(err);
    });
});

module.exports = router;