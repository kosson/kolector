require('dotenv').config();
const path           = require('path');
const logger         = require('morgan');
const compression    = require('compression');
const csrf           = require('csurf');
const express        = require('express');
const bodyParser     = require('body-parser');
const cookies        = require('cookie-parser');
const session        = require('express-session');
const redisClient    = require('./redis.config');
const helmet         = require('helmet');
const passport       = require('passport');
const responseTime   = require('response-time');
// const multer         = require('multer');
const RedisStore     = require('connect-redis')(session);

const hbs            = require('express-hbs');
const app            = express();
const http           = require('http').createServer(app);
const cors           = require('cors');
const io             = require('socket.io')(http);
const favicon        = require('serve-favicon');
const { v1: uuidv1 } = require('uuid'); // https://github.com/uuidjs/uuid#deep-requires-now-deprecated
const i18n           = require('i18n');

// stabilirea locației de upload
// let upload = multer({dest: path.join(__dirname, '/uploads')});

// activarea protecției csurf
const csrfProtection = csrf({ cookie: true });

// minimal config
i18n.configure({
    locales: ['en', 'hu', 'de', 'ua', 'pl'],
    cookie: 'locale',
    directory: __dirname + "/locales"
});

// TODO: creează un socket namespace
var pubComm = io.of('/redcol');
const sockets = require('./routes/sockets')(pubComm);

const mongoose = require('./mongoose.config');

// === MIDDLEWARE-UL aplicației===
// LOGGER
app.use(logger('combined', {
    skip: function (req, res) { return res.statusCode < 400 }
})); // TODO: Dă-i drumu în producție și creează un mecanism de rotire a logurilor. ('combined')

// PROTECȚIE
app.use(helmet());

// CORS
app.use(cors());

// SESIUNI
app.use(cookies());// Parse Cookie header and populate req.cookies with an object keyed by the cookie names
app.use(csrfProtection); // activarea protecției la CSURF 

// TIMP RĂSPUNS ÎN HEADER
app.use(responseTime())

// creează sesiune
let sessionMiddleware = session({
    name:   'redcolector',
    secret: '19cR3D_aPP_Kosson',
    genid: function(req) {
        return uuidv1(); // use UUIDs for session IDs
    },
    store: new RedisStore({client: redisClient}),
    unref: true,
	proxy:  true,
    resave: false, 
    saveUninitialized: true,
    logErrors: true,
    cookie: {
        maxAge: 3600000
    }
});

// stabilirea sesiunii de lucru prin încercări repetate. Vezi: https://github.com/expressjs/session/issues/99
app.use(function (req, res, next) {
    var tries = 3; // număr de încercări
    function lookupSession (error) {
        if (error) {
            return next(error);
        }
        tries -= 1;

        if (req.session !== undefined) {
            return next();
        }

        if (tries < 0) {
            return next(new Error('Nu am putut stabili o sesiune cu Redis chiar după trei încercări'));
        }

        sessionMiddleware(req, res, lookupSession);
    };
    lookupSession();
});

// STATIC
app.use(express.static(path.join(__dirname, '/public' )));
app.use('/repo', express.static(path.join(__dirname, 'repo')));
// app.use(fileUpload());
app.use(favicon(path.join(__dirname,  'public', 'favicon.ico')));

// PROCESAREA CORPULUI CERERII
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// vezi http://expressjs.com/api.html#app.locals
// app.locals({
//     'PROD_MODE': 'production' === app.get('env')
// });

// SETAREA MOTORULUI DE ȘABLONARE
hbs.registerHelper('json', function clbkHbsHelperJSON (obi) {
    // console.log(JSON.stringify(obi.content));
    return JSON.stringify(obi);
});
app.engine('hbs', hbs.express4({
    i18n: i18n,
    partialsDir: __dirname + '/views/partials',
    layoutsDir:  __dirname + '/views/layouts',
    beautify: true
}));
app.set('views', __dirname + '/views'); // cu app.set se vor seta valori globale pentru aplicație
app.set('view engine', 'hbs');

// Activează protocoalele de proxy
app.set('trust proxy', true);
app.enable('trust proxy');

// INIȚTALIZARE I18N
app.use(i18n.init); // instanțiere modul i18n - este necesar ca înainte de a adăuga acest middleware să fie cerut cookies

// Instanțiază Passport și restaurează starea sesiunii dacă aceasta există
app.use(passport.initialize());
app.use(passport.session());

// === COMPRESIE ===
function shouldCompress (req, res) {
    if (req.headers['x-no-compression']) {
      // don't compress responses with this request header
        return false;
    }    
    // fallback to standard filter function
    return compression.filter(req, res);
}
app.use(compression({ filter: shouldCompress }));

// === GESTIONAREA RUTELOR ===
// const routes = require('./routes/routes')(pubComm);
const UserPassport = require('./routes/controllers/user.ctrl')(passport);
// app.use(routes);
let index          = require('./routes/index');
let authG          = require('./routes/authGoogle/authG');
let callbackG      = require('./routes/authGoogle/callbackG');
let login          = require('./routes/login');
let logout         = require('./routes/logout');
let administrator  = require('./routes/administrator');
let tertium        = require('./routes/tertium');
let resurse        = require('./routes/resurse');
let log            = require('./routes/log');
let resursepublice = require('./routes/resursepublice');
let profile        = require('./routes/profile');
let tags           = require('./routes/tags');
let tools          = require('./routes/tools');
let upload         = require('./routes/upload')(pubComm);
let help           = require('./routes/help');

// === ROOT ===
app.use('/', index);
app.use('/auth', authG);
app.use('/callback', callbackG);
app.use('/login', login);
app.use('/logout', logout);
app.use('/resursepublice', resursepublice);
app.use('/tertium', tertium);
app.use('/help', help);
app.use('/administrator', UserPassport.ensureAuthenticated, administrator);
app.use('/resurse', UserPassport.ensureAuthenticated, resurse);
app.use('/log', UserPassport.ensureAuthenticated, log);
app.use('/profile', profile);
app.use('/tags', tags);
app.use('/tools', tools);
app.use('/repo', upload);

// === 401 - NEPERMIS ===
app.get('/401', function(req, res){
    res.status(401);
    res.render('nepermis', {
        title:    "401",
        logoimg:  "img/red-logo-small30.png",
        mesaj:    "Încă nu ești autorizat pentru acestă zonă"
    });
});

//=== 404 - NEGĂSIT ===
app.use('*', function (req, res, next) {
    res.render('negasit', {
        title:    "404",
        logoimg:  "/img/red-logo-small30.png",
        imaginesplash: "/img/theseAreNotTheDroids.jpg",
        mesaj:    "Nu-i! Verifică linkul!"
    });
});

// colectarea erorilor de pe toate middleware-urile
app.use(function catchAllMiddleware (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('În lanțul de prelucrare a cererii, a apărut o eroare');
});

let port = process.env.PORT || 8080;
http.listen(port, '127.0.0.1', function cbConnection () {
    console.log('RED Colector ', process.env.APP_VER);
    console.log('Server pornit pe 8080 -> binded pe 127.0.0.1');
});

module.exports = app;