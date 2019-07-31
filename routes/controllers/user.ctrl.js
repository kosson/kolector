const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

let userModel = require('../../models/user'); 
function cbStrategy (request, accessToken, refreshToken, params, profile, done) {
    // popularea modelului cu date
    const record = {
        email: profile._json.email,
        googleID: profile.id,
        googleProfile: {
            name:          profile._json.name,
            given_name:    profile._json.given_name,
            family_name:   profile._json.family_name,
            picture:       profile._json.picture,
            token:         accessToken,
            refresh_token: refreshToken,
            token_type:    params.token_type,
            expires_in:    params.expires_in
        },
        roles: {
            admin: false
        },
        created: Date.now()
    };
    // numără câte înregistrări sunt în colecție.
    // var noRecs = userModel.find().estimatedDocumentCount( (err, count) => { // FIXME: Folosește secvența când faci upgrade la MongoDB 4.0.3 sau peste
    userModel.find().count( (err, count) => {
        // DACĂ nu găsește nicio înregistrare, creează direct pe prima care a fi și admin
        if (count == 0) {
            record.roles.admin = true;
            const userObj = new userModel(record);
            userObj.save(function (err, user) {
                if (err) throw err;
                // console.log("Salvez user în bază!");
                done(null, user);
            });
        // DACĂ sunt înregistrări în colecție, caută după email dacă deja există
        } else {
            userModel.findOne({ email: profile._json.email }, (err, user) => {
                if (err) throw new Error(err);    
                if(user) {
                    done(null, user);
                    // TODO: trimite token-ul din bază catre browser. 
                } else {
                    record.roles.admin = false;
                    const newUserObj = new userModel(record);
                    newUserObj.save(function (err, user) {
                        if (err) throw err;
                        // console.log("Salvez user în bază!");
                        done(null, user);
                    });
                }
            });
        }
    });    
}

// Strategia de access pentru conturile de Google
passport.use(new GoogleStrategy({
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  "http://localhost:8080/callback",
        prompt:       'select_account',
        passReqToCallback   : true
    }, cbStrategy
));

// Pentru a putea susține sesiuni de login persistent, 
// Passport trebuie să serializeze și deserializeze 
// obiectul user din sesiune
passport.serializeUser(function(user, cb) {
    cb(null, user);
});  
passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

// Asigură-te că această cale este autentificată
function ensureAuthenticated (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

module.exports = {
    login(req, res) {
        res.render('login', {
            title: "login",
            logoimg: "img/rED-logo192.png",
            credlogo: "img/CREDlogo.jpg"
        });
    },
    loginGoogle () {
        passport.authenticate('google', { scope: ['profile', 'email']});
    },
    callback () {
        passport.authenticate('google', { failureRedirect: '/login'});
    }
};