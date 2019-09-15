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

    /* =========== CONSTRUCȚIA BAG-ULUI ========= */
    /* SOCKETURI!!! */
    let lastBag = ''; // este o referință către un bag deja deschis
    let lastUuid = '';
    pubComm.on('connect', (socket) => {
        // Ascultă mesajele
        socket.on('mesaje', (mesaj) => {
            console.log('Standing by.... listening');
            console.log(mesaj);
        });

        // Primirea imaginilor pe socket conduce la crearea Bag-ului
        socket.on('resursa', function cbRes (resourceFile) {
            // setează uuid-ul local
            lastUuid = resourceFile.uuid;

            // creează calea pe care se va depozita.
            var calea = `${process.env.REPO_REL_PATH}${resourceFile.user}/`;

            // Transformarea Buffer-ului primit într-un stream `Readable`
            var strm = new Readable();
            strm.push(resourceFile.resF);  
            strm.push(null);
    
            // cazul în care BAG-ul EXISTĂ DEJA, setează valoarea locală uuid
            if (resourceFile.uuid) {                
                // setează calea către directorul deja existent al resursei
                calea += `${resourceFile.uuid}`;
                // constituie mediul Bag-ului
                var bagExistent = BagIt(calea, 'sha256');
                lastBag = bagExistent;

                // introdu un nou fișier în Bag
                strm.pipe(bagExistent.createWriteStream(`${resourceFile.numR}`));
                // construiește obiectul de răspuns.
                var responseObj4AddedFile = {
                    success: 1,
                    uuid: resourceFile.uuid,
                    file: `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${resourceFile.uuid}/data/${resourceFile.numR}`
                };
                // trimite înapoi obiectul care reprezintă fișierul creat în Bag-ul resursei
                socket.emit('resursa', responseObj4AddedFile);
            } else {
                // cand ai primit date pe `res`, generează mai întâi de toate uuid-ul. Este valabil pentru primul fișier care va iniția crearea bag-ului
                var uuidV1 = '';
                if (lastUuid) {
                    uuidV1 = lastUuid; // asta înseamnă că deja a fost încărcat un fișier tip document și s-a creat un uuid al resursei
                } else {
                    uuidV1 = uuidv1(); // dacă nu a fost încărcat niciun fișier tip document, înseamnă că mai întâi se introduc imagini în editor
                }
                
                // în cazul în care NU EXISTĂ BAG-UL (resursă nouă), se va lua valoarea generată de uuidv1()
                calea += `${uuidV1}`;
                var bagNou = BagIt(calea, 'sha256', {'Contact-Name': `${resourceFile.name}`}); //creează bag-ul
                lastBag = bagNou;
                // crearea efectivă a resursei în bag
                strm.pipe(bagNou.createWriteStream(`${resourceFile.numR}`));                
                // construiește obiectul de răspuns.
                var responseObj = {
                    success: 1,
                    uuid: uuidV1,
                    file: `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${uuidV1}/data/${resourceFile.numR}`
                };
                // trimite înapoi obiectul care reprezintă fișierul creat în Bag-ul resursei
                socket.emit('resursa', responseObj);
            }
        });

        // În momentul în care se va apăsa butonul care creează resursa, se va închide și Bag-ul.
        socket.on('closeBag', () => {
            // finalizarea creării Bag-ului
            lastBag.finalize(() => {
                socket.emit('closeBag', 'Am finalizat închiderea bag-ului');
            });
        });
    });
    /* =========== CONSTRUCȚIA BAG-ULUI - END ========= */

    /* ========== ÎNCĂRCAREA UNIUI fișier cu `multer` ========= */
    var multer  = require('multer');
    var multer2bag = require('./multer-bag-storage');

    var storage = multer2bag({
        destination: function (req, file, cb) {
            console.log('Este file primit la metoda destination din storage settings: ', file);
            // generează un uuid care va fi numele noului subdirector corespondent unei resurse
            let uuidV1 = '';
            // verifică dacă nu cumva mai întâi utilizatorul a ales să încarce o imagine. În acest caz, lastUuid poartă valoarea setată anterior.
            if (lastUuid) {
                uuidV1 = lastUuid; // asta înseamnă că deja a fost încărcat un fișier tip document și s-a creat un uuid al resursei
            } else {
                uuidV1 = uuidv1(); // userul incarcă mai întâi de toate un  fișier tip document. Setezi uuid-ul pentru prima dată.
                // console.log(pubComm);
                pubComm.emit('uuid', uuidV1); // trimite clientului numele directorului pe care a fost salvată prima resursă încărcată      
            }
            // console.log(uuidV1);

            // Aceasta este cale pentru cazul în care nu există un director al resursei deja
            let firstDataPath = `${process.env.REPO_REL_PATH}${req.user.email}/${uuidV1}`;
            // Aceasta este calea pentru cazul în care deja există creat directorul resursei pentru că a fost încărcat deja un fișier.
            let existingDataPath = `${process.env.REPO_REL_PATH}${req.user.email}/${lastUuid}/data`;

            /* ======= Directorul utilizatorului nu există. Trebuie creat !!!! ========= */
            if (!fs.existsSync(firstDataPath)) {
                cb(null, firstDataPath);    // introdu primul fișier aici.
            } else if(fs.existsSync(existingDataPath)) {
                cb(null, existingDataPath);
            }
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }        
    });
    // unde stochezi fișierul
    // var storage = multer.diskStorage({
    //     destination: function (req, file, cb) {
    //         console.log('Este file primit la metoda destination din storage settings: ', file);
    //         // generează un uuid care va fi numele noului subdirector corespondent unei resurse
    //         let uuidV1 = '';
    //         // verifică dacă nu cumva mai întâi utilizatorul a ales să încarce o imagine. În acest caz, lastUuid poartă valoarea setată anterior.
    //         if (lastUuid) {
    //             uuidV1 = lastUuid; // asta înseamnă că deja a fost încărcat un fișier tip document și s-a creat un uuid al resursei
    //         } else {
    //             uuidV1 = uuidv1(); // userul incarcă mai întâi de toate un  fișier tip document. Setezi uuid-ul pentru prima dată.
    //             // console.log(pubComm);
    //             pubComm.emit('uuid', uuidV1); // trimite clientului numele directorului pe care a fost salvată prima resursă încărcată      
    //         }
    //         // console.log(uuidV1);

    //         // Aceasta este cale pentru cazul în care nu există un director al resursei deja
    //         let firstDataPath = `${process.env.REPO_REL_PATH}${req.user.email}/${uuidV1}/data`;
    //         let firstDataPath2 = `${process.env.REPO_REL_PATH}${req.user.email}/${uuidV1}`;
    //         // Aceasta este calea pentru cazul în care deja există creat directorul resursei pentru că a fost încărcat deja un fișier.
    //         let existingDataPath = `${process.env.REPO_REL_PATH}${req.user.email}/${lastUuid}/data`;
            
    //         // Transformarea Buffer-ului primit într-un stream `Readable`
    //         // var strm = new Readable();
    //         // strm.push(resourceFile.resF);  
    //         // strm.push(null);

    //         /* ======= Directorul utilizatorului nu există. Trebuie creat !!!! ========= */
    //         if (!fs.existsSync(firstDataPath)) {
    //             fsPromises.mkdir(firstDataPath, { recursive: true }).then(() => {
    //                 // FIXME: CREEAZĂ BAG, NU FILE!
    //                 var bagNou = BagIt(firstDataPath2, 'sha256', {'Contact-Name': `${req.user.googleProfile.name}`}); //creează bag-ul

    //                 lastBag = bagNou;
    //                 // crearea efectivă a resursei în bag
    //                 // strm.pipe(bagNou.createWriteStream(`${resourceFile.numR}`));
                    
    //                 cb(null, firstDataPath);    // introdu primul fișier aici.
    //             }).catch((error) => {
    //                 if (error) throw error;
    //             });
    //         } else if(fs.existsSync(existingDataPath)) {
    //             cb(null, existingDataPath);
    //         }
    //         // cb(null, process.env.REPO_REL_PATH);
    //     },
    //     // cum denumești fișierul
    //     filename: function (req, file, cb) {
    //         cb(null, file.originalname);
    //     }
    // });

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
        parts.shift();
        var cleanPath = parts.join('/');

        var filePath = `${process.env.BASE_URL}/${cleanPath}/data/${req.files[0].originalname}`;
        console.log('Calea formată înainte de a trimite înapoi: ', filePath);
        
        var resObj = {
            "success": 1,
            "file": {
                "url": `${filePath}`,
                "name": `${req.files[0].originalname}`
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
        // next();
    });

    return app;
};