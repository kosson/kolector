require('dotenv').config();
const fs          = require('fs-extra');
const archiver    = require('archiver');
const path        = require('path');
// const querystring = require('querystring');
const BagIt       = require('bagit-fs');
const {v1: uuidv1} = require('uuid'); // https://github.com/uuidjs/uuid#deep-requires-now-deprecated
const Readable    = require('stream').Readable;
const mongoose    = require('mongoose');
const validator   = require('validator');
const esClient    = require('../elasticsearch.config');
const Resursa     = require('../models/resursa-red'); // Adu modelul resursei
const UserModel   = require('../models/user'); // Adu modelul unui user
const Log         = require('../models/logentry');

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

        // === RESURSA === ::Primirea imaginilor pe socket conduce la crearea Bag-ului
        socket.on('resursa', function clbkResursa (resourceFile) {
            // creează calea pe care se va depozita.
            var calea = `${process.env.REPO_REL_PATH}${resourceFile.user}/`;

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

        // === CLOSEBAG === ::În momentul în care se va apăsa butonul care creează resursa, se va închide și Bag-ul.
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

        // === RED === ::Introducerea resursei în baza de date MongoDB la finalizarea completării FORM01
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

        // === DELRESID === ::Ștergerea unei resurse
        socket.on('delresid', (resource) => {
            // console.log(resource);
            let dirPath = path.join(`${process.env.REPO_REL_PATH}`, `${resource.content.idContributor}`, `${resource.content.identifier}`);
            console.log('Calea constituită este: ', dirPath);

                /* === CAZURI === */
                // #1 Resursa nu are subdirector creat pentru că nu s-a încărcat nimic.
                // #2 Resursa are subdirector și acesta trebuie șters sau... marcat pentru ștergere întârziată în caz că implementăm recuperare.

                // TODO: detectează dacă există subdirector!!! Dacă da, șterge-l și șterge și din MongoDB, dar și din Elasticsearch.
                // caută dacă există subdirector.
                fs.ensureDir(dirPath, 0o2775).then(function clbkFsExists () {
                    
                    /* === ARHIVEAZĂ === */
                    // Verifică dacă în rădăcina userului există subdirectorul `deleted`. Dacă nu, creează-l!!!
                    var path2deleted = path.join(`${process.env.REPO_REL_PATH}`, `${resource.content.idContributor}`, 'deleted');
                    fs.ensureDir(path2deleted, 0o2775).then(function clbkDeletedExist () {
                        // Vezi dacă există un subdirector al resursei, iar dacă există șterge tot conținutul său [https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/emptyDir.md#emptydirdir-callback]
                        var path2deres = `${path2deleted}/${resource.content.identifier}`;
                        console.log('Fac arhiva pe calea: ', path2deres);
                        // dacă directorul a fost constituit și este gol, să punem arhiva resursei șterse
                        var output = fs.createWriteStream(path2deres + `${resource.content.identifier}.zip`);
                        var archive = archiver('zip', {
                            zlib: { level: 9 } // Sets the compression level.
                        });
                        // generează arhiva din directorul țintă
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
                        // Când se încheie procesul de arhivare
                        output.on('close', function() {
                            console.log(archive.pointer() + ' total bytes');
                            console.log('archiver has been finalized and the output file descriptor has closed.');
                            rre('mesaje', 'Resursa a intrat în conservare!');
                            rre('delresid', {bytes: archive.pointer()});

                            // Șterge resursa din MONGODB și din Elasticsearch!!!
                            Resursa.findOneAndDelete({_id: resource.id}, (err, doc) => {
                                // console.log('Documentul este: ', doc);                
                                if (err) {
                                    console.log(err);
                                };                
                                // Șterge înregistrarea din Elasticsearch -> https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_delete
                                esClient.delete({
                                    id: doc._id,
                                    index: 'resursedus'
                                });
                            });
                        });
                        // FINALIZEAZĂ ARHIVAREA
                        archive.finalize();
                    });
                }).catch(err => {
                    console.log(err);
                });
        });

        // === MKADMIN === ::Aducerea resurselor pentru un id (email) și trimiterea în client
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

        // === ADDROLE === ::Adaugă rol nou
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

        // === ADDUNIT === ::Adaugă unit nou pentru utilizator
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

        // === VALIDATERES === ::Validarea resursei
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

        // === SETPUBRES === ::setarea resursei drept publică
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
        socket.on('searchres', (queryString) => {
            const body = {
                query: {
                    query_string: {
                        "query": queryString,
                        "fuzziness": "auto",
                        "fields": ["title", "description", "etichete", "discipline"]
                    }
                }
            };
            // TODO: Integrează gestionarea cuvintelor evidențiate returnate de Elasticsearch: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-highlighting
            searchDoc('resursedus', body, (err, result) => {
                if (err) console.log(err);
                return result;
            }).then((result) => {
                socket.emit('searchres', result.hits.hits);
            }).catch(console.log);
        });

        // === PERSON === ::căutarea unui utilizator
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

        // === PERSONRECORD === ::FIȘA completă de utilizator
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

        // === ALLUSERS === ::TOȚI UTILIZATORII
        socket.on('allUsers', () => {
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