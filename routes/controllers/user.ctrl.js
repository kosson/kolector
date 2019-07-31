const GoogleStrategy   = require('passport-google-oauth20').Strategy;
const LocalStrategy    = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy  = require('passport-twitter').Strategy;

module.exports = (passport) => {
    // Pentru a putea susține sesiuni de login persistent, 
    // Passport trebuie să serializeze și deserializeze 
    // obiectul user din sesiune
    passport.serializeUser(function(user, cb) {
        cb(null, user);
    });  
    passport.deserializeUser(function(obj, cb) {
        cb(null, obj);
    });

    let cbGoogleStrategy = require('./googleStrategy.helper');
    // Strategia de access pentru conturile de Google
    passport.use(new GoogleStrategy({
            clientID:          process.env.GOOGLE_CLIENT_ID,
            clientSecret:      process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:       "http://localhost:8080/callback",
            prompt:            'select_account',
            passReqToCallback: true
        }, cbGoogleStrategy
    ));

    return {
        auth(req, res){
            res.render('auth', {
                title:    "auth",
                logoimg:  "img/rED-logo192.png",
                credlogo: "img/CREDlogo.jpg"
            });
        },
        login(req, res){
            res.render('login', {
                title:    "login",
                logoimg:  "img/rED-logo192.png",
                credlogo: "img/CREDlogo.jpg"
            });
        },
        ensureAuthenticated(req, res, next){
            if (req.isAuthenticated()) {
                return next();
            }
            res.redirect('/auth');
        }
    }
};