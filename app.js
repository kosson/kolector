require('dotenv').config();
const config = require('config');
const process = require('process');

const logger         = require('./util/logger');
const os             = require('os');
const path           = require('path');
const crypto         = require('crypto');
const compression    = require('compression');
const express        = require('express');
const rateLimit      = require("express-rate-limit");
const cookies        = require('cookie-parser');
const session        = require('express-session');
const hbs            = require('express-hbs');
const responseTime   = require('response-time');
const csurf          = require('@dr.pogodin/csurf');
const flash          = require('connect-flash');
const helmet         = require('helmet');
const passport       = require('passport');
const RedisStore     = require("connect-redis").default
const cors           = require('cors');
const favicon        = require('serve-favicon');

// const {redisCachedInstance, redisClients} = require('./redis.config');
const redisCachedInstance = require('./redis.config');

(async () => {
    try {
        /* === CLIENTS === */
        // REDIS
        if (!redisCachedInstance) {
            throw new Error(`[app.js] Nu am client de Redis pe care să-l activez. Modulul nu este încărcat.`);     
        }
        // await redisCachedInstance.auth(process.env.REDIS_HOST_PASSWORD);

        // CREAREA APLICAȚIEI
        const httpserver = require('./util/httpserver');
        const app        = httpserver.app();
        const http       = httpserver.http(app);
        app.disable('x-powered-by'); // dezactivează identificarea
        app.use(responseTime()); // TIMP RĂSPUNS ÎN HEADER

        /* === SESIUNI === */
        app.use(cookies()); // Parse Cookie header and populate req.cookies with an object keyed by the cookie names
        // console.log(`[app.js] Răspuns server Redis: ${await redisCachedInstance.ping()}`);
        let sessionMiddleware = session({
            name: process.env.APP_NAME,
            secret: process.env.COOKIE_ENCODING,
            genid: function(req) {
                return crypto.randomUUID({disableEntropyCache : true}); // pentru ID-urile de sessiune, folosește UUID-uri
            },
            store: new RedisStore({
                client: redisCachedInstance, 
                prefix: `${process.env.APP_NAME}:`
            }),
            unref:  true,
            proxy:  true,
            resave: false, 
            saveUninitialized: true,
            logErrors: true,
            cookie: {
                httpOnly: true,
                maxAge: (1 * 24 * 3600 * 1000),
                sameSite: 'lax' // https://www.npmjs.com/package/express-session#cookiesamesite
            }
        });
        //=> FIXME: În producție, setează la secure: true pentru a funcționa doar pe HTTPS
        app.use(sessionMiddleware);

        /* === MONGODB::MONGOOSE === */ 
        const mongoose = require('mongoose');
        mongoose.set('strictQuery', false);
        const mongoosedbconnector = require('./mongoose.config')(mongoose);
        let dbconn = mongoosedbconnector({getinfo: true}); // inițiază conexiunea și creează bazele de date dacă acestea nu există

        /* === MODELE === */
        const Mgmtgeneral = require('./models/MANAGEMENT/general'); // Adu modelul management

        // culege datele necesare afișării inițiale în TTY a detaliilor privind conectările la servicii.
        console.log(`Colecțiile asociate acestei conexiuni sunt `, Object.keys(dbconn.collections)); // abia după ce instanțiezi toate modelele, faci această prelucrare
        let databases = Object.keys(dbconn.collections); // folosește funcției setFavicon()

        const connectors = {
            redis: {
                // address: redisClient.address,
                // client: redisClient
            },
            mongo: dbconn.version,
            elastic: {
                clients: []
                // stare: elastClient.connectionPool.connections
                // client: elastClient
            }
        }

        // ELASTICSEARCH
        const elastClient = await require('./elasticsearch.config')(redisCachedInstance);
          
        global.CronJob = require('./util/cron'); // CRON -> programarea side ops-urilor
        global.__basedir = __dirname; // reconfirmare basedir
        
        /* === ÎNCĂRCAREA RUTELOR NEPROTEJATE === */
        let login      = require('./routes/login');
        let signupLoco = require('./routes/signup');
        let api        = require('./routes/apiV1');
        
        /* === FIȘIERE și DIRECTOARE statice === */
        app.use(express.static(path.join(__dirname, '/public'), {
            index: false, 
            immutable: true, 
            cacheControl: true,
            maxAge: "30d"
        }));
        app.use('/repo', express.static(path.join(__dirname, 'repo')));
        
        // app.use(fileUpload());
        let default_template = config.get('template');
        
        /**
         * Funcția are rolul de a seta corect faviconul aplicației
         * @param {Object} app 
         * @returns 
         */
        async function setFavicon (app) {            
            if(databases > 0 && databases.includes('mgmtgenerals')) {
                let gensettings = await Mgmtgeneral.findOne({focus: 'general'});
                app.use(favicon(path.join(__dirname,  'public', `${gensettings.template}`, 'favicon.ico'))); // original line
            } else {
                app.use(favicon(path.join(__dirname,  'public', `${default_template}`, 'favicon.ico')));
            }        
            return app;
        }
        setFavicon(app).catch((error) => {
            logger.error(`La setarea faviconului ${error}`);
            throw new Error(`La setarea faviconului ${error}`);
        })
        
        /* === HELMET === */
        app.use(helmet({
            contentSecurityPolicy: false
        })); // https://helmetjs.github.io/docs/dont-sniff-mimetype/
        
        /* === PROXY SUPPORT === */
        app.enable('trust proxy');
        
        // Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
        // see https://expressjs.com/en/guide/behind-proxies.html
        // app.set('trust proxy', 1);
        const limiter = rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100 // limit each IP to 100 requests per windowMs
        });
        
        // apply to all requests
        app.use('/api/', limiter);
        
        /* === CORS === */
        var corsOptions = {
            origin: '',
            optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
        };
        if (process.env.APP_RUNTIME === 'virtual') {
            corsOptions.origin = 'http://' + process.env.DOMAIN_VIRT + ':' + process.env.PORT;
        } else {
            corsOptions.origin = 'http://' + process.env.DOMAIN;
        }
        app.use(cors(corsOptions));
        
        /* === BODY PARSER === */
        app.use(express.urlencoded({extended: true, limit: '50mb'})); // parsing application/x-www-form-urlencoded
        app.use(express.json({limit: '50mb'}));
        
        // introdu mesaje flash
        app.use(flash()); // acum ai acces în rute la `req.flash()`.

        // https://www.npmjs.com/package/express-session
        if (app.get('env') === 'production') {
            app.set('trust proxy', 1);              // trust first proxy
            //sessionMiddleware.cookie.secure = true; // serve secure cookies
        }
               
        /* === PASSPORT === */
        const UserPassport = require('./routes/controllers/user.ctrl')(passport);
        app.use(passport.initialize()); // Instanțiază Passport
        app.use(passport.session());    // restaurează starea sesiunii dacă aceasta există
        
        // CREAREA SOCKET.IO 
        // -> https://socket.io/how-to/use-with-express-session
        // -> https://socket.io/docs/v4/using-multiple-nodes
        const io = require('./util/socketserver')(http, sessionMiddleware, redisCachedInstance);
        
        // conectarea obiectului sesiune ca middleware în tratarea conexiunilor socket.io (ALTERNATIVĂ, nu șterge)
        io.use(function clbkIOuseSessions(socket, next) {
            sessionMiddleware(socket.request, socket.request.res, next);
        });
        // when a socket.io connect connects, get the session and store the id in it (https://stackoverflow.com/questions/42379952/combine-sockets-and-express-when-using-express-middleware)
        
        /* === PASAREA SERVERULUI SOCKET === */
        require('./routes/sockets')(io);
        
        /* === RUTE ÎN AFARA CSRF-ului === */
        // UPLOAD
        let upload = require('./routes/upload')(io);
        app.use('/upload', upload);
        // SIGNUP
        app.use('/signup', signupLoco);
        // LOGIN
        app.use('/login', login);        
        // API v.1
        app.use('/api/v1', api); // accesul la prima versiune a api-ului
             
        // TRATARE ERORI - MODUL GENERAL
        // Trimite toate erorile în client ca JSON
        app.use((err, req, res, next) => {
            // Fallback la handler-ul Node-ului
            if (res.headersSent) {
                next(err);
                return;
            }
        
            logger.error(err.message, {url: req.originalUrl});
        
            res.status(500);
            res.json({ error: err.message });
            // res.redirect(`/errors/500`);
        }); 
        
        /* === CSRF - Cross Site Request Forgery - expressjs.com/en/resources/middleware/csurf.html === */
        const csurfProtection = csurf({
            cookie: {
                key: '_csrf',
                path: '/',
                httpOnly: false,
                secure: false, // dacă folosești HTTPS direct din aplicație, setează la true
                signed: false, // în caz de signed cookies, setează la true
                sameSite: 'strict', // https://www.owaspsafar.org/index.php/SameSite
                maxAge: 24 * 60 * 60 * 1000, // 24 ore
            },
            ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
            // value: 
        });
        
        app.use(csurfProtection); // activarea protecției la CSRF
        
        // ERORI CSRF transmitere token
        app.use(function (err, req, res, next) {
            if (err.code !== 'EBADCSRFTOKEN') return next(err);
            // gestionarea erorilor CSRF token:
            res.status(403).send(`Cererea ${req.url} are o eroare și nu trimite token în client.`);
        });
        
        //https://github.com/expressjs/csurf/issues/21
        // app.use(function (req, res, next) {
        //     if (req.url === '/repo') return next();
        //     csurfProtection(req, res, next);
        // })
        
        /* === HANDLEBARS :: SETAREA MOTORULUI DE ȘABLONARE === */
        hbs.registerHelper('json', function clbkHbsHelperJSON (obi) {
            // console.log(JSON.stringify(obi.content));
            return JSON.stringify(obi);
        });
        app.engine('hbs', hbs.express4({
            // defaultLayout: __dirname + '/views/layouts/landing.hbs',
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
        
        /* === PACKAGES -> Expunerea publică a pachetelor din `config/default.json::packages` === */
        let deps = config.get('packages');
        deps.forEach(dep => {
            app.use(`/${dep}`, express.static(path.resolve(`node_modules/${dep}`)));
        });
        
        /* === ÎNCĂRCAREA RUTELOR === */
        let index          = require('./routes/index');
        let authG          = require('./routes/authGoogle/authG');
        let callbackG      = require('./routes/authGoogle/callbackG');
        let logout         = require('./routes/logout');
        let administrator  = require('./routes/administrator');
        let tertium        = require('./routes/tertium');
        let resources      = require('./routes/resources');
        let log            = require('./routes/log');
        let publice        = require('./routes/public');
        let profile        = require('./routes/profile');
        let tags           = require('./routes/tags');
        let help           = require('./routes/help');
        let errors         = require('./routes/errors');
        let devnull        = require('./routes/devnull/devnull');
        
        // === MIDDLEWARE-ul RUTELOR ===
        app.use('/auth',           authG);
        app.use('/callback',       callbackG);
        app.use('/logout',         logout);
        app.use('/',               csurfProtection, index);
        app.use('/resursepublice', csurfProtection, publice);
        app.use('/tertium',        csurfProtection, tertium);
        app.use('/help',           csurfProtection, help);
        app.use('/administrator',  csurfProtection, UserPassport.ensureAuthenticated, administrator);
        app.use('/resources',      csurfProtection, UserPassport.ensureAuthenticated, resources);
        app.use('/log',            csurfProtection, UserPassport.ensureAuthenticated, log);
        app.use('/profile',        csurfProtection, profile);
        app.use('/tag',            csurfProtection, tags);
        app.use('/errors',         csurfProtection, errors);
        app.use('/devnull',        csurfProtection, devnull);
        
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
        
        // Afișează informații utile la start
        console.info("Memoria RAM alocată la pornire este de:  \x1b[32m", formatBytes(process.memoryUsage().rss), `\x1b[37m`);
        if( process.env.NODE_ENV === 'production') {
            console.info("Aplicația rulează în modul \x1b[32m", app.get("env"), `\x1b[37m`);
        } else if (process.env.NODE_ENV === 'development') {
            console.info("Aplicația rulează în modul \x1b[32m", app.get("env"), `\x1b[37m`);
        }
        
        /* === Pornește serverul! === */
        let port = process.env.PORT || 8080;
        let hostname = os.hostname();
        var server = http.listen(port, '0.0.0.0', function cbConnection () {
            console.log(`Nume app:\x1b[32m ${process.env.APP_NAME }\x1b[37m, versiunea: \x1b[32m`, process.env.APP_VER, '\x1b[37m');
            console.log(`Hostname: \x1b[32m ${hostname}\x1b[37m, \n port: \x1b[32m${process.env.PORT}\x1b[37m, \n proces no: \x1b[32m${process.pid}\x1b[37m, \n node: \x1b[32m${process.version}\x1b[37m`);
        });
        server.on('error', onError);
        
        /**
         * Event listener for HTTP server "error" event.
         * https://stackoverflow.com/questions/65823016/i-cant-seem-to-make-a-socket-io-connection
         */
        
        function onError(error) {
            if (error.syscall !== 'listen') {
                throw error;
            }
            var bind = typeof port === 'string'
                ? 'Pipe ' + port
                : 'Port ' + port;
        
            // handle specific listen errors with friendly messages
            switch (error.code) {
                case 'EACCES':
                    console.error(bind + ' are nevoie de privilegii înalte');
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(bind + ' deja folosit de altă aplicație sau de un proces fantomă');
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        }
        
        /* === GESTIONAREA evenimentelor pe `process` și a SEMNALELOR === */
        
        // gestionează erorile care ar putea aprea în async-uri netratate corespunzător sau alte promisiuni.
        process.on('uncaughtException', (err) => {
            console.log('[app.js] A apărut un "uncaughtException" cu detaliile: ', err.message);
            logger.error(`${err.message} ${err.stack}`);
            // process.kill(process.pid, 'SIGTERM');
            process.nextTick( function exitProcess () {
                // FIXME
                // dbconn.disconnect(() => {
                //     console.log('Am închis conexiunea la MongoDb!');
                // });
                process.exit(1);
            });
        });
        
        // tratarea promisiunilor respinse
        process.on('unhandledRejection', (reason, promise) => {
            console.log('[app.js] O promisiune a fost respinsă fără a fi tratată respingerea', promise, ` având motivul ${reason}`);
            logger.error(`${promise} ${reason}`);
            process.nextTick( function exitProcess () {
                // dbconn.disconnect(() => {
                //     console.log('Am închis conexiunea la MongoDb!');
                // });
                process.exit(1);
            });
        });
        
        process.on('SIGINT', function onSiginit (signal) {
            FIXME:
            // dbconn.disconnect(() => {
            //     console.log('Am închis conexiunea la MongoDb!');
            // });
            console.info(`Procesul a fost întrerupt (CTRL+C). Închid procesul ${process.pid}! Data: `, new Date().toISOString());
            process.exit(0);
        });
        
        process.on('SIGTERM', function onSiginit () {
            dbconn.disconnect(() => {
                console.log('Am închis conexiunea la MongoDb!');
            });
            /* Închide conexiunea la Redis */
            (async function closeRedisConnection () {
                await redisCachedInstance.disconnect(); // închide conexiunea la Redis
            })()
            console.info('Am prins un SIGTERM (stop). Închid procesul! Data: ', new Date().toISOString());
            shutdownserver();
        });
        
        process.on('beforeExit', (code) => {
            console.log('Process beforeExit event with code: ', code);
         });
        
        process.on('exit', code => {
            console.log(`Procesul a fost încheiat având codul: `, code);
        });
        
        function shutdownserver () {
            server.close(function onServerClosed (err) {
                if (err) {
                    logger.error(err.message);
                    console.error(err.message, err.stack);
                    process.exitCode = 1;            
                }
                process.exit(1);
            });
        }    
    } catch (error) {
        console.log(error);
        logger.error(error);
    }
})()

