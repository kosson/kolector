require('dotenv').config();
const fs          = require('fs-extra');
const path        = require('path');
// const querystring = require('querystring');
const BagIt       = require('bagit-fs');
const uuidv1      = require('uuid/v1');
const Readable    = require('stream').Readable;
const mongoose    = require('mongoose');
const moment      = require('moment');
const validator   = require('validator');
const esClient    = require('../elasticsearch.config');
const Resursa     = require('../models/resursa-red'); // Adu modelul resursei
const UserModel   = require('../models/user'); // Adu modelul unui user
const Log         = require('../models/logentry'); // Adu modelul unei înregistrări de jurnal

module.exports = (express, app, passport, pubComm) => {

    var router = express.Router();

    // Încarcă mecanismele de verificare ale rolurilor
    let makeSureLoggedIn = require('connect-ensure-login');
    let checkRole = require('./controllers/checkRole.helper'); // Verifică rolul pe care îl are contul    

    // IMPORTUL CONTROLLERELOR DE RUTE
    // Încarcă controlerul necesar tratării rutelor de autentificare
    var User = require('./controllers/user.ctrl')(passport);

    // ========== ROOT ==================
    var index = require('./index');
    app.use('/', index);

    // ========== ADMINISTRATOR ==========
    var admin = require('./administrator');
    app.use('/administrator', User.ensureAuthenticated, admin);

    // ========== RESURSE ================
    var resurse = require('./resurse')(router); // REFĂCUTĂ
    app.use('/resurse', User.ensureAuthenticated, resurse);

    // ========== JURNALIER ==============
    var log = require('./log');
    app.use('/log', User.ensureAuthenticated, log);

    // ========== RESURSE PUBLICE ========
    app.get('/resursepublice', (req, res) => {
        let resursePublice = Resursa.find({'generalPublic': 'true'}).sort({"date": -1}).limit(8);
        let promiseResPub = resursePublice.exec();
        promiseResPub.then((result) => {

            let scripts = [     
                {script: '/lib/moment/min/moment.min.js'}        
            ];

            let newResultArr = []; // noul array al obiectelor resursă
            result.map(function clbkMapResult (obi) {
                obi.dataRo = moment(obi.date).locale('ro').format('LLL');
                newResultArr.push(obi);
            });
            
            res.render('resursepublice', {
                title:   "Resurse publice",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                logoimg: "img/rED-logo192.png",
                user:    req.user,
                resurse: newResultArr,
                scripts
            });
        }).catch((err) => {
            if (err) throw err;
        });
    });

    app.get('/resursepublice/:idres', (req, res) => {
        var record = require('./controllers/resincredid.ctrl')(req.params); // aduce resursa și transformă conținutul din JSON în HTML
        record.then(result => {
            let scripts = [      
                {script: '/js/redincredadmin.js'},       
                {script: '/lib/moment/min/moment.min.js'}        
            ];
            res.render('resursa-publica', {
                user:    req.user,
                title:   "RED public",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                logoimg: "/img/red-logo-small30.png",
                credlogo: "../img/CREDlogo.jpg",
                resursa: result,
                scripts
            });
        }).catch(err => {
            if (err) {
                console.log(err);
            }
        });
    });

    // ========== TAGS ===================

    app.get('/tags/:tag', (req, res) => {
        let params = req.params.trim();
        var records = require('./controllers/tag.ctrl')(params); // aduce toate resursele care au tagul asociat
    });

    // ========== LOGIN ==========
    app.get('/login', User.login);
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/', // redirectează userul logat cu succes către pagina de landing
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
    
    // ========== LOGOUT ==========
    app.get('/logout', function(req, res){
        req.logout();
        // req.session.destroy(function (err) {
        //     if (err) throw new Error('A apărut o eroare la logout: ', err);
        //     res.redirect('/');
        // });
        res.redirect('/');
    });
    
    // ========== PROFILUL PROPRIU ==========
    app.get('/profile', makeSureLoggedIn.ensureLoggedIn(), function clbkProfile (req, res) {
        res.render('profile', {
            user:    req.user,
            title:   "Profil",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            activePrfLnk: true
        });
    });

    // ACCESAREA PROPRIILOR RESURSE
    app.get('/profile/resurse', makeSureLoggedIn.ensureLoggedIn(), function(req, res){
            // console.dir(req.user.email);
            var count = require('./controllers/resincred.ctrl')(req.user);
            // console.log(count);
            count.then(result => {
                // console.log(rezultat);
                let newResultArr = []; // noul array al obiectelor resursă
                result.map(function clbkMapResult (obi) {
                    obi.dataRo = moment(obi.date).locale('ro').format('LLL');
                    newResultArr.push(obi);
                });

                let scripts = [       
                    {script: '/lib/moment/min/moment.min.js'}
                ];

                res.render('resurse-profil', {
                    user:    req.user,
                    title:   "Profil",
                    style:   "/lib/fontawesome/css/fontawesome.min.css",
                    logoimg: "/img/red-logo-small30.png",
                    credlogo: "../img/CREDlogo.jpg",
                    resurse: newResultArr,
                    scripts
                });
            }).catch(err => {
                if (err) throw err;
            });
        }
    );

    // În cazul administratorilor, aceștia au acces la mecanismele de validare
    app.get('/profile/resurse/:idres', User.ensureAuthenticated, function(req, res){
        // Adu înregistrarea resursei cu toate câmpurile referință populate deja
        // FIXME: verifică dacă există în Elasticsearch înregistrarea corespondentă, dacă nu folosește .esSynchronize() a lui mongoose-elasticsearch-xp

        const editorJs2html = require('./controllers/editorJs2HTML');

        // adu înregistrarea din MongoDB după ce a fost încărcată o nouă resursă
        Resursa.findById(req.params.idres).populate({
            path: 'competenteS'
        }).exec().then(resursa => {
            let localizat = moment(resursa.date).locale('ro').format('LLL');
            resursa.dataRo = `${localizat}`; // formatarea datei pentru limba română.

            // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client de date serializate]
            resursa.editorContent = JSON.stringify(resursa);

            console.log(resursa.coperta);

            let scripts = [      
                {script: '/js/redincredadmin.js'},
                {script: '/lib/moment/min/moment.min.js'},
                {script: '/lib/editorjs/editor.js'},
                {script: '/lib/editorjs/header.js'},
                {script: '/lib/editorjs/paragraph.js'},
                {script: '/lib/editorjs/list.js'},
                {script: '/lib/editorjs/image.js'},
                {script: '/lib/editorjs/table.js'},
                {script: '/lib/editorjs/attaches.js'},
                {script: '/lib/editorjs/embed.js'},
                {script: '/lib/editorjs/code.js'},
                {script: '/lib/editorjs/quote.js'},
                {script: '/lib/editorjs/inlinecode.js'},
                {script: '/js/res-shown.js'} 
            ];
            let roles = ["user", "cred", "validator"];
            let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
            
            /* ====== VERIFICAREA CREDENȚIALELOR ====== */
            if(req.session.passport.user.roles.admin){
                // Adaugă mecanismul de validare a resursei
                if (resursa.expertCheck) {
                    resursa.validate = `<input type="checkbox" id="valid" class="expertCheck" checked>`;
                } else {
                    resursa.validate = `<input type="checkbox" id="valid" class="expertCheck">`;
                }
                // Adaugă mecanismul de prezentare la public
                if (resursa.generalPublic) {
                    resursa.genPub = `<input type="checkbox" id="public" class="generalPublic" checked>`;
                } else {
                    resursa.genPub = `<input type="checkbox" id="public" class="generalPublic">`;
                }                
                res.render('resursa-admin', {
                    user:    req.user,
                    title:   "Administrare RED",
                    style:   "/lib/fontawesome/css/fontawesome.min.css",
                    scripts,
                    logoimg: "/img/red-logo-small30.png",
                    credlogo: "../img/CREDlogo.jpg",
                    resursa: resursa
                });
            } else if (confirmedRoles.includes('validator')) {
                // Adaugă mecanismul de validare a resursei
                if (resursa.expertCheck) {
                    resursa.validate = `<input type="checkbox" id="valid" class="expertCheck" checked>`;
                } else {
                    resursa.validate = `<input type="checkbox" id="valid" class="expertCheck">`;
                }
                res.render('resursa-validator', {
                    user:    req.user,
                    title:   "Administrare RED",
                    style:   "/lib/fontawesome/css/fontawesome.min.css",
                    scripts,
                    logoimg: "/img/red-logo-small30.png",
                    credlogo: "../img/CREDlogo.jpg",
                    resursa: resursa
                });
            } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
                res.render('resursa', {
                    user:    req.user,
                    title:   "Afișare RED",
                    style:   "/lib/fontawesome/css/fontawesome.min.css",
                    logoimg: "/img/red-logo-small30.png",
                    credlogo: "../img/CREDlogo.jpg",
                    resursa: resursa,
                    scripts
                });
            } else {
                res.redirect('/401');
            }
        }).catch(err => {
            if (err) {
                pubComm.emit('mesaje', `Nu pot să afișez resursa. Eroare: ${err}`);
                console.log(err);
            }
        });
    });

    // Sistem de asistență - HELP
    app.get('/help', makeSureLoggedIn.ensureLoggedIn(), function (req, res) {
        res.render('help', {
            user:    req.user,
            title:   "Asistență",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg"
        });
    });

    /* =========== CONSTRUCȚIA BAG-ULUI, INTRODUCEREA ÎNREGISTRĂRII, INTRODUCEREA ÎN ELASTICSEARCH ========= */
    let lastBag;   // este o referință către un bag deja deschis
    let lastUuid;  // referință către UUID-ul în efect
    
    /* SOCKETURI!!! */
    pubComm.on('connect', (socket) => {
        // Ascultă mesajele
        socket.on('mesaje', (mesaj) => {
            console.log(mesaj);
        });

        // Primirea imaginilor pe socket conduce la crearea Bag-ului
        socket.on('resursa', function clbkResursa (resourceFile) {
            // creează calea pe care se va depozita.
            var calea = `${process.env.REPO_REL_PATH}${resourceFile.user}/`; // FIXME: Folosește path.join în viitor să dăm și celor de pe Windows o șansă

            // Transformarea Buffer-ului primit într-un stream `Readable`
            var strm = new Readable();
            strm.push(resourceFile.resF);  
            strm.push(null);

            // dacă resursa primită nu are UUID, înseamnă că este prima. Tratează cazul primei resurse
            if (!resourceFile.uuid) {
                // setează lastUuid
                lastUuid = uuidv1();
                // ajustează calea adăugând fragmentul uuid
                calea += `${lastUuid}`;
                // generează bag-ul pentru user
                lastBag = BagIt(calea, 'sha256', {'Contact-Name': `${resourceFile.name}`}); //creează BAG-ul
                // adăugarea fișierului primit în Bag
                strm.pipe(lastBag.createWriteStream(`${resourceFile.numR}`));                
                // construiește obiectul de răspuns necesar lui Editor.js
                var responseObj = {
                    success: 1,
                    uuid: lastUuid,
                    file: `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${lastUuid}/data/${resourceFile.numR}`,
                    size: resourceFile.size
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
                    file: `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${resourceFile.uuid}/data/${resourceFile.numR}`,
                    size: resourceFile.size
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
                    // TODO: setează BAG-ul ca depozit git
                    socket.emit('closeBag', 'Am finalizat închiderea bag-ului');
                });
            } else {
                socket.emit('closeBag', 'Nu e niciun bag.');
            }
        });

        socket.on('log', (entry) => {
            var log = new Log({
                _id: new mongoose.Types.ObjectId(),
                date: Date.now(),
                title: entry.title,
                idContributor: entry.idContributor,
                autor: entry.autor,
                content: entry.content,
                contorAcces: entry.contorAcces
            });
            log.save().then((result) => {
                socket.emit('log', result);
            }).catch(err => {
                if (err) throw err;
            });            
        });

        // Introducerea resursei în baza de date MongoDB la finalizarea completării FORM01
        socket.on('red', (RED) => {
            // gestionează cazul în care nu ai un uuid generat pentru că resursa educațională, adică nu are niciun fișier încărcat
            if (!RED.uuid) {
                RED.uuid = uuidv1();
            }
            // Încarcă modelul cu date!!!
            var resursaEducationala = new Resursa({
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
                contorAcces:     0,
                generalPublic:   false,
                contorDescarcare:0,
                utilMie:         0,
                etichete:        RED.etichete
            });
            // SAVE!!! INDEXARE ÎN ACELAȘI MOMENT!
            var pResEd = resursaEducationala.populate('competenteS').execPopulate(); // returnează o promisiune
            pResEd.then(res => {
                res.save();
                socket.emit('red', res);
            }).catch(err => {
                if (err) throw err;
            });
        });

        // Ștergerea unei resurse
        socket.on('delresid', (resource) => {
            Resursa.findOneAndDelete({_id: resource.id}, (err, doc) => {
                if (err) throw err;
                // TODO: Sterge fizic directorul cu totul
                let dirPath = path.join(process.env.REPO_REL_PATH, resource.idContributor, resource.id);
                // console.log(dirPath);
                // fs.remove(dirPath, (err) => {
                //     if(err) throw err;
                //     console.log('Am șters directorul cu succes');
                //     socket.emit('delresid', 'Salut, client, am șters resursa: ', resource.id, 'contribuită de: ', resource.idContributor);
                // });
            });
        });

        // Aducerea resurselor pentru un id (email) și trimiterea în client
        socket.on('mkAdmin', (userSet) => {    
            // Atenție: https://mongoosejs.com/docs/deprecations.html#-findandmodify-
            let docUser = UserModel.findOne({_id: userSet.id}, 'admin');
            if (userSet.admin == true) {                
                docUser.exec(function clbkSetAdmTrue(error, doc) {
                    if (error) console.log(error);
                    doc.roles.admin = true;
                    doc.save().then(() => {
                        socket.emit('mesaje', 'Felicitări, ai devenit administrator!');
                    }).catch(err => {
                        if (err) throw err;
                    });
                });
            } else {
                docUser.exec(function clbkSetAdmFalse(error, doc) {
                    if (error) console.log(error);
                    doc.roles.admin = false;
                    doc.save().then(() => {
                        socket.emit('mesaje', 'Ai luat dreptul de administrare!');
                    }).catch(err => {
                        if (err) throw err;
                    });
                });
            }   
        });

        // Adaugă rol nou
        socket.on('addRole', (newRoles) => {
            let docUser = UserModel.findOne({_id: newRoles.id}, 'roles');
            // dacă vreunul din rolurile trimise nu există deja în array-ul din profilul utilizatorului, acesta va fi adăugat.
            docUser.exec(function clbkAddRole (error, doc) {
                if (error) console.log(error);
                newRoles.roles.map( rol => {                    
                    if (!doc.roles.rolInCRED.includes(rol)) {
                        doc.roles.rolInCRED.push(rol);
                    }
                });
                doc.save().then(() => {
                    socket.emit('mesaje', 'Am salvat rolurile');
                }).catch(err => {
                    if (err) throw err;
                });
            });
            // console.log(newRoles);
        });

        // Adaugă unit nou pentru utilizator
        socket.on('addUnit', (newUnits) => {
            let docUser = UserModel.findById(newUnits.id);

            docUser.exec(function clbkAddArrUnit (error, doc) {
                if (error) console.log(error);

                newUnits.units.map( unit => {
                    unit = unit.trim();
                    // dacă unit-ul nu există, va fi adăugat.
                    if (!doc.roles.unit.includes(unit)) {
                        doc.roles.unit.push(unit);
                    }
                });

                doc.save().then(() => {
                    socket.emit('mesaje', 'Am salvat noile unit-uri');
                }).catch(err => {
                    if (err) throw err;
                });
            });
        });

        // Validarea resursei
        socket.on('validateRes', (queryObj) => {
            // eveniment declanșat din redincredadmin.js
            let resQuery = Resursa.findOne({_id: queryObj._id}, 'expertCheck');
            resQuery.exec(function (err, doc) {
                doc.expertCheck = queryObj.expertCheck;
                doc.save().then(newdoc => {
                    socket.emit('validateRes', {expertCheck: newdoc.expertCheck});
                }).catch(err => {
                    if (err) throw err;
                });
            });
        });

        // setarea resursei drept publică
        socket.on('setPubRes', (queryObj) => {
            // eveniment declanșat din redincredadmin.js
            let resQuery = Resursa.findOne({_id: queryObj._id}, 'generalPublic');
            resQuery.exec(function (err, doc) {
                doc.generalPublic = queryObj.generalPublic;
                doc.save().then(newdoc => {
                    socket.emit('setPubRes', {generalPublic: newdoc.generalPublic});
                }).catch(err => {
                    if (err) throw err;
                });
            });
        });

        // căutarea resurselor după disciplinele selectate
        socket.on('searchresdisc', (queryObj) => {
            // console.log(queryObj);
            let resQuery = Resursa.find({
                discipline: {$all: queryObj}
            });
            resQuery.exec(function (err, docs) {
                // console.log(docs);
                socket.emit('searchresdisc', docs);
            });
        });
        
        // căutarea termenilor în Elasticsearch
        socket.on('searchres', (queryString) => {
            const body = {
                query: {
                    query_string: {
                        "query": queryString,
                        "fuzziness": 2,
                        "fields": ["title", "description", "etichete", "discipline"]
                    },
                    highlight: {
                        fields: {
                            title: {},
                            description: {}
                        }
                    }
                }
            };
            // TODO: Integrează gestionarea cuvintelor evidențiate returnate de Elasticsearch: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-highlighting
            var promiseMeData = searchDoc('resursedus', body, (err, result) => {
                if (err) console.log(err);
                return result;
            });
            promiseMeData.then((result) => {
                socket.emit('searchres', result.hits.hits);
            }).catch(console.log);
        });

        // căutarea unui utilizator
        socket.on('person', queryString => {
            // FIXME: Sanetizează inputul care vine prin `queryString`!!! E posibil să fie flood. Taie dimensiunea la un singur cuvânt!!!
            // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html
            const searchqry = {
                "query": {
                    "multi_match": {
                        "query": validator.trim(queryString),
                        "type": "best_fields",
                        "fields": ["email", "googleProfile", "name", "*_name"]        
                    }
                }
                // anterior am folosit https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html
                // de explorat: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-simple-query-string-query.html
            };

            // Se face căutarea în Elasticsearch!!!
            // Atenție, folosesc driverul nou conform: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/introduction.html E suuuuperfast! :D
            async function searchES7 () {
                try {
                    const {body} = await esClient.search({
                        index: 'users', 
                        body: searchqry
                    });
                    // AM ÎNREGISTRĂRI ÎN INDEX
                    if (body.hits.hits.length > 0) {               
                        // pentru fiecare id din elasticsearch, cauta daca există o înregistrare în MongoDB. Dacă nu există în Mongo, șterge din Elastic.
                        body.hits.hits.map((user) => {
                            // dacă documentul nu există în MongoDB, șterge înregistrarea din Elastic
                            UserModel.exists({_id: user._id}).then((result) => {
                                if (!result) {
                                    esClient.delete({
                                        index: 'users',
                                        type: 'user',
                                        id: user._id
                                    }).then((res) => {
                                        console.log(res);
                                        socket.emit('mesaje', `Pentru că documentul nu mai există în baza de date, l-am șters și de la indexare cu detaliile: ${res}`);
                                    }).catch((error)=>{
                                        console.log(error);
                                        socket.emit('mesaje', `Pentru că documentul nu mai există în baza de date, am încercat să-l șterg și din index, dar: ${error}`);
                                    });
                                } else {
                                    // dacă utilizatorul există și în MongoDB, dar și în ES7, trimite datele în client
                                    socket.emit('person', body.hits.hits);
                                }
                            }).catch((error) => {
                                if (error) {
                                    // console.log(error);
                                    socket.emit('mesaje', `Am interogat baza de date, dar a apărut eroarea: ${error}`);
                                }
                            });
                        });                    
                        // TODO: Aici ai putea testa daca ai date; daca nu ai date, tot aici ai putea face căutarea în baza Mongoose să vezi dacă există.     
                    } else {
                        // NU EXISTĂ ÎNREGISTRĂRI ÎN INDEX 
                        // TODO: Caută dacă adresa de email există în MongoDB. Dacă există și nu apare în index, indexeaz-o!
                        let trimStr = validator.trim(queryString);
                        // PAS 1 -> Analizează dacă `queryString` este un email
                        if (validator.isEmail(trimStr)) {
                            // caută în MongoDB dacă există emailul. În cazul în care există, indexează-l în Elasticsearch!
                            UserModel.exists({email: queryString}).then(async (result) => {
                                if (result) {
                                    await esClient.index({
                                        index: 'users',
                                        body: result
                                    });
                                    // forțează reindexarea pentru a putea afișa rezultatul la următoarea căutare!!!
                                    await client.indices.refresh({ index: 'users' });
                                    socket.emit('mesaje', `Am interogat baza de date și am găsit un email neindexat pe care l-am reindexat. Caută acum din nou!`);
                                }
                            }).catch((error) => {
                                if (error) {
                                    // console.log(error);
                                    socket.emit('mesaje', `Am interogat baza de date și am găsit un email neindexat, dar când am vrut să-l indexez, stupoare: ${error}`);
                                }
                            });
                        } else {
                            // TODO: Sanetizează ceea ce este primit prin trimming și limitare la dimensiune de caractere
                        }
                        socket.emit('mesaje', `Am căutat în index fără succes. Pur și simplu nu există înregistrări sau trebuie să schimbi cheia de căutare nițel`);
                    }
                } catch (error) {
                    console.log(error);
                    socket.emit('mesaje', `Din nefericire, căutarea utilizatorului a eșuat cu următoarele detalii: ${error}`);

                    // CAZUL index_not_found_exception
                    if (error.body.error.type == "index_not_found_exception") {
                        console.log("no index");
                        // https://github.com/jbdemonte/mongoose-elasticsearch-xp#creating-mappings-on-demand
                        // https://github.com/jbdemonte/mongoose-elasticsearch-xp/blob/master/test/es7/model-mapping.js
                        // https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-lang-analyzer.html#romanian-analyzer
                        UserModel.esCreateMapping({
                            // Vezi dacă este absolut necesară introducerea obiectului de configurare aici!
                            settings: {
                                analysis: {
                                    filter: {
                                        // elision: {
                                        //     type: 'elision',
                                        //     articles: ['l', 'm', 't', 'qu', 'n', 's', 'j', 'd'],
                                        // },
                                    },
                                    analyzer: {
                                        custom_romanian_analyzer: {
                                            tokenizer: 'standard',
                                            filter: [
                                                "lowercase",
                                                "romanian_stop",
                                                "romanian_keywords",
                                                "romanian_stemmer"
                                            ],
                                        },
                                        tag_analyzer: {
                                            tokenizer: 'keyword',
                                            filter: ['asciifolding', 'lowercase'],
                                        },
                                    },
                                },
                            },
                        }).then(function (response) {
                            //https://github.com/jbdemonte/mongoose-elasticsearch-xp/blob/master/test/es7/model-mapping.js
                            const options = UserModel.esOptions();
                            return options.client.indices.getSettings({
                                index: options.index,
                            });

                            console.log("Response: ", response);
                            // În cazul în care indexul nu există (considerăm că deja avem înregistrări în MongoDB care nu au fost indexate deja în ES7), 
                            // constitue unul nou din colecția existentă în MongoDB. Acesta este cazul în care faci backup doar la MongoDB și ai nevoie să reindexezi
            
                            UserModel.on('es-bulk-sent', function () {
                                console.log('buffer sent');
                            });
            
                            UserModel.on('es-bulk-data', function (doc) {
                                console.log('Introduc ' + doc);
                            });
                            
                            UserModel.on('es-bulk-error', function (err) {
                                console.error(err);
                            });
                            
                            UserModel
                                .esSynchronize()
                                .then(function () {
                                    console.log('Verifică acum');
                            });
                        }).catch(function(error){
                            console.log("putMapping Error: ", error);
                        });


                    } else if(error.body.error.type != "index_not_found_exception") {
                        console.log("error: elasticsearch client search");
                        console.log(error);
                    }
                }
            }
            searchES7(); // declanșează execuția funcției de căutare!
        });

        // FIȘA completă de utilizator
        socket.on('personrecord', id => {
            // TODO: constituie un query care să aducă înregistrarea de user și ultimele sale 5 contribuții RED
            // https://mongoosejs.com/docs/api.html#model_Model.populate

            UserModel.findById(id, function clbkFindById (error, user) {
                if (error) {
                    console.log(error);
                    socket.emit('mesaje', 'A dat eroare căutarea...');
                }
                // setează opțiunile pentru căutare
                var opts = [
                    {
                        path: 'resurse', 
                        options: {
                            sort: {date: -1} // 1 este ascending; -1 este descending (pornește cu ultima adusă)
                            // limit: 5
                        },
                        model: Resursa
                    }
                ];
                // Completarea datelor prin populare
                UserModel.populate(user, opts, function clbkExecPopUser (error, res) {
                    if (error) {
                        console.log(error);
                        socket.emit('mesaje', 'A dat eroare căutarea...');
                    }
                    // console.log(res);
                    socket.emit('personrecord', res);
                });
            });
        });

        // STATS GENERAL
        socket.on('stats', (projectionObj) => {
            if (projectionObj) {
                // pentru fiecare dintre descriptori adu un set de date pe care-l trimiți în frontend
                projectionObj.descriptors.map(function clbkTreatDecr (descriptor) {
                    // pentru fiecare set de date extras, voi emite înapoi pentru a fi creat element în pagină

                    // testează după valoarea descriptorului
                    if (descriptor === 'reds') {
                        const TotalREDs = Resursa.estimatedDocumentCount({}, function clbkResTotal (error, result) {
                            if (error) {
                                console.log(error);
                            } else {
                                // console.log(result);
                                socket.emit('stats', {reds: result});

                                return result;
                                // TODO: aici caută să compari printr-o funcție dacă numărul red-urilor indexate este același cu cel din bază
                            }                    
                        });
                    } else if (descriptor === 'users') {
                        const TotalUsers = UserModel.estimatedDocumentCount({}, function clbkUsersTotal (error, result) {
                            if (error) {
                                console.log(error);
                            } else {
                                socket.emit('stats', {users: result});
                                return result;
                            }          
                        });
                    }
                });
            } else {
                console.log('Nu știu ce se de date să constitui. NU am primit descriptori');
            }            
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
            mesaj:    "Nu-i, verifică linkul!"
        });
    });

    return app;
};