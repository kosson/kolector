require('dotenv').config();
const fs          = require('fs-extra');
const archiver    = require('archiver');
const path        = require('path');
// const querystring = require('querystring');
const BagIt       = require('bagit-fs');
const {v4: uuidv4}= require('uuid'); // https://github.com/uuidjs/uuid#deep-requires-now-deprecated
const Readable    = require('stream').Readable;
const mongoose    = require('mongoose');
const validator   = require('validator');
const esClient    = require('../elasticsearch.config');
const Resursa     = require('../models/resursa-red'); // Adu modelul resursei
const UserSchema  = require('../models/user'); // Adu schema unui user
const Log         = require('../models/logentry');
const editorJs2HTML= require('../routes/controllers/editorJs2HTML');

// funcțiile de căutare
const {findInIdx, aggFromIdx} = require('./controllers/elasticsearch.ctrl');

module.exports = function sockets (pubComm) {
    /* === FUNCȚII HELPER PENTRU LUCRUL CU SOCKET-URI */
    // EMIT
    function rre (nameEvt, payload) {
        pubComm.on('connect', socket => {
            return socket.emit(nameEvt, payload);
        });
    }
    // ON
    function rro (nameEvt, cb) {
        pubComm.on('connect', socket => {
            return socket.on(nameEvt, cb);
        });
    }

    /* === CONSTRUCȚIA BAG-ULUI, INTRODUCEREA ÎNREGISTRĂRII, INTRODUCEREA ÎN ELASTICSEARCH === */
    let lastBag;   // este o referință către un bag deja deschis
    let lastUuid;  // referință către UUID-ul în efect

    /* === SOCKETURI!!! === */
    pubComm.on('connect', (socket) => {
        // === MESAJE === ::Ascultă mesajele
        socket.on('mesaje', function cbMesaje (mesaj) {
            console.log(mesaj);
        });

        // === COMPETENȚELE SPECIFICE ===
        socket.on('csuri', function cbCsuri (data) {
            console.log(data);// De ex: [ 'arteviz3', 'stanat3' ] `data` sunt codurile disciplinelor selectate
            
            const CSModel = require('../models/competenta-specifica');
            // Proiecția se constituie pe același câmp, dar pe valorile primite prin socket.
            CSModel.aggregate([{$match: {
                coddisc: {$in: data}
            }}]).then(rez => {
                pubComm.emit('csuri', JSON.stringify(rez));
            });
        }); // apel al funcția `cbCsuri` de mai jos

        // === RESURSA === ::Primește fișiere, fapt care conduce la crearea Bag-ului, dacă userul alege încărcarea prima dată a unui fișier.
        socket.on('resursa', function clbkResursa (resourceFile) {
            /* 
                Obiectul primit `resourceFile` este `objRes` din `form01adres` și are următoarea semnătură
                {
                    user: RED.idContributor, // este de forma "5e31bbd8f482274f3ef29103" [înainte era email-ul]
                    name: RED.nameUser,      // este de forma "Nicu Constantinescu"
                    uuid: RED.uuid,          // dacă deja a fost trimisă o primă resursă, înseamnă că în `RED.uuid` avem valoare deja. Dacă nu, la prima încărcare, serverul va emite unul înapoi în client
                    resF: file,              // este chiar fișierul: lastModified: 1583135975000  name: "Sandro_Botticelli_083.jpg" size: 2245432 type: "image/jpeg"
                    numR: file.name,         // name: "Sandro_Botticelli_083.jpg"
                    type: file.type,         // type: "image/jpeg"
                    size: file.size
                };
            */
            
            // creez calea către subdirectorul corespunzător userului
            var calea = `${process.env.REPO_REL_PATH}${resourceFile.user}/`;

            // Transformarea Buffer-ului primit într-un stream `Readable`
            var strm = new Readable();
            strm.push(resourceFile.resF);  
            strm.push(null);

            // dacă resursa primită nu are UUID, înseamnă că este prima. Tratează cazul primei resurse
            if (!resourceFile.uuid) {
                // setează lastUuid
                lastUuid = uuidv4();
                // ajustează calea adăugând fragmentul uuid
                calea += `${lastUuid}`;
                // generează bag-ul pentru user particularizând cu email-ul
                lastBag = BagIt(calea, 'sha256', {'Contact-Name': `${resourceFile.name}`}); //creează BAG-ul
                // adăugarea fișierului primit în Bag
                strm.pipe(lastBag.createWriteStream(`${resourceFile.numR}`)); // SCRIE PE HARD               
                // construiește obiectul de răspuns necesar lui Editor.js
                var responseObj = {
                    success: 1,
                    uuid: lastUuid,
                    file: `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${lastUuid}/data/${resourceFile.numR}`,
                    size: resourceFile.size
                };
                // trimite înapoi în client obiectul de care are nevoie Editor.js pentru confirmare
                socket.emit('resursa', responseObj);
            // } else if (resourceFile.uuid && lastUuid === resourceFile.uuid) {
            } else if (resourceFile.uuid) {
                // dacă este primit un uuid din client, scrie fișierul în acel uuid!!
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
                // trimite înapoi obiectul necesar confirmării operațiunii lui Editor.js
                socket.emit('resursa', responseObj4AddedFile);
            } else {
                const err = new Error('message', 'nu pot încărca... se încearcă crearea unui bag nou');
                console.error(err.message);                
            }
        });

        socket.on('createtempver', function clbkUpdateRes (resourceFile) {
            /* 
                Obiectul primit `resourceFile` este `objRes` din `personal-res` și are următoarea semnătură:
                {
                    user: RED.idContributor, // este de forma "5e31bbd8f482274f3ef29103" [înainte era email-ul]
                    name: RED.nameUser,      // este de forma "Nicu Constantinescu"
                    uuid: RED.uuid,          // dacă deja a fost trimisă o primă resursă, înseamnă că în `RED.uuid` avem valoare deja. Dacă nu, la prima încărcare, serverul va emite unul înapoi în client
                    resF: file,              // este chiar fișierul: lastModified: 1583135975000  name: "Sandro_Botticelli_083.jpg" size: 2245432 type: "image/jpeg"
                    numR: file.name,         // name: "Sandro_Botticelli_083.jpg"
                    type: file.type,         // type: "image/jpeg"
                    size: file.size
                };
            */
            
            // setează calea către directorul deja existent al resursei
            var caleS = `${process.env.REPO_REL_PATH}${resourceFile.user}/${resourceFile.uuid}`; // calea sursă
            var caleD = `${process.env.REPO_REL_PATH}${resourceFile.user}/${resourceFile.uuid}/versions`; // calea destinație
            var marcaT= Date.now();

            /* === ARHIVEAZĂ DIRECTORUL ȘI MUTĂ-L ÎN `/versions` === */
            // Verifică mai întâi dacă există subdirectorul resursei
            fs.ensureDir(caleaS, 0o2775).then(function clbkSubdirExists () {
                    
                /* === ARHIVEAZĂ === */
                // verifică dacă directorul `/versions` în care se face salvarea există
                fs.ensureDir(caleD, 0o2775).then(function clbkCreateArchive () {
                    // Vezi dacă există un subdirector al resursei, iar dacă există șterge tot conținutul său [https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/emptyDir.md#emptydirdir-callback]
                    var path2ver = `${caleD}/${marcaT}`;
                    // console.log('Copiez directorul pe calea: ', path2deres);

                    // Copiază întregul conținut în `/versions` => #1 Constituie un array de promisiuni
                    const bagFiles = [
                        fs.move(`${caleS}/manifest-sha256.txt`, `${path2ver}/manifest-sha256.txt`),
                        fs.move(`${caleS}/bagit.txt`, `${path2ver}/bagit.txt`),
                        fs.move(`${caleS}/bag-info.txt`, `${path2ver}/bag-info.txt`)
                    ];
                    //#2 Rezolvă-le pe toate
                    Promise.all(bagFiles).then(
                        function clbkCreateDataDir () {
                            fs.ensureDir(`${path2ver}/data`, 0o2775).then(function clbkDataInVers () {
                                fs.copy(`${caleS}/data`, `${path2ver}/data`).then(function clbkCopiereOK () {
                                    // Șterge fișierul JSON din /data!!!
                                    fs.readdir(`${caleS}/data`, function clbkDelJSON (err, files) {
                                        const JSONFiles = files.filter(el => /\.json$/.test(el));
                                        fs.remove(`${JSONFiles[0]}`).then(function clbkWriteNewRes () {
                                            /* === TRIMITE ÎN CLIENT CALEA PE CARE S-A FĂCUT VERSIUNEA === */
                                            rre('createtempver', {path2ver, marcaT});
                                        }).catch(error => {
                                            if (error) throw error;
                                        });
                                    })
                                }).catch(error => {
                                    if (error) throw error;
                                });
                            }).catch(error => {
                                if (error) throw error;
                            });
                        }
                    ).catch((error) => {
                        if (error) throw error;
                    });
                }).catch(error => {
                    console.log(error);
                });
            }).catch(error => {
                console.log(error);
            });









            // Transformarea Buffer-ului primit într-un stream `Readable`
            var strm = new Readable();
            strm.push(resourceFile.resF);  
            strm.push(null);

            lastBag = BagIt(caleS, 'sha256');
            // introdu un nou fișier în Bag
            strm.pipe(lastBag.createWriteStream(`${resourceFile.numR}`));
            // construiește obiectul de răspuns.
            var responseObj4AddedFile = {
                success: 1,
                uuid: resourceFile.uuid,
                file: `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${resourceFile.uuid}/data/${resourceFile.numR}`,
                size: resourceFile.size
            };
            // trimite înapoi obiectul necesar confirmării operațiunii lui Editor.js
            socket.emit('resursa', responseObj4AddedFile);           
        });

        // === RED === ::Introducerea resursei în baza de date MongoDB la finalizarea completării FORM01
        socket.on('red', (RED) => {
            // gestionează cazul în care nu ai un uuid generat pentru că resursa educațională, adică nu are niciun fișier încărcat
            if (!RED.uuid) {
                RED.uuid = uuidv4();
            }
            // Încarcă modelul cu date!!!
            var resursaEducationala = new Resursa({
                _id:             new mongoose.Types.ObjectId(),
                date:            Date.now(),
                identifier:      RED.uuid,
                idContributor:   RED.idContributor,
                uuid:            RED.uuid,
                emailContrib:    RED.emailContrib,
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
                relatedTo:       RED.relatedTo,
                grupuri:         RED.grupuri,
                domeniu:         RED.domeniu,
                functii:         RED.functii,
                demersuri:       RED.demersuri,
                spatii:          RED.spatii,
                invatarea:       RED.invatarea,
                rol:             RED.rol,
                abilitati:       RED.abilitati,
                componente:      RED.componente,
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
                // Trimite înregistrarea și în Elasticsearch și creează și un fișier json pe hard în subdirectorul red-ului [FIXED::`post`hook pe schemă la `save`]
                // TODO: Mai creează un git pentru director, fă primul commit și abia după aceea salvează în baza de date.

                /* === Scrie JSON-ul înregistrării în `data` === */
                const newRes = Object.assign({}, RED);
                newRes._id = res._id; // introdu în obiectul JSON id-ul înregistrării din MongoDB -> Recovery latter!
                // creează calea pe care se va depozita.
                let calea = `${process.env.REPO_REL_PATH}${RED.idContributor}/${RED.uuid}/`;
                // ref pe Bag-ul existent
                let existBag = BagIt(calea, 'sha256');
                // transformă în Buffer obiecul newRes
                const data = Buffer.from(JSON.stringify(newRes));
                let strm = new Readable();
                strm._read = () => {} // _read este necesar!!!
                strm.push(data);
                strm.push(null);                
                // introdu un nou fișier în Bag-ul existent al resursei
                strm.pipe(existBag.createWriteStream(`${uuidv4()}.json`)); // scrie un JSON pe HDD în Bag-ul resursei

                /* === SAVARE RESURSĂ ÎN MONGO === */
                res.save(); // Se aplică un hook `post` pentru a indexa în ES!
                socket.emit('red', res); // se emite înregistrarea către frontend. Dacă frontendul primește înregistrare, va redirecta către resursă.
            }).catch(err => {
                if (err) console.error;
                // Dacă e vreo eroare, distruge directorul de pe hard!
                fs.ensureDir(`${process.env.REPO_REL_PATH}${RED.idContributor}/${RED.uuid}/`, 0o2775).then(async function clbkFsExists () {
                    // TODO: scrie logica de ștergere a directorului în cazul în care a eșuat crearea înregistrării în MongoDB.
                    await fs.remove(`${process.env.REPO_REL_PATH}${RED.idContributor}/${RED.uuid}/`);
                }).then(() => {
                    console.log('Am șters directorul în urma operațiunii eșuate de creare a înregistrării în MongoDB.')
                }).catch(error => {
                    console.error(JSON.stringify(error.body, null, 2));
                });
            });
        });

        // === CLOSEBAG === ::În momentul în care se va apăsa butonul care creează resursa, se va închide și Bag-ul.
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

        // === LOG ===
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

        /* === DELFILE === */
        socket.on('delfile', (components) => {
            let cleanFileName = decodeURIComponent(components.fileName);
            let dirPath = path.join(`${process.env.REPO_REL_PATH}`, `${components.idContributor}/`, `${components.uuid}/`, `data/`, `${cleanFileName}`);
            console.log("Fișierul pe care trebuie să-l șterg este: ", dirPath);
            
            /* === ȘTERGE FIȘIER === */
            fs.remove(dirPath, function clbkDirFolder (error) {
                if (error) {
                    console.error(error);
                }
                rre('mesaje', `Am șters fișierul ${cleanFileName}`);
                socket.emit('delfile', `Am șters fișierul ${cleanFileName}`);
            });
        });

        // === DELDIR === ::Ștergerea subdirectorului unei resurse
        socket.on('deldir', (resource) => {
            // console.log(resource);
            let dirPath = path.join(`${process.env.REPO_REL_PATH}`, `${resource.content.idContributor}`, `${resource.content.identifier}`);
            // console.log('Calea constituită este: ', dirPath);

                // Șterge din MongoDB, din Elasticsearch, precum și de pe hard
                // caută dacă există subdirector.
                fs.ensureDir(dirPath, 0o2775).then(function clbkFsExists () {
                    /* === ȘTERGE SUBDIRECTOR === */
                    fs.remove(dirPath, function clbkDirFolder (error) {
                        if (error) {
                            console.error(error);
                        }
                        pubComm.emit('deldir', `Am șters subdirectorul ${resource.content.identifier}`);
                    });
                }).catch(err => {
                    console.log(err);
                });
        });

        // === DELRESID === ::Ștergerea unei resurse
        socket.on('delresid', (resource) => {
            // console.log(resource);
            let dirPath = path.join(`${process.env.REPO_REL_PATH}`, `${resource.content.idContributor}`, `${resource.content.identifier}`);
            // console.log('Calea constituită este: ', dirPath);

                /* === CAZURI === */
                // #1 Resursa nu are subdirector creat pentru că nu s-a încărcat nimic.
                // #2 Resursa are subdirector și acesta trebuie trimis în subdirectorul deleted.

                // Șterge din MongoDB, din Elasticsearch, precum și de pe hard
                // caută dacă există subdirector.
                fs.ensureDir(dirPath, 0o2775).then(function clbkSubdirExists () {
                    
                    /* === ARHIVEAZĂ === */
                    // Verifică dacă în rădăcina userului există subdirectorul `deleted`. Dacă nu, creează-l!!!
                    var path2deleted = path.join(`${process.env.REPO_REL_PATH}`, `${resource.content.idContributor}`, 'deleted');
                    // Procedura de ștergere cu arhivare
                    fs.ensureDir(path2deleted, 0o2775).then(function clbkDeletedExist () {
                        // Vezi dacă există un subdirector al resursei, iar dacă există șterge tot conținutul său [https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/emptyDir.md#emptydirdir-callback]
                        var path2deres = `${path2deleted}/${resource.content.identifier}`;
                        // console.log('Fac arhiva pe calea: ', path2deres);

                        // dacă directorul a fost constituit și este gol, să punem arhiva resursei șterse
                        var output = fs.createWriteStream(path2deres + `${resource.content.identifier}.zip`);
                        var archive = archiver('zip', {
                            zlib: { level: 9 } // Sets the compression level.
                        });
                        // generează arhiva din subdirectorul resursei în subdirectorul țintă din deleted
                        archive.directory(dirPath, path2deres);
                        // constituie arhiva!                   
                        archive.pipe(output);
                        // WARNINGS
                        archive.on('warning', function(err) {
                            if (err.code === 'ENOENT') {
                                // log warning
                                console.log('Atenție, la arhivare a dat warning Error NO ENTry', err);
                            } else {
                                // throw error
                                throw err;
                            }
                        });
                        // ERRORS
                        archive.on('error', function(err) {
                            throw err;
                        });

                        /* === Când se încheie procesul de arhivare === */
                        output.on('close', function clbkFinalArhivare () {
                            rre('mesaje', 'Resursa a intrat în conservare!');
                            // rre('delresid', {bytes: archive.pointer()});

                            /* === ȘTERGE SUBDIRECTOR === */
                            fs.remove(dirPath, function clbkRemoveFolder (error) {
                                if (error) {
                                    console.error(error);
                                }
                            });

                            /* === Șterge din MONGODB și din Elasticsearch === */
                            Resursa.findOneAndDelete({_id: resource.id}, (err, doc) => {
                                // console.log('Documentul este: ', doc);                
                                if (err) {
                                    console.log(err);
                                };                
                                if (doc) {
                                    // Șterge înregistrarea din Elasticsearch dacă ștergerea din bază a reușit
                                    esClient.delete({
                                        id: doc._id,
                                        index: process.env.RES_IDX_ALS,
                                        refresh: true
                                    });
                                }
                            });
                        });

                        /* === FINALIZEAZĂ ARHIVAREA === */
                        archive.finalize();
                    }).catch(error => {
                        console.log(error);
                    });
                }).catch(error => {
                    console.log(error);
                });
        });

        // === MKADMIN === ::Aducerea fișei unui singur id (email) și trimiterea în client
        socket.on('mkAdmin', (userSet) => {    
            // Atenție: https://mongoosejs.com/docs/deprecations.html#-findandmodify-
            const UserModel = mongoose.model('user', UserSchema); // constituie model din schema de user
            let docUser = UserModel.findOne({_id: userSet.id}, 'admin');
            if (userSet.admin == true) {                
                docUser.exec(function clbkSetAdmTrue(error, doc) {
                    if (error) console.log(error);
                    doc.roles.admin = true;
                    doc.save().then(() => {
                        rre('mesaje', 'Felicitări, ai devenit administrator!');
                    }).catch(err => {
                        if (err) throw err;
                    });
                });
            } else {
                docUser.exec(function clbkSetAdmFalse(error, doc) {
                    if (error) console.log(error);
                    doc.roles.admin = false;
                    doc.save().then(() => {
                        rre('mesaje', 'Ai luat dreptul de administrare!');
                    }).catch(err => {
                        if (err) throw err;
                    });
                });
            }   
        });

        // === ADDROLE === ::Adaugă rol nou
        socket.on('addRole', (newRoles) => {
            const UserModel = mongoose.model('user', UserSchema); // constituie model din schema de user
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

        // === ADDUNIT === ::Adaugă unit nou pentru utilizator
        socket.on('addUnit', (newUnits) => {
            const UserModel = mongoose.model('user', UserSchema); // constituie model din schema de user
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

        // === VALIDATERES === ::Validarea resursei `expertCheck` - true / false
        socket.on('validateRes', (queryObj) => {
            // eveniment declanșat din redincredadmin.js
            let resQuery = Resursa.findOne({_id: queryObj._id}, 'expertCheck');
            resQuery.exec(function (err, doc) {
                doc.expertCheck = queryObj.expertCheck;
                doc.save().then(newdoc => {
                    socket.emit('validateRes', {expertCheck: newdoc.expertCheck});
                    // Introdu upsert-ul pentru a actualiza și înregistrarea din Elasticsearch
                    esClient.update({
                        index: process.env.RES_IDX_ALS,
                        id: queryObj._id,
                        body: {
                            script: 'ctx._source.expertCheck = ' + queryObj.expertCheck
                        },
                        refresh: true
                    }).then(result => {
                        // console.log(result.body.result);
                    }).catch(err => console.error);
                }).catch(err => {
                    if (err) throw err;
                });
            });
        });

        // === SETPUBRES === ::setarea resursei drept publică
        socket.on('setPubRes', (queryObj) => {
            // eveniment declanșat din redincredadmin.js
            let resQuery = Resursa.findOne({_id: queryObj._id}, 'generalPublic');
            resQuery.exec(function (err, doc) {
                doc.generalPublic = queryObj.generalPublic;
                doc.save().then(newdoc => {
                    rre('setPubRes', {generalPublic: newdoc.generalPublic});

                    // Introdu upsert-ul pentru a actualiza și înregistrarea din Elasticsearch
                    esClient.update({
                        index: process.env.RES_IDX_ALS,
                        id: queryObj._id,
                        body: {
                            script: 'ctx._source.generalPublic = ' + queryObj.generalPublic
                        },
                        refresh: true
                    }).then(result => {
                        console.log(result.body.result);
                    }).catch(err => console.error);
                }).catch(err => {
                    if (err) throw err;
                });
            });
        });

        // === SEARCHRESDISC === ::căutarea resurselor după disciplinele selectate
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
        
        // === SEARCHRES === ::Căutarea resurselor în Elasticsearch
        socket.on('searchres', (query) => {            
            if(query) {
                // scoate spații pe capete și trunchiază textul.
                let trimmedQ = query.fragSearch.trim();
                let queryString = '';
                if (trimmedQ.length > 250) {
                    queryString = trimmedQ.slice(0, 250);
                } else {
                    queryString = trimmedQ;
                }
                // TODO: Integrează gestionarea cuvintelor evidențiate returnate de Elasticsearch: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-highlighting
                // resurse căutate după termenii cheie
                // console.log(query);
                
                const rezProm = findInIdx(query.index, trimmedQ, query.fields);
                rezProm.then(r => {              
                    socket.emit('searchres', r.body.hits.hits);
                }).catch(e => console.log(e));
            } else {
                rre('mesaje', "Nu am primit niciun termen de căutare...");
            }

            // agregare făcută după termenii cheie
            // const aggProm = aggFromIdx(query.index, trimmedQ);
            // aggProm.then(r => {              
            //     socket.emit('searchres', r.body.hits.hits);
            // }).catch(e => console.log(e)); 
        });

        // === PERSON === ::căutarea unui utilizator și reglarea înregistrărilor dintre ES și MONGODB
        socket.on('person', async function searchUserInES (queryString) {
            // console.log("Stringul de interogare este următorul: ", queryString);
            
            // FIXME: Sanetizează inputul care vine prin `queryString`!!! E posibil să fie flood. Taie dimensiunea la un singur cuvânt!!!
            // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html
            const searchqry = {
                "query": {
                    "multi_match": {
                        "query": validator.trim(queryString),
                        "type": "best_fields",
                        "fields": ["email", "googleProfile.name", "name", "*_name"]      
                    }
                }
            };

            // Se face căutarea în Elasticsearch!!!
            // Atenție, folosesc driverul nou conform: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/introduction.html E suuuuperfast! :D
            try {
                const {body} = await esClient.search({
                    index: process.env.USR_IDX_ALS, 
                    body: searchqry
                });
                // console.log("Pe evenimentul person am următorul corp", body);
                
                // DACĂ AM ÎNREGISTRĂRI ÎN INDEX-ul Elasticsearch
                if (body.hits.hits.length > 0) {               
                    // pentru fiecare id din elasticsearch, cauta daca există o înregistrare în MongoDB. Dacă nu există în MongoDB, șterge din Elastic.
                    body.hits.hits.map((user) => {
                        // dacă documentul nu există în MongoDB, șterge înregistrarea din Elastic
                        const UserModel = mongoose.model('user', UserSchema); // constituie model din schema de user
                        UserModel.exists({_id: user._id}).then((result) => {
                            if (!result) {
                                esClient.delete({
                                    index: 'users0',
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
                    // NU EXISTĂ ÎNREGISTRĂRI ÎN INDEX-ul ELASTICSEARCH
                    // TODO: Caută dacă adresa de email există în MongoDB. Dacă există și nu apare în index, indexeaz-o!
                    let trimStr = validator.trim(queryString);
                    // PAS 1 -> Analizează dacă `queryString` este un email
                    if (validator.isEmail(trimStr)) {
                        // caută în MongoDB dacă există emailul. În cazul în care există, indexează-l în Elasticsearch!
                        const UserModel = mongoose.model('user', UserSchema); // constituie model din schema de user
                        UserModel.exists({email: queryString}).then(async (result) => {
                            try {
                                if (result) {
                                    await esClient.index({
                                        index: 'users0',
                                        body: result
                                    });
                                    // forțează reindexarea pentru a putea afișa rezultatul la următoarea căutare!!!
                                    await client.indices.refresh({ index: 'users' });
                                    socket.emit('mesaje', `Am interogat baza de date și am găsit un email neindexat pe care l-am reindexat. Caută acum din nou!`);
                                }                                    
                            } catch (error) {
                                console.error(error);
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
                    console.error("Nu am gîsit indexul utilizatorilor!!! Vezi dacă serverul de Elasticsearch este pornit.");
                } else if(error.body.error.type != "index_not_found_exception") {
                    console.error("Este o eroare pe care nu pot să o apreciez. Detalii: ", error);
                }
            }
        });

        // === PERSONRECORD === ::FIȘA completă de utilizator
        socket.on('personrecord', id => {
            // TODO: constituie un query care să aducă înregistrarea de user și ultimele sale 5 contribuții RED
            // https://mongoosejs.com/docs/api.html#model_Model.populate
            const UserModel = mongoose.model('user', UserSchema); // constituie model din schema de user
            UserModel.findById(id, function clbkFindById (error, user) {
                if (error) {
                    console.error(error);
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

        // === STATS === ::STATS GENERAL
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
                        const UserModel = mongoose.model('user', UserSchema); // constituie model din schema de user
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

        // === ALLRES === ::TOATE RESURSELE
        socket.on('allRes', () => {
            Resursa.find({}).exec().then(allRes => {
                socket.emit('allRes', allRes);
            }).catch(error => {
                console.log(error);
            });
        });

        // === PERSONALRES === ::TOATE RESURSELE UNUI UTILIZATOR
        socket.on('usrRes', (id) => {
            Resursa.find({idContributor: id}).exec().then(pRes => {
                socket.emit('usrRes', pRes);
            }).catch(error => {
                console.log(error);
            });
        });

        // === ALLUSERS === ::TOȚI UTILIZATORII
        socket.on('allUsers', () => {
            const UserModel = mongoose.model('user', UserSchema); // constituie model din schema de user
            UserModel.find({}).exec().then(allUsers => {
                socket.emit('allUsers', allUsers);
            }).catch(error => {
                console.log(error);
            });
        });
    });
    /* === CONSTRUCȚIA BAG-ULUI - END === */
    /* === ÎNCĂRCAREA UNUI fișier cu `multer` === */
    return pubComm;
};