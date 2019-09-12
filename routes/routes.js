require('dotenv').config();
const fs         = require(`fs`);
const fsPromises = require(`fs`).promises;
const path       = require(`path`);
const BagIt      = require('bagit-fs');
const uuidv1     = require('uuid/v1');
var Readable     = require('stream').Readable;

module.exports = (express, app, passport, pubComm) => {
    /* GESTIONAREA RUTELOR */
    // IMPORTUL CONTROLLERELOR DE RUTE
    var index   = require('./index');
    // var login   = require('./login'); FIXME: elimină toate fișierele de tratare a rutelor
    var admin   = require('./administrator');

    // ========== / ==========
    app.get('/', index);

    // Încarcă controlerul necesar tratării rutelor de autentificare
    const User = require('./controllers/user.ctrl')(passport);

    // ========== LOGIN ==========
    app.get('/login', User.login);
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/resurse', // redirectează userul logat cu succes către resurse
        failureRedirect: '/login'    // dacă a apărut o eroare, reîncarcă userului pagina de login TODO: Fă să apară un mesaj de eroare!!!
    }));

    // ========== AUTH ==========
    app.get('/auth', User.auth); // Încarcă template-ul hbs pentru afișarea butonului de autorizare
    // AUTH/GOOGLE -> RUTA BUTONULUI CATRE SERVERUL DE AUTORIZARE (trebuie să ai deja ClientID și Secretul)
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email']}));
    // RUTA PE CARE VINE RĂSPUNSUL SERVERULUI DE AUTORIZARE
    app.get('/callback', passport.authenticate('google', { failureRedirect: '/auth'}), function(req, res) {
        res.redirect('/resurse');
    });

    // ========== USER ==========
    /* Este ruta care încarcă resursele atribuite utilizatorului, fie proprii, fie asignate */
    app.get('/user/resurse', User.resAtribuite, function(req, res) {
        // console.log('Ce există în headerul de autorizare', req.get('authorization'));
        res.render('red-atribuite', {
            user:     req.user,
            title:    "RED Atribuite",
            logoimg:  "../img/rED-logo192.png",
            credlogo: "../img/CREDlogo.jpg"
        });
    });

    app.get('/user/resurse/cred', User.resAtribuite, function(req, res) {
        res.render('red-in-cred', {
            title:    "RED Atribuite",
            logoimg:  "../img/rED-logo192.png",
            credlogo: "../img/CREDlogo.jpg"
        });
    });

    //  ========== LOGOUT ==========
    app.get('/logout', function(req, res){
        req.logout();
        // req.session.destroy(function (err) {
        //     if (err) throw new Error('A apărut o eroare la logout: ', err);
        //     res.redirect('/');
        // });
        res.redirect('/');
    });
    
    let makeSureLoggedIn = require('connect-ensure-login');
    
    // ========== PROFILUL PROPRIU ==========
    app.get('/profile',
        makeSureLoggedIn.ensureLoggedIn(),
        function(req, res){
            // console.dir(req.user);
            res.render('profile', {
                user:    req.user,
                title:   "Profil",
                logoimg: "/img/red-logo-small30.png",
            });
        }
    );
    // ========== ADMINISTRATOR ==========
    app.get('/administrator', User.ensureAuthenticated, admin);
    // TODO: RUTA ADMINISTRATOR:
    // -- verifică daca este autentificat și dacă este administrator.

    // ========== RESURSE ================
    const resurse = require('./resurse')(express.Router());
    app.use('/resurse', User.ensureAuthenticated, resurse); // stabilește rădăcina tuturor celorlalte căi din modulul resurse

    /* SOCKETURI!!! */
    
    /* =========== ÎNCĂRCAREA UNEI IMAGINI PRIN STABILIREA UNUI BAG ========= */
    pubComm.on('resursa', function cbREs (resourceFile) {
        // cand ai primit date pe `res`, generează mai întâi de toate uuid-ul. Este valabil pentru primul fișier care va iniția crearea bag-ului
        var uuidV1  = uuidv1();
        // creează calea pe care se va depozita.
        var calea   = `${process.env.REPO_REL_PATH}/${resourceFile.email}/`;

        // cazul în care resursa deja există, setază valoarea locală uuid
        if (resourceFile.uuid) {
            calea += `${resourceFile.uuid}`;
        } else {
            // în acest caz, se va lua valoarea generată de uuidv1()
            calea += `${uuidV1}`;
        }
        // FIXME: caută o cale să aduci numele complet al utilizatorului.
        var bag     = BagIt(calea, 'sha256', {'Contact-Name': `${resourceFile.email}`}); //creează bag-ul
        // construiește obiectul de răspuns.
        var responseObj = {
            uuid: uuidV1
        };
        // FIXME: Termină implementarea!
    });
    /* =========== ÎNCĂRCAREA UNEI IMAGINI PRIN STABILIREA UNUI BAG ========= */


    /* ========== ÎNCĂRCAREA UNEI IMAGINI cu `multer` ========= */
    // app.use(express.static(path.join(__dirname, 'repo')));  // static pe repo
    var multer  = require('multer');
    var storage = multer.diskStorage({
        // unde stochezi fișierul
        destination: function (req, file, cb) {
            // generează un uuid care va fi numele noului subdirector corespondent unei resurse
            let uuidV1 = uuidv1();
            // Aceasta este cale pentru cazul în care nu există un director al resursei deja
            let firstData = process.env.REPO_REL_PATH + req.user.email + '/' + uuidV1 + '/data';
            // Aceasta este calea pentru cazul în care deja există creat directorul resursei pentru că a fost încărcat deja un fișier.
            let existingData = process.env.REPO_REL_PATH + req.user.email;

            /* ======= Directorul utilizatorului nu există. Trebuie creat !!!! ========= */
            if (!fs.existsSync(firstData)) {
                fsPromises.mkdir(firstData, { recursive: true }).then(() => {
                    pubComm.emit('uuid', uuidV1); // trimite clientului numele directorului pe care a fost salvată prima resursă încărcată
                    cb(null, firstData); // FIXME: construiește alternativa cu bag-it
                }).catch((error) => {
                    if (error) throw error;
                });
            } else if(fs.existsSync(existingData)) {
                // în cazul în care subdirectorul există, setează variabila `uuidV1` la valoarea primită din client 
                // pubComm.on('uuid', (uuid) => {
                //     uuidV1 = uuid;
                // });
                // În cazul în care directorul utilizatorului există, generează un nou uuid sau folosește-l pe cel primit de la user 
                // pentru că inseamnă că face parte din aceleși set al uuid-ului stabilit anterior.
                console.log('directorul există deja');
            }
            // cb(null, process.env.REPO_REL_PATH);
        },
        // cum denumești fișierul
        filename: function (req, file, cb) {
            cb(null, file.originalname + '-' + Date.now());
        }
        // TODO: construirea alternativei 
    });

    // Funcție helper pentru filtrarea extensiilor acceptate
    let fileFilter = function fileFltr (req, file, cb) {
        var fileObj = {
            "image/png": ".png",
            "image/jpeg": ".jpeg",
            "image/jpg": ".jpg"
        };
        if (fileObj[file.mimetype] == undefined) {
            cb(new Error("file format not valid"), false); // nu stoca fișierul și trimite eroarea
        } else {
            cb(null, true); // acceptă fișierul pentru a fi stocat
        }
    };

    // crearea mecanismului de stocare pentru ca multer să știe unde să trimită
    var upload = multer({
        storage: storage,
        limits: {
            // fileSize: 1024 * 1024 * 5 // limitarea dimensiunii fișierelor la 5MB
            fileSize: process.env.FILE_LIMIT_UPL_RES
        },
        fileFilter: fileFilter
    }).any(); // multer() inițializează pachetul

    app.post('/repo', User.ensureAuthenticated, upload, function(req, res){
        // console.log(req.files);
        var filePlace = `${process.env.BASE_URL}/${req.files[0].path}`;
        // console.log(req.files.path);
        var resObj = {
            "success": 1,
            "file": {
                "url": `${filePlace}`
            }
        };
        console.log(JSON.stringify(resObj));
        // FIXME: În momentul în care utilizatorul decide să șteargă resursa din fișier, acest lucru ar trebui să se reflecte și pe harddisc.
        // Creează logica de ștergere a resursei care nu mai există în Frontend. Altfel, te vei trezi cu hardul plin de fițiere orfane.
        res.send(JSON.stringify(resObj));
    });
    // ========== ÎNCĂRCAREA UNEI IMAGINI cu `multer` - END =========

    // ========== 401 - NEPERMIS ==========
    app.get('/401', function(req, res){
        res.status(401);
        res.render('nepermis', {
            title:    "401",
            logoimg:  "img/red-logo-small30.png",
            mesaj:    "Încă nu ești autorizat pentru acestă zonă"
        });
    });

    //========== 404 - NEGĂSIT ==========
    app.use('*', function (req, res, next) {
        res.render('negasit', {
            title:    "404",
            logoimg:  "/img/red-logo-small30.png",
            imaginesplash: "/img/theseAreNotTheDroids.jpg",
            mesaj:    "Nu am gasit pagina căutată. Verifică linkul!"
        });
        // next();
    });

    return app;
};