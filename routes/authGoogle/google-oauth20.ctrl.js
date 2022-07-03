require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Mgmtgeneral = require('../../models/MANAGEMENT/general'); // Adu modelul management

module.exports = async function (passport) {
    // Pentru a putea susține sesiuni de login persistent, 
    // Passport trebuie să serializeze și deserializeze 
    // obiectul user din sesiune
    passport.serializeUser(function(user, cb) {
        cb(null, user);
    });  
    passport.deserializeUser(function(obj, cb) {
        cb(null, obj);
    });
    
    // LOGO
    let LOGO_IMG = "img/" + process.env.LOGO;

    /* === STRATEGIA GOOGLE === */
    let cbGoogleStrategy = require('./google-oauth20.clbk'); // Încarcă funcția care tratează autentificarea cu Google pentru strategia dedicată
    // Strategia de access pentru conturile de Google
    passport.use(new GoogleStrategy({
            clientID:          process.env.GOOGLE_CLIENT_ID,
            clientSecret:      process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:       process.env.BASE_URL + "/callback",
            prompt:            'select_account',
            passReqToCallback: true
        }, cbGoogleStrategy
    ));

    // returnează un obiect ale cărui metode vor fi tot atâtea middleware-uri
    return {
        auth(req, res){
            res.render(`auth_${gensettings.template}`, {
                title:    "auth",
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
            });
        },
        ensureAuthenticated(req, res, next){
            if(req.isAuthenticated()){
                return next();
            }
            res.redirect('/401');
        },
        resAtribuite(req, res, next){
            if(req.isAuthenticated()){
                return next();
            }
            res.redirect('/401');
        }
    };
};
