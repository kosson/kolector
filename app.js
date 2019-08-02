require('dotenv').config();
const path           = require('path');
const bodyParser     = require('body-parser');
const logger         = require('morgan');
const cookies        = require('cookie-parser');
const express        = require('express');
const session        = require('express-session');
const fileUpload     = require('express-fileupload');
const passport       = require('passport');
const RedisStore     = require('connect-redis')(session);
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
// app.use(logger('combined')); // TODO: Dă-i drumu în producție și creează un mecanism de rotire a logurilor.
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

// Use `.hbs` for extensions and find partials in `views/partials`.
app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views/partials',
    layoutsDir:  __dirname + '/views/layouts',
    beautify: true
}));
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');

// Instanțiază Passport și restaurează starea sesiunii dacă aceasta există
app.use(passport.initialize());
app.use(passport.session());

// GESTIONAREA RUTELOR
// acl.config({
//     filename: 'nacl.json',
//     baseUrl: '/'
// });
// app.use(acl.authorize);
const routes = require('./routes/routes')(app, passport);
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