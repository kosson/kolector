require('dotenv').config();
const path           = require('path');
const bodyParser     = require('body-parser');
const logger         = require('morgan');
const cookies        = require('cookie-parser');
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const express        = require('express');
const session        = require('express-session');
const fileUpload     = require('express-fileupload');
const RedisStore     = require('connect-redis')(session);
const router         = express.Router();
const app            = express();
const acl            = require('express-acl');
const hbs            = require('express-hbs');
const http           = require('http').createServer(app);
const cors           = require('cors');
const io             = require('socket.io')(http);
const favicon        = require('serve-favicon');

// TODO: creează un socket namespace
var pubComm = io.of('/redcol');

pubComm.on('connect', function pubCommCon (socket) {
    socket.on('mesaje', function cbMesaje (mesaj) {
        console.log(mesaj);
    });
});

// MIDDLEWARE-UL aplicației
app.use(logger('combined'));
app.use(cors());
app.use(cookies());
app.use(session({
    secret: '19cR3D_aPP_Kosson', 
    name:   'redcolector', 
    store:  new RedisStore({
		host: '127.0.0.1',
		port: 6379
	}),
	proxy:  true,
    resave: true, 
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(favicon(path.join(__dirname,  'public', 'favicon.ico')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Instanțiază Passport și restaurează starea sesiunii dacă aceasta există
app.use(passport.initialize());
app.use(passport.session());

// Use `.hbs` for extensions and find partials in `views/partials`.
app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views/partials',
    layoutsDir:  __dirname + '/views/layouts',
    beautify: true
}));
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');

// Setarea unei strategii de lucru cu API-urile GOOGLE
const mongoose = require('./mongoose.config');
let userModel = require('./models/user');   // adu un model al userului

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
var index   = require('./routes/index');
var login   = require('./routes/login');
var resurse = require('./routes/resurse');
var admin   = require('./routes/administrator');

// LANDING
app.get('/', index);
// LOGIN
app.get('/login', login);
// RUTA BUTONULUI CATRE SERVERUL DE AUTORIZARE (trebuie să ai deja ClientID și Secretul)
app.get('/login/google', passport.authenticate('google', { scope: ['profile', 'email']}));
// RUTA PE CARE VINE RĂSPUNSUL SERVERULUI DE AUTORIZARE
app.get('/callback',     passport.authenticate('google', { failureRedirect: '/login'}), function(req, res) {
    res.redirect('/resurse');
});
// RUTA LOGOUT
app.get('/logout', function(req, res){
    req.logout(); // TODO: Aici trebuie investiat mai mult.
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

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Serverul are o eroare!');
});

http.listen(8080, '127.0.0.1', function cbConnection () {
    console.log('Server pornit pe 8080 -> binded pe 127.0.0.1');
});

module.exports = app;