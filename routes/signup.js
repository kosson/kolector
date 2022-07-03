require('dotenv').config();
/* ==== DEPENDINȚE ==== */
const express    = require('express');
const router     = express.Router();
const passport   = require('passport');
const mongoose   = require('mongoose');
const Mgmtgeneral = require('../models/MANAGEMENT/general'); // Adu modelul management

const logger     = require('../util/logger');
// Încarcă controlerul necesar tratării rutelor de autentificare
const UserPassport = require('./controllers/user.ctrl')(passport);
const User       = require('../models/user');
const {generatePassword} = require('./utils/password');

// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

/* === SIGNUP [GET] ===*/
async function clbkSignUpGet (req, res, next) {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    let scripts = [
        // LOCALE
        {script: `${gensettings.template}/js/signup.js`} 
    ];
    res.render(`signup_${gensettings.template}`, {
        title:   "Signup",
        style:   `${gensettings.template}/lib/fontawesome/css/fontawesome.min.css`,
        logoimg: `${gensettings.template}/${LOGO_IMG}`,
        scripts
    });
};
router.get('/', (req, res, next) => {
    clbkSignUpGet (req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);  
    });
});

/* === SIGNUP [POST] ===*/
router.post('/', function clbkPostSignUp (req, res, next) {

    const {salt, hash} = generatePassword(req.body.password);

    // Crearea contului!!!
    let user = new User({
        _id: mongoose.Types.ObjectId(),
        username: req.body.email, 
        email:    req.body.email,
        roles: {
            admin:     false,
            public:    false,
            rolInCRED: ['general']
        },
        salt, 
        hash
    });

    user.save().then((user) => {
        // res.json({succes: true, user: user}); // testează dacă se crează contul
        res.redirect(301, '/login');
    }).catch((error) => {
        return next(error);
    });
    // , req.body.password, function clbkAuthLocal (err, user) {
    //     if (err) {
    //         logger.error(err);
    //         console.log('[signup::post]', err);
    //     };
    //     // dacă nu este nicio eroare, testează dacă s-a creat corect contul, făcând o autentificare
    //     var authenticate = User.authenticate();
    //     authenticate(req.body.email, req.body.password, function clbkAuthTest (err, result) {
    //         if (err) {
    //             logger.error(err);
    //             console.error('[signup::post::authenticate]', err);
    //             return next(err);
    //         }
    //         // în cazul în care autentificarea a reușit, trimite userul să se logheze.
    //         if (result) {
    //             res.redirect('/login');
    //         }
    //     });
    // });
});

module.exports = router;