require('dotenv').config();

const path           = require('path');
const logger         = require('morgan');
const compression    = require('compression');
const express        = require('express');
const session        = require('express-session');
const cookieParser   = require('cookie-parser');
const csurf          = require('csurf');
const flash          = require('connect-flash');

const helmet         = require('helmet');
const passport       = require('passport');
const responseTime   = require('response-time');
const RedisStore     = require('connect-redis')(session);
const redisClient    = require('./redis.config');

const hbs            = require('express-hbs');
const app            = express();
const http           = require('http').createServer(app);

const cors           = require('cors');
const favicon        = require('serve-favicon');
const { v1: uuidv1 } = require('uuid'); // https://github.com/uuidjs/uuid#deep-requires-now-deprecated
const i18n           = require('i18n');

/* === I18N === */
i18n.configure({
    locales: ['en', 'hu', 'de', 'ua', 'pl'],
    cookie: 'locale',
    directory: __dirname + "/locales"
});

/* === MONGOOSE === */
const mongoose = require('./mongoose.config');

/* === LOGGER === */
app.use(logger('dev', {
    skip: function (req, res) {
        return res.statusCode < 400;
    }
})); // TODO: Creează un mecanism de rotire a logurilor. ('combined')
// app.use(logger('dev')); // Activează doar atunci când faci dezvoltare...

/* === FIȘIERELE statice === */
app.use(express.static(path.join(__dirname, '/public'), {
    index: false, 
    immutable: true, 
    cacheControl: true,
    maxAge: "30d"
}));
app.use('/repo', express.static(path.join(__dirname, 'repo')));
// app.use(fileUpload());
app.use(favicon(path.join(__dirname,  'public', 'favicon.ico')));

/* === HELMET === */
app.use(helmet()); // .js” was blocked due to MIME type (“text/html”) mismatch (X-Content-Type-Options: nosniff)
// https://helmetjs.github.io/docs/dont-sniff-mimetype/

/* === CORS === */
var corsOptions = {
    origin: 'http://' + process.env.DOMAIN,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

/* === BODY PARSER === */
app.use(express.urlencoded({extended: true}));
app.use(express.json());

/* === SESIUNI === */
app.use(cookieParser());// Parse Cookie header and populate req.cookies with an object keyed by the cookie names

/* === TIMP RĂSPUNS ÎN HEADER === */
app.use(responseTime());

/* === HANDLEBARS :: SETAREA MOTORULUI DE ȘABLONARE === */
hbs.registerHelper('json', function clbkHbsHelperJSON (obi) {
    // console.log(JSON.stringify(obi.content));
    return JSON.stringify(obi);
});
hbs.registerHelper('message2toast', function clbkHbsHelperM2T (message) {
    errorRender(message);
});
app.engine('hbs', hbs.express4({
    i18n: i18n,
    partialsDir: __dirname + '/views/partials',
    layoutsDir:  __dirname + '/views/layouts',
    beautify: true
}));
app.set('views', __dirname + '/views'); // cu app.set se vor seta valori globale pentru aplicație
app.set('view engine', 'hbs');

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

app.use(i18n.init); // instanțiere modul i18n - este necesar ca înainte de a adăuga acest middleware să fie cerut cookies

// creează sesiune - https://expressjs.com/en/advanced/best-practice-security.html
let sessionMiddleware = session({
    store:  new RedisStore({client: redisClient}),
    name:   'kolector',
    secret: process.env.COOKIE_ENCODING,
    genid:  function (req) {
        return uuidv1(); // use UUIDs for session IDs
    },
	proxy:  true,
    resave: false, 
    saveUninitialized: true,
    logErrors: true,
    cookie: {
        httpOnly: true,
        maxAge: (24 * 3600 * 1000),
        sameSite: 'lax' // https://www.npmjs.com/package/express-session#cookiesamesite
    }
});

// https://www.npmjs.com/package/express-session
if (app.get('env') === 'production') {
    app.set('trust proxy', 1);              // trust first proxy
    sessionMiddleware.cookie.secure = true; // serve secure cookies
}

// MIDDLEWARE de stabilirea a sesiunii de lucru prin încercări repetate. Vezi: https://github.com/expressjs/session/issues/99
app.use(function (req, res, next) {
    var tries = 3; // număr de încercări
    function lookupSession (error) {
        if (error) {
            return next(error);
        }
        tries -= 1;

        if (req.session !== undefined) {
            // console.log('app.js::stabilirea sesiunii de lucru -> req.session', req.session);
            // doar dacă sesiunea este stabilită, se va trece pe următorul middleware
            return next();
        }

        if (tries < 0) {
            return next(new Error('Nu am putut stabili o sesiune cu Redis chiar după trei încercări'));
        }

        sessionMiddleware(req, res, lookupSession);
    }
    lookupSession();
});



// introdu mesaje flash
app.use(flash()); // acum ai acces în rute la `req.flash()`.

/* === SERVER SOCKETURI === */
// #1 Creează server prin atașarea celui existent
const io = require('socket.io')(http);
// #2 Creează un wrapper de middleware Express pentru Socket.io
function wrap (middleware) {
    return function matcher (socket, next) {
        middleware (socket.request, {}, next);
    };
}
io.use(wrap(sessionMiddleware));
// conectarea obiectului sesiune ca middleware în tratarea conexiunilor socket.io (ALTERNATIVĂ, nu șterge)
// io.use(function clbkIOuseSessions(socket, next) {
//     sessionMiddleware(socket.request, socket.request.res, next);
// });
// when a socket.io connect connects, get the session and store the id in it (https://stackoverflow.com/questions/42379952/combine-sockets-and-express-when-using-express-middleware)

/* === PASAREA SERVERULUI SOCKET === */
require('./routes/sockets')(io);

/* === RUTE ÎN AFARA CSRF-ului === */
// UPLOAD
let upload = require('./routes/upload')(io);
app.use('/upload', upload);

/* === CSRF - Cross Site Request Forgery - expressjs.com/en/resources/middleware/csurf.html https://github.com/expressjs/csurf === */
const csurfProtection = csurf({cookie: false});
app.use(csurfProtection); // activarea protecției la CSRF

/* === PASSPORT === */
app.use(passport.initialize()); // Instanțiază Passport pentru a fi asigurată trecerea mai departe a cererii pe rute. Serializează și deserializează userul!
app.use(passport.session());    // restaurează starea sesiunii dacă aceasta există

/* === ÎNCĂRCAREA RUTELOR === */
const UserPassport = require('./routes/authGoogle/google-oauth20.ctrl')(passport);
let index          = require('./routes/index');
let login          = require('./routes/login');
let authG          = require('./routes/authGoogle/authG');
let callbackG      = require('./routes/authGoogle/callbackG');
let logout         = require('./routes/logout');
let administrator  = require('./routes/administrator');
let tertium        = require('./routes/tertium');
let resurse        = require('./routes/resurse');
let log            = require('./routes/log');
let resursepublice = require('./routes/resursepublice');
let profile        = require('./routes/profile');
let tags           = require('./routes/tags');
let tools          = require('./routes/tools');
let help           = require('./routes/help');
let apiv1          = require('./routes/apiV1');
let signupLoco     = require('./routes/signup');

// === MIDDLEWARE-ul RUTELOR ===
app.use('/',               index);
app.use('/api/v1',         csurfProtection, apiv1); // accesul la prima versiune a api-ului
app.use('/auth',           csurfProtection, authG);
app.use('/callback',       csurfProtection, callbackG);
app.use('/signup',         csurfProtection, signupLoco);
app.use('/login',          csurfProtection, login);
app.use('/logout',         csurfProtection, logout);
app.use('/resursepublice', csurfProtection, resursepublice);
app.use('/tertium',        csurfProtection, tertium);
app.use('/help',           csurfProtection, help);
app.use('/administrator',  csurfProtection, UserPassport.ensureAuthenticated, administrator);
app.use('/resurse',        csurfProtection, UserPassport.ensureAuthenticated, resurse);
app.use('/log',            csurfProtection, UserPassport.ensureAuthenticated, log);
app.use('/profile',        csurfProtection, profile);
app.use('/tags',           csurfProtection, tags);
app.use('/tools',          csurfProtection, tools);

app.use(function midwVerifyCSRFtoken (err, req, res, next) {
    // console.log('[app.js::midwVerifyCSRFtoken] headerele primite din client', req.headers, ' Codul de eroare ', err.code);
    // console.log('app.js::midwVerifyCSRFtoken - obiectul sesiunii este: ', req.session); // req.session este generat de `express-session`.
    // console.log('app.js::midwVerifyCSRFtoken - obiectul user este: ', req.user);        // req.user este generat de `passport`.
    if (err.code === 'EBADCSRFTOKEN') {
        return next(err);
    }
    next();
});

// === 401 - NEPERMIS ===
app.get('/401', function(req, res){
    res.status(401);
    res.render('nepermis', {
        title:    "401",
        logoimg:  "img/red-logo-small30.png",
        mesaj:    "Încă nu ești autorizat pentru această zonă"
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

/**
 * Funcția are rolul de a transforma numărul de bytes într-o valoare human readable
 * @param {Number} bytes 
 */
function formatBytes (bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    if (bytes == 0) {
        return "n/a";
    }

    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));

    if (i == 0) {
        return bytes + " " + sizes[i];
    }

    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
} 
// citește detaliile de alocare a procesului
let alocareProces = process.memoryUsage();
const detalii = {
    RAM: formatBytes(alocareProces.rss)
};

console.info("Memoria RAM alocată la pornire este de: ", detalii.RAM);
if(process.env.NODE_ENV === 'production') {
    console.info("Aplicația rulează în modul de producție");
}

/* === Pornește serverul! === */
let port = process.env.PORT || 8080;
var server = http.listen(port, '127.0.0.1', function cbConnection () {
    console.log('Version: ', process.env.APP_VER);
    console.log('Server pornit pe 8080 -> binded pe 127.0.0.1. Proces no: ', process.pid);
});

/* === GESTIONAREA evenimentelor pe `process` și a SEMNALELOR === */

// gestionează erorile care ar putea aprea în async-uri netratate corespunzător sau alte promisiuni.
process.on('uncaughtException', (err) => {
    console.log('[app.js] A apărul un uncaughtException cu detaliile ', err.message);
    // process.kill(process.pid, 'SIGTERM');
    console.error(err.stack); // afișează stiva la momentul închidere
    process.nextTick(function() {
        process.exit(1);
    });
});

process.on('SIGINT', function onSiginit () {
    console.info('Am prins un SIGINT (ctr+c). Închid procesul! Data: ', new Date().toISOString());
    shutdownserver();
});

process.on('SIGTERM', function onSiginit () {
    console.info('Am prins un SIGTERM (stop). Închid procesul! Data: ', new Date().toISOString());
    shutdownserver();
});

function shutdownserver () {
    server.close(function onServerClosed (err) {
        if (err) {
            console.error(err.message, err.stack);
            process.exitCode = 1;            
        }
        process.exit(1);
    });
}