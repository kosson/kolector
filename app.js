require('dotenv').config();
const path           = require('path');
const bodyParser     = require('body-parser');
const logger         = require('morgan');
const cookies        = require('cookie-parser');
const express        = require('express');
const cookieParser   = require('cookie-parser');
const session        = require('express-session');
// const fileUpload     = require('express-fileupload');
const passport       = require('passport');
const RedisStore     = require('connect-redis')(session);
const app            = express();
// const acl            = require('express-acl');
const hbs            = require('express-hbs');
const http           = require('http').createServer(app);
const cors           = require('cors');
const io             = require('socket.io')(http);
const favicon        = require('serve-favicon');
const uuidv1         = require('uuid/v1');
const i18n           = require('i18n');

// minimal config
i18n.configure({
    locales: ['en', 'hu', 'de', 'ua', 'pl'],
    cookie: 'locale',
    directory: __dirname + "/locales"
});

// TODO: creează un socket namespace
var pubComm = io.of('/redcol');

pubComm.on('connect', function pubCommCon (socket) {
    socket.on('mesaje', function cbMesaje (mesaj) {
        console.log(mesaj);
    });
    socket.on('csuri', cbCsuri); // apel al funcția `cbCsuri` de mai jos
});

const mongoose = require('./mongoose.config');
/**
 * Funcția este callback al canalului `csuri` de pe sockeuri
 * @param {Arrray} data sunt codurile disciplinelor selectate
 */
function cbCsuri (data) {
    // console.log(data);// De ex: [ 'arteviz3', 'stanat3' ]
    
    const CSModel = require('./models/competenta-specifica');
    // Proiecția se constituie pe același câmp, dar pe valorile primite prin socket.
    CSModel.aggregate([{$match: {
        coddisc: {$in: data}
    }}]).then(rez => {
        pubComm.emit('csuri', JSON.stringify(rez));
    });
}

// MIDDLEWARE-UL aplicației
// app.use(logger('dev')); // TODO: Dă-i drumu în producție și creează un mecanism de rotire a logurilor. (combined)
app.use(cors());
// SESIUNI
app.use(cookies());
app.use(cookieParser()); // Parse Cookie header and populate req.cookies with an object keyed by the cookie names
app.use(session({
    secret: '19cR3D_aPP_Kosson', 
    // name:   'redcolector',
    genid: function(req) {
        return uuidv1(); // use UUIDs for session IDs
    },
    store:  new RedisStore({
		host: '127.0.0.1',
		port: 6379
    }),
	proxy:  true,
    resave: false, 
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public'))); // Static pe public
app.use('/repo', express.static(path.join(__dirname, 'repo')));  // static pe repo
// app.use(fileUpload());
app.use(favicon(path.join(__dirname,  'public', 'favicon.ico')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// vezi http://expressjs.com/api.html#app.locals
// app.locals({
//     'PROD_MODE': 'production' === app.get('env')
// });

app.engine('hbs', hbs.express4({
    i18n: i18n,
    partialsDir: __dirname + '/views/partials',
    layoutsDir:  __dirname + '/views/layouts',
    beautify: true
}));
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');
// instanțiere modul i18n - este necesar ca înainte de a adăuga acest middleware să fie cerut cookies
app.use(i18n.init);

// Instanțiază Passport și restaurează starea sesiunii dacă aceasta există
app.use(passport.initialize());
app.use(passport.session());

// GESTIONAREA RUTELOR
const routes = require('./routes/routes')(express, app, passport, pubComm);

// colectarea erorilor de pe toate middleware-urile
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('În lanțul de prelucrare a cererii, a apărut o eroare');
});

let port  = process.env.PORT || 8080;
http.listen(port, '127.0.0.1', function cbConnection () {
    console.log('Server pornit pe 8080 -> binded pe 127.0.0.1');
});

module.exports = app;