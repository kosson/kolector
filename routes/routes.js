require('dotenv').config();
const fs          = require(`fs-extra`);
const path        = require(`path`);
const querystring = require('querystring');
const BagIt       = require('bagit-fs');
const uuidv1      = require('uuid/v1');
const Readable    = require('stream').Readable;
const mongoose    = require('mongoose');
const Resursa     = require('../models/resursa-red'); // Adu modelul resursei

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
        console.log(req);
        res.render('red-atribuite', {
            user:     req.user,
            title:    "RED Atribuite",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg:  "../img/rED-logo192.png",
            credlogo: "../img/CREDlogo.jpg"
        });
    });

    app.get('/user/resurse/cred', User.resAtribuite, function(req, res) {
        res.render('red-in-cred', {
            title:    "RED Atribuite",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
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
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                logoimg: "/img/red-logo-small30.png",
                credlogo: "../img/CREDlogo.jpg"
            });
        }
    );
    // ACCESAREA PROPRIILOR RESURSE
    app.get('/profile/resurse', makeSureLoggedIn.ensureLoggedIn(), function(req, res){
            // console.dir(req.user.email);
            var count = require('./controllers/resincred.ctrl')(req.user);
            // console.log(count);
            count.then(rezultat => {
                // console.log(rezultat);
                res.render('red-in-cred', {
                    user:    req.user,
                    title:   "Profil",
                    style:   "/lib/fontawesome/css/fontawesome.min.css",
                    logoimg: "/img/red-logo-small30.png",
                    credlogo: "../img/CREDlogo.jpg",
                    resurse: rezultat
                });
            }).catch(err => {
                if (err) throw err;
            });
        }
    );
    // Aducere unei singure resurse contribuite de utilizator
    let checkRole = require('./controllers/checkRole.helper');
    app.get('/profile/resurse/:idres', User.ensureAuthenticated, function(req, res){
        // Adu înregistrarea resursei cu toate câmpurile referință populate deja
        var record = require('./controllers/resincredid.ctrl')(req.params);
        // FIXME: verifică dacă există în Elasticsearch înregistrarea corespondentă, dacă nu folosește .esSynchronize() a lui mongoose-elasticsearch-xp
        record.then(rezultat => {
            let scripts = [
                {script: '/lib/editorjs/editor.js'},
                {script: '/lib/editorjs/header.js'},
                {script: '/lib/editorjs/paragraph.js'},
                {script: '/lib/editorjs/list.js'},
                {script: '/lib/editorjs/image.js'},
                {script: '/lib/editorjs/table.js'},
                {script: '/lib/editorjs/attaches.js'},
                {script: '/lib/editorjs/embed.js'},
                {script: '/lib/editorjs/code.js'},
                {script: '/lib/editorjs/inlinecode.js'},
                // {script: '/js/main.js'},       
                {script: '/js/redincredadmin.js'},       
                {script: '/js/moment.min.js'}        
            ];
            let roles = ["user", "educred", "validator"];
            let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
            
            /* ====== VERIFICAREA CREDENȚIALELOR ====== */
            if(req.session.passport.user.roles.admin){
                res.render('resursa-admin', {
                    user:    req.user,
                    title:   "Administrare RED",
                    style:   "/lib/fontawesome/css/fontawesome.min.css",
                    scripts,
                    logoimg: "/img/red-logo-small30.png",
                    credlogo: "../img/CREDlogo.jpg",
                    resursa: rezultat
                });
            } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
                res.render('resursa', {
                    user:    req.user,
                    title:   "Afișare RED",
                    style:   "/lib/fontawesome/css/fontawesome.min.css",
                    logoimg: "/img/red-logo-small30.png",
                    credlogo: "../img/CREDlogo.jpg",
                    resursa: rezultat,
                    scripts
                });
            } else {
                res.redirect('/401');
            }
        }).catch(err => {
            if (err) throw err;
        });
    });

    // ========== ADMINISTRATOR ==========
    app.get('/administrator', User.ensureAuthenticated, admin);
    // TODO: RUTA ADMINISTRATOR:
    // -- verifică daca este autentificat și dacă este administrator.

    // ========== RESURSE ================
    const resurse = require('./resurse')(express.Router());
    app.use('/resurse', User.ensureAuthenticated, resurse); // stabilește rădăcina tuturor celorlalte căi din modulul resurse

    /* =========== CONSTRUCȚIA BAG-ULUI, INTRODUCEREA ÎNREGISTRĂRII, INTRODUCEREA ÎN ELASTICSEARCH ========= */
    /* SOCKETURI!!! */
    let lastBag;   // este o referință către un bag deja deschis
    let lastUuid;  // referință către UUID-ul în efect
    // EVENTS
    pubComm.on('connect', (socket) => {
        // Ascultă mesajele
        socket.on('mesaje', (mesaj) => {
            console.log('Standing by.... listening');
            console.log(mesaj);
        });

        // Primirea imaginilor pe socket conduce la crearea Bag-ului
        socket.on('resursa', function cbRes (resourceFile) {
            // creează calea pe care se va depozita.
            var calea = `${process.env.REPO_REL_PATH}${resourceFile.user}/`; // FIXME: Folosește path.join în viitor să dăm și celor de pe Windows o șansă

            // Transformarea Buffer-ului primit într-un stream `Readable`
            var strm = new Readable();
            strm.push(resourceFile.resF);  
            strm.push(null);

            // dacă resursa primită nu are uuid, înseamnă că este prima. Tratează cazul primei resurse
            if (!resourceFile.uuid) {
                // setează lastUuid
                lastUuid = uuidv1();
                // ajustează calea adăugând fragmentul uuid
                calea += `${lastUuid}`;
                // generează bag-ul pentru user
                lastBag = BagIt(calea, 'sha256', {'Contact-Name': `${resourceFile.name}`}); //creează bag-ul
                // adăugarea fișierului primit în Bag
                strm.pipe(lastBag.createWriteStream(`${resourceFile.numR}`));                
                // construiește obiectul de răspuns necesar lui Editor.js
                var responseObj = {
                    success: 1,
                    uuid: lastUuid,
                    file: `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${lastUuid}/data/${resourceFile.numR}`
                };
                // trimite înapoi în client obiectul de care are nevoie Editor.js
                socket.emit('resursa', responseObj);
            } else if (resourceFile.uuid && lastUuid === resourceFile.uuid) {
                // dacă lastUuid este același cu cel primit din client, avem de-a face cu aceeași resursă
                // setează calea către directorul deja existent al resursei
                calea += `${resourceFile.uuid}`;
                lastBag = BagIt(calea, 'sha256');
                // introdu un nou fișier în Bag
                strm.pipe(lastBag.createWriteStream(`${resourceFile.numR}`));
                // construiește obiectul de răspuns.
                var responseObj4AddedFile = {
                    success: 1,
                    uuid: resourceFile.uuid,
                    file: `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${resourceFile.uuid}/data/${resourceFile.numR}`
                };
                // trimite înapoi obiectul care reprezintă fișierul creat în Bag-ul resursei
                socket.emit('resursa', responseObj4AddedFile);
            } else {
                const err = new Error('message', 'nu pot încărca... se încearcă crearea unui bag nou');
            }
        });

        // În momentul în care se va apăsa butonul care creează resursa, se va închide și Bag-ul.
        socket.on('closeBag', () => {
            // finalizarea creării Bag-ului
            if (lastBag) {
                lastBag.finalize(() => {
                    socket.emit('closeBag', 'Am finalizat închiderea bag-ului');
                });
            } else {
                socket.emit('closeBag', 'Nu e niciun bag.');
            }
        });

        // Introducerea resursei în baza de date MongoDB
        socket.on('red', (RED) => {
            // gestionează cazul în care nu ai un uuid generat pentru că resursa educațională, adică nu are niciun fișier încărcat
            if (!RED.uuid) {
                RED.uuid = uuidv1();
            }
            // Încarcă modelul cu date!!!
            const resursaEducationala = new Resursa({
                _id:             new mongoose.Types.ObjectId(),
                date:            Date.now(),
                identifier:      RED.uuid,
                idContributor:   RED.idContributor,
                autori:          RED.nameUser,
                langRED:         RED.langRED,
                title:           RED.title,
                titleI18n:       RED.titleI18n,
                arieCurriculara: RED.arieCurriculara,
                level:           RED.level,
                discipline:      RED.discipline,
                competenteGen:   RED.competenteGen,
                competenteS:     RED.competenteS,
                activitati:      RED.activitati,
                grupuri:         RED.grupuri,
                domeniu:         RED.domeniu,
                functii:         RED.functii,
                demersuri:       RED.demersuri,
                spatii:          RED.spatii,
                invatarea:       RED.invatarea,
                description:     RED.description,
                dependinte:      RED.dependinte,
                coperta:         RED.coperta,
                licenta:         RED.licenta,
                content:         RED.content,
                bibliografie:    RED.bibliografie,
                expertCheck:     RED.expertCheck,
                etichete:        RED.etichete
            });
            // SAVE!!! INDEXARE ÎN ACELAȘI MOMENT!
            resursaEducationala.save().then(() => {
                Resursa.findOne({title: `${RED.title}`}).populate({
                    path: 'competenteS'
                }).execPopulate().then((res) => {
                    // res.redirect(`/profile/resurse/${RED.uuid}`);
                    resursaEducationala.on('es-indexed', (err, res) => {
                        if (err) throw err;
                        console.log('Resursa a fost indexată cu rezultatul: ', res);
                    });
                    socket.emit('red', res);
                });
            });
        });

        // Ștergerea unei resurse
        socket.on('delresid', (resource) => {
            console.log('Șterg resursa cu id-ul: ', resource);
            Resursa.findOneAndDelete({_id: resource.id}, (err, doc) => {
                if (err) throw err;
                console.log(doc);
                var docId = doc._id;
                // TODO: Sterge fizic directorul cu totul
                let dirPath = path.join(process.env.REPO_REL_PATH, resource.contribuitor, resource.id);
                console.log(dirPath);
                fs.remove(dirPath, (err) => {
                    if(err) throw err;
                    // console.log('Am șters directorul cu succes');
                    // socket.emit('delresid', 'Salut, client, am șters resursa: ', resource.id, 'contribuită de: ', resource.contributor);
                });
            });
        });
    });
    /* =========== CONSTRUCȚIA BAG-ULUI - END ========= */

    /* ========== ÎNCĂRCAREA UNUI fișier cu `multer` ========= */
    var multer  = require('multer');
    var multer2bag = require('./multer-bag-storage'); // încarcă mecanismul de storage special construit să gestioneze bag-uri!

    var storage = multer2bag({
        destination: function (req, file, cb) {
            // verifică dacă nu cumva mai întâi utilizatorul a ales să încarce o imagine. În acest caz, lastUuid poartă valoarea setată anterior.
            if (!lastUuid) {
                lastUuid = uuidv1(); // userul încarcă mai întâi de toate un  fișier tip document. Setezi uuid-ul pentru prima dată.
                pubComm.emit('uuid', lastUuid); // trimite clientului numele directorului pe care a fost salvată prima resursă încărcată
            }

            // Aceasta este cale pentru cazul în care nu există un director al resursei deja
            let firstDataPath = `${process.env.REPO_REL_PATH}${req.user.email}/${lastUuid}`;
            // Aceasta este calea pentru cazul în care deja există creat directorul resursei pentru că a fost încărcat deja un fișier.
            let existingDataPath = `${process.env.REPO_REL_PATH}${req.user.email}/${lastUuid}`;

            /* ======= Directorul utilizatorului nu există. Trebuie creat !!!! ========= */
            if (!fs.existsSync(firstDataPath)) {
                cb(null, firstDataPath);    // introdu primul fișier aici.
            } else if(fs.existsSync(existingDataPath)) {
                // cb(null, existingDataPath); // păstrează spațiile fișierului original dacă acestea le avea. La întoarcere în client, va fi un path rupt de spații.
                cb(null, existingDataPath);
            }
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }        
    });

    // Funcție helper pentru filtrarea extensiilor acceptate
    let fileFilter = function fileFltr (req, file, cb) {
        var fileObj = {
            "image/png": ".png",
            "image/jpeg": ".jpeg",
            "image/jpg": ".jpg",
            "application/pdf": ".pdf",
            "application/msword": ".doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
            "application/vnd.ms-powerpoint": ".ppt",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
            "application/octet-stream": ".zip",
            "application/vnd.oasis.opendocument.text": ".odt",
            "application/vnd.oasis.opendocument.presentation": ".odp"
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
    }); // multer() inițializează pachetul

    app.post('/repo', User.ensureAuthenticated, upload.any(), function(req, res){
        // console.log('Detaliile lui files: ', req.files);
        var fileP = req.files[0].path;
        var parts = fileP.split('/');
        parts.shift(); // necesar pentru a șterge punctul din start-ul căii
        var cleanPath = parts.join('/'); // reasamblează calea curată

        // var fileName = querystring.escape(req.files[0].originalname);
        var fileName = req.files[0].originalname;
        var filePath = `${process.env.BASE_URL}/${cleanPath}/data/${fileName}`;
        // console.log('Calea formată înainte de a trimite înapoi: ', filePath);
        
        var resObj = {
            "success": 1,
            "file": {
                "url": `${filePath}`,
                "name": `${fileName}`
            }
        };
        // FIXME: În momentul în care utilizatorul decide să șteargă resursa din fișier, acest lucru ar trebui să se reflecte și pe hard disk.
        // Creează logica de ștergere a resursei care nu mai există în Frontend. Altfel, te vei trezi cu hardul plin de fișiere orfane.
        res.send(JSON.stringify(resObj));
    });
    // ========== ÎNCĂRCAREA UNUI FIȘIER cu `multer` - END =========

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
    });

    return app;
};