module.exports = (app) => {
    // Setarea unei strategii de lucru cu API-urile GOOGLE
    // const mongoose       = require('../mongoose.config');
    const passport       = require('passport');
    const GoogleStrategy = require('passport-google-oauth20').Strategy;

    // Instanțiază Passport și restaurează starea sesiunii dacă aceasta există
    app.use(passport.initialize());
    app.use(passport.session());

    let userModel = require('../models/user'); 
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

    /* GESTIONAREA RUTELOR */
    // IMPORTUL CONTROLLERELOR DE RUTE
    var index   = require('./index');
    // var login   = require('./login');
    var resurse = require('./resurse');
    var admin   = require('./administrator');

    // LANDING
    app.get('/', index);
    // LOGIN
    const User = require('./controllers/user.ctrl');
    app.get('/login', User.login);
    // RUTA BUTONULUI CATRE SERVERUL DE AUTORIZARE (trebuie să ai deja ClientID și Secretul)
    app.get('/login/google', passport.authenticate('google', { scope: ['profile', 'email']}));
    // RUTA PE CARE VINE RĂSPUNSUL SERVERULUI DE AUTORIZARE
    app.get('/callback',     passport.authenticate('google', { failureRedirect: '/login'}), function(req, res) {
        res.redirect('/resurse');
    });
    // RUTA LOGOUT
    app.get('/logout', function(req, res){
        req.logout(); // TODO: Aici trebuie investigat mai mult.
        res.redirect('/');
    });
    // RUTA PROFILULUI PROPRIU
    app.get('/profile',
        require('connect-ensure-login').ensureLoggedIn(),
        function(req, res){
            res.render('profile', { user: req.user });
        }
    );
    // RUTA ADMINISTRATIVĂ A APLICAȚIEI
    app.get('/administrator', ensureAuthenticated, admin);
    // TODO: RUTA ADMINISTRATOR:
    // -- verifică daca este autentificat și dacă este administrator.

    // RESURSELE
    app.get('/resurse', ensureAuthenticated, resurse);
    // ADAUGĂ RESURSA
    app.get('/resurse/adauga', ensureAuthenticated, resurse);
};