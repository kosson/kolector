const process     = require('process');
const fs          = require('fs-extra');
const archiver    = require('archiver');
const path        = require('path');
const validUrl    = require('valid-url');
// const querystring = require('querystring');
const BagIt       = require('bagit-fs');
const crypto      = require('crypto');
const {nanoid}    = require('nanoid'); // necesar creării id-urilor blocurilor Editor.js 
// const Readable    = require('stream').Readable;
const Papa        = require('papaparse');
const {Readable, Writable, pipeline} = require('stream');
const mongoose    = require('mongoose');
const validator   = require('validator');
const redisClient = require('../redis.config');
const esClient    = require('../elasticsearch.config');
const Resursa     = require('../models/resursa-red');           // Adu modelul resursei
const User        = require('../models/user');                  // Adu modelul unui user
const Log         = require('../models/logentry');              // Adu modelul unui articol de blog
const Competente  = require('../models/competenta-specifica');  // Adu modelul competenței
const Mgmtgeneral = require('../models/MANAGEMENT/general');    // Adu modelul management
const editorJs2HTML= require('../routes/controllers/editorJs2HTML');
// necesare pentru constituirea și gestionarea repo-ului de git
const globby      = require('globby');
const git         = require('isomorphic-git');
const { gitToJs } = require('git-parse');
const logger      = require('../util/logger');
const objectsOps  = require('../util/objectsOps');
let getStructure  = require('../util/es7');

// INDECȘII ES7
let RES_IDX_ES7 = '', RES_IDX_ALS = '', USR_IDX_ES7 = '', USR_IDX_ALS = '';
getStructure().then((val) => {
    USR_IDX_ALS = val.USR_IDX_ALS;
    USR_IDX_ES7 = val.USR_IDX_ES7;
    RES_IDX_ALS = val.RES_IDX_ALS;
    RES_IDX_ES7 = val.RES_IDX_ES7;
}).catch((error) => {
    console.log(`[sockets.js::getStructure] nu a adus datele`, error);
    logger.error(error);
});

// funcțiile de căutare
const {findInIdx, aggFromIdx} = require('./controllers/elasticsearch.ctrl');
// căutare resurse în Mongo prin Mongoose
// const {pagination} = require('./controllers/pagination.ctrl');
const {pagination_cursor} = require('./controllers/pagination-cursor.ctrl');

// funcții de indexare și reindexare în Elasticsearch 7
const {deleteIndex, reidxincr, mgdb2es7} = require('../models/model-helpers/es7-helper');
const { get, set } = require('../redis.config');
const { error } = require('../util/logger');
const management = require('../models/MANAGEMENT/general');
const { update } = require('../models/resursa-red');
const { hostname } = require('os');
// funcții de raportare date statistice în MongoDB
// const {statsmgdb} = require('../models/model-helpers/mgdb4-helper');

/**
 * Funcția are rolul de a face staging la tot ce există în parametrul `calea` urmat de commit
 * Funcția este echivalentul lui `git add .` (cu respectarea unui `.gitignore`, dacă există) combinat cu `git commit -a -m "mesajul"`
 * @param {String} calea Este calea relativă a subdirectorului resursei. Începe cu punct
 * @param {String} autori Este stringul autorilor din care va fi extras primul ca fiind cel care face repo-ul
 * @param {String} email Adresa de email a celui care face repo-ul
 * @param {String} message 
 */
async function commitAll (calea, autori, email, message) {    
    try {
        // adaugă toate fișierele existente în cale în stagging și 
        const paths = await globby(calea, ['./**', './**/.*'], { gitignore: true }); // https://github.com/isomorphic-git/isomorphic-git/issues/187
        // console.log("[commitAll] Array-ul paths are următorul conținut: ", paths);
        
        const dir = process.cwd();              // `/media/nicolaie/DATA/DEVELOPMENT/redcolector/` Este directorul de lucru al aplicației
        let relComponent = calea.slice(1);      // Este calea relativă pornind de la `repo`. E nevoie să debitezi punctul
        let compoundPath = dir + relComponent;  // `/media/nicolaie/DATA/DEVELOPMENT/redcolector/repo/5ebaf1ae32061d3fa4b7f0ae/08bb2b97-04d4-4ea7-9281-3fe9e67f7598/`

        /*
            === GIT ALL -A ===
            Fii foarte atent!!! 
            Calea pe care `dir` o acceptă este una absolută (`/media/nicolaie/DATA/DEVELOPMENT/redcolector/repo/5ebaf1ae32061d3fa4b7f0ae/08bb2b97-04d4-4ea7-9281-3fe9e67f7598/`)
            Calea pe care `filepath` o acceptă este relativă lui `dir` (Nu trebuie să înceapă cu `./`).
        */

        let filepath = '';
        for (filepath of paths) {
            let relPath = './' + filepath; // normalizează-l pentru debitarea cu `relPath`
            let xP = relPath.substr(calea.length); // constituie un subșir debitând de la 0 la lungimea lui `calea`. Ajungi astfel la calea relativă a fișierului fără `./`.
            // console.log("[commitAll] Calea relativă nouă este:", xP, " iar destinatia este: ", compoundPath);           
            await git.add({fs, dir: compoundPath, filepath: xP});
        }
        
        /* === GIT COMMIT -m "message" === */
        let autoriArr = autori.split(',');   // tratez cazul în care ai mai mulți autori delimitați de virgule
        let author = '';
        if (autoriArr.length >= 1) {
            author = autoriArr[0].trim();
        } else {
            author = autori;
        }
        
        let reqPath = compoundPath.substr(0, compoundPath.length - 1); // generează calea absolută pânâ în subdirectorul resursei, fără slash final (adăugat la join în spate)
        // console.log('[sockets::commitAll] valoarea lui `reqPath` este: ', reqPath, " iar join-ul este ", path.join(reqPath, '.git'));

        let sha = await git.commit({
            fs, 
            dir: reqPath, 
            message: `${autori} fecit ${message}.`, 
            author: {
                name: `${author}`, 
                email: `${email}`
            }
        });
        console.log("[sockets.js] Vezi `let sha`", sha); // E neapărat!!! Altfel nu se face commit-ul!
    } catch (error) {
        if (error) {
            console.error("[sockets.js] Eroare de commit în fn `commitAll`: ", error);
        }
    }
}

// EXPORTĂ TOATE SOCKET-urile în app.js
function sockets (io) {
    // io.on('connect', socket => {
        // console.log("Id-ul conectat este: ", socket.id);
        // console.log(socket.handshake);
        // // console.log(socket.handshake.query._csrf);
        // socket.on('testconn', function cbMesaje (mesaj) {
        //     const detaliiConn = pubComm.server.eio.clients[socket.id]; // obține detaliile de conexiune individuale
        //     console.log('Serverul a primit următorul mesaj: ', mesaj, detaliiConn.upgraded);
        // });
    // });

    var pubComm = io.of('/redcol'); // creează obiectul `Namespace` pentru comunicare în afara administrării
    var adminNs = io.of('/admin');  //creează obiectul `Namespace` pentru administrare

    // Testează dacă primești socket format
    // console.info('Server socket sniff: ', {
    //     namespace: main.name,
    //     path: main.server._path,
    //     connected: main.server.parser.CONNECT,
    //     error: main.server.parser.ERROR,
    //     origins: main.server.encoder._origins,
    //     rooms: main.server.sockets.rooms,
    //     clients: main.server.eio.clients,
    //     numberofclients: main.server.eio.clientsCount,
    //     sockets: main.sockets,
    //     ids: main.ids,
    //     transports: main.server.eio.transports
    // });

    /* === FUNCȚII HELPER PENTRU LUCRUL CU SOCKET-URI */
    // EMIT
    function rre (nameEvt, payload) {
        pubComm.on('connect', socket => {
            // console.log(`socket.io connected: ${socket.id}`);
            // save socket.io socket in the session
            // console.log("session at socket.io connection:\n", socket.request.session);
            socket.request.session.socketio = socket.id;
            socket.request.session.save();
            return socket.emit(nameEvt, payload);
        });
    }
    // ON
    function rro (nameEvt, cb) {
        pubComm.on('connect', socket => {
            // console.log(`socket.io connected: ${socket.id}`);
            // save socket.io socket in the session
            // console.log("session at socket.io connection:\n", socket.request.session);
            socket.request.session.socketio = socket.id;
            socket.request.session.save();
            return socket.on(nameEvt, cb);
        });
    }

    /* === CONSTRUCȚIA BAG-ULUI, INTRODUCEREA ÎNREGISTRĂRII, INTRODUCEREA ÎN ELASTICSEARCH === */
    let lastBag;   // este o referință către un bag deja deschis
    let lastUuid;  // referință către UUID-ul în efect
    let desiredMode = 0o2775;
    let options = { mode: 0o2775 };

    function clbkOnConnect (socket) {
        // === ERORI === ::Ascultă erorile din server
        socket.on('error', (reason) => {
            console.log("[sockets.js::error] Acesta este motivul de eroare: ", reason);
        });

        // === TEST CONNECTION === ::Vezi dacă e conectat și upgradat
        // socket.on('testconn', function cbMesaje (mesaj) {
        //     console.log('Serverul a primit următorul mesaj: ', mesaj);
        // });

        // === MESAJE === ::Ascultă mesajele
        socket.on('mesaje', function cbMesaje (mesaj) {
            console.log('[sockets.js::mesaje] Serverul a primit următorul mesaj: ', mesaj);
        });

        // === COMPETENȚELE SPECIFICE ===
        socket.on('csuri', function cbCsuri (data) {
            // console.log("[sokets.js::<'csuri'>] Array-ul disciplinelor selectate de client este ", data);// De ex: [ 'arteviz3', 'stanat3' ] `data` sunt codurile disciplinelor selectate
            
            const CSModel = require('../models/competenta-specifica');
            // Proiecția se constituie pe același câmp, dar pe valorile primite prin socket.
            CSModel.aggregate([{$match: {
                coddisc: {$in: data}
            }}]).then(rez => {
                pubComm.emit('csuri', JSON.stringify(rez));
            });
        }); // apel al funcția `cbCsuri` de mai jos

        // === RESURSA (upload fișiere) === 
        //Primește fișiere, fapt care conduce la crearea Bag-ului. Servește instanței de Editor.js (uploadByFile și uploadByUrl)
        socket.on('resursa', function clbkResursa (resourceFile) {
            //_ TODO: Detectează dimensiunea fișierului și dă un mesaj în cazul în care depășește anumită valoare (vezi API-ul File)
            //_ WORKING: Există o limitare sub 1Mb la fișierele care sunt scrise. Motivul: https://github.com/socketio/socket.io/issues/3135
            //_ WORKING: the default value of maxHttpBufferSize was decreased from 100MB to 1MB (https://socket.io/docs/v3/server-initialization/#maxHttpBufferSize). Reverted! Era un braking change https://socket.io/docs/v3/migrating-from-2-x-to-3-0/index.html
            /* LIMITAREA dimensiunii fișierului se face și din NGINX (100MB) */
            /* 
                Obiectul primit `resourceFile` este `objRes` din `form01adres` și are următoarea semnătură
                {
                    user: RED.idContributor, // este de forma "5e31bbd8f482274f3ef29103" [înainte era email-ul]
                    name: RED.nameUser,      // este de forma "Nicu Constantinescu"
                    uuid: uuid,              // `uuid` are valoare deja
                    resF: file,              // este chiar fișierul: lastModified: 1583135975000  name: "Sandro_Botticelli_083.jpg" size: 2245432 type: "image/jpeg"
                    numR: file.name,         // name: "Sandro_Botticelli_083.jpg"
                    type: file.type,         // type: "image/jpeg"
                    size: file.size
                };
            */
            
            try {
                // creez calea către subdirectorul corespunzător userului
                let calea = `${process.env.REPO_REL_PATH}${resourceFile.user}/`;

                // asigură-te că poți scrie în directorul userului
                fs.access(calea, function clbkfsAccess (error) {
                    if (error) {
                        // console.log("[sockets.js::resursa] La verificarea posibilității de a scrie în directorul userului am dat de eroare: ", error);
                        logger.error(error);
                    } else {
                        // console.log("[sockets.js::resursa] Directorul există și poți scrie liniștit în el!!!");
                    }
                });

                // Transformarea Buffer-ului primit într-un stream `Readable` gata de a fi scris pe disc
                var sourceStream = new Readable();      // Creează stream-ul Readable
                sourceStream.push(resourceFile.resF);   // Injectează Buffer-ul care este fișierul, de fapt
                sourceStream.push(null);                // Trimite null în stream pentru a semnala faptul că injectarea fișierului s-a încheiat.
                
                // construiește obiectul de răspuns necesar clientului (Editor.js)
                const responseObj4AddedFile = {
                    success: 0,
                    file: '',
                    size: resourceFile.size
                };

                /*
                * === ÎNCĂRCAREA FIȘIERULUI ===
                * valoarea `uuid` este setată la momentul trimiterii template-ului, deci vine de la client!!!
                * dacă nu ai `uuid`, înseamnă că ai o intrare de blog
                */
                if (resourceFile.uuid) {
                    // setează calea către directorul deja existent al resursei
                    let existPath = calea + `${resourceFile.uuid}`;

                    // Calea către fișier [ce pleacă în client]
                    let file   = `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${resourceFile.uuid}/data/${resourceFile.numR}`;
                    let localF = `${process.env.REPO_REL_PATH}${resourceFile.user}/${resourceFile.uuid}/data/${resourceFile.numR}`; // calea către fișierul local din server

                    responseObj4AddedFile.file = file;

                    /* === ASIGURĂ-TE CĂ DIRECTORUL EXISTĂ === */
                    fs.ensureDir(existPath, desiredMode, (error) => {
                        if(error === null){
                            // console.log("[sockets.js::'resursa'::cu uuid] Încă nu am directorul în care să scriu fișierul. Urmează!!!");                        
                        } else {
                            // console.log("[sockets.js::'resursa'::cu uuid] Eroare la verificare/crearea subdirectorului cu următoarele detalii: ", error);
                            logger.error(error);
                        }

                        // reactualizează referința către Bag. Verifică dacă cu cumva funcționează fără.
                        lastBag = BagIt(existPath, 'sha256', {'Contact-Name': `${resourceFile.name}`});

                        // creează stream-ul destinație
                        var destinationStream = lastBag.createWriteStream(`${resourceFile.numR}`);

                        // adăugarea fișierului primit în Bag
                        pipeline(sourceStream, destinationStream, (error, val) => {
                            if (error) {
                                // console.error("[sockets.js::'resursa'::cu uuid] Nu s-a reușit scrierea fișierului în Bag", error);
                                logger.error(err);
                            }
                            
                            /* === VERIFICĂ DACĂ FIȘIERUL CHIAR A FOST SCRIS === */
                            fs.access(localF, fs.F_OK, (error) => {
                                if (error) {
                                    // console.log("[sockets.js::'resursa'::cu uuid] Nu am găsit fișierul tocmai scris: ", error);
                                    logger.error(error);
                                    socket.emit('resursa', responseObj4AddedFile); // trimite obiectul de răspuns în client cu stare de eroare
                                }                            
                                responseObj4AddedFile.success = 1;              // marchează succesul scrierii pe disc ca echivalent al succesului întregii operațiuni de upload                            
                                socket.emit('resursa', responseObj4AddedFile);  // trimite înapoi obiectul necesar confirmării operațiunii lui Editor.js
                            });  
                        });
                    });
                } else {
                    //_ WORKING: ne vom folosi de acest caz și pentru a crea o imagine pe disc pentru o intrare de blog
                    let timestamp = Date.now();                
                    let existPath = calea + 'log/' + timestamp; // calea către directorul deja existent al resursei                
                    let file   = `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/log/${timestamp}/${resourceFile.numR}`;  // calea către fișier [ce pleacă înapoi în client]                
                    let localF = `${process.env.REPO_REL_PATH}${resourceFile.user}/log/${timestamp}/${resourceFile.numR}`;                              // calea către fișierul local din server

                    responseObj4AddedFile.file = file; // atribuie fișierului proprietății `file` a obiectului răspuns

                    /* === ASIGURĂ-TE CĂ DIRECTORUL EXISTĂ === */
                    fs.ensureDir(existPath, desiredMode, (error) => {
                        if(error){
                            // console.log("[sockets.js::'resursa'] Eroare la verificare/crearea subdirectorului cu următoarele detalii: ", error);
                            logger.error(error);
                        }

                        var destinationStream = fs.createWriteStream(localF);
                        pipeline(sourceStream, destinationStream, (error, val) => {
                            if (error) {
                                // console.error("[sockets.js::'resursa'] Nu s-a reușit scrierea fișierului", error);
                                logger.error(error);
                            }
                            /* === VERIFICĂ DACĂ FIȘIERUL CHIAR A FOST SCRIS === */
                            fs.access(localF, fs.F_OK, (error) => {
                                if (error) {
                                    // console.log("[sockets.js::'resursa'] Nu am găsit fișierul tocmai scris: ", error);
                                    logger.error(error);
                                    socket.emit('resursa', responseObj4AddedFile);
                                }                            
                                responseObj4AddedFile.success = 1;              // marchează succesul scrierii pe disc ca echivalent al succesului întregii operațiuni de upload
                                socket.emit('resursa', responseObj4AddedFile);  // trimite înapoi obiectul necesar confirmării operațiunii lui Editor.js
                            });   
                        });
                    });            
                }                
            } catch (error) {
                if (error) {
                    console.error(error);
                    logger.error(error);
                }
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
                                    });
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
                    if (error) throw error;
                });
            }).catch(error => {
                console.log("[socket.js::createtempver] Eroare cu următoarele detalii: ", error);
                if (error) throw error;
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
        socket.on('red', function clbkCreateRED (RED) {
            if (!RED.uuid) {
                // gestionează cazul în care nu ai un uuid generat
                RED.uuid = crypto.randomUUID({disableEntropyCache : true});
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

            /* 
                ==== Salvează în baza de date ==== 
                # Salvează ca json întreaga înregistrare în `./data`;
                # Creează repo-ul git-ului
            */
            var pResEd = resursaEducationala.populate('competenteS');
            pResEd.then(async function clbkThenSave (res) {
                /* === Scrie JSON-ul întregii înregistrării în `data` === */
                const newRes = Object.assign({}, RED);                                          // fă o copie shallow a obiectului primit din client
                newRes._id = res._id;                                                           // introdu în obiectul JSON id-ul înregistrării din MongoDB. Se va dovedi util în cazui de reconstituiri ale bazei de date.
                let calea = `${process.env.REPO_REL_PATH}${RED.idContributor}/${RED.uuid}/`;    // creează calea pe care se va depozita.                
                let existBag = BagIt(calea, 'sha256');                                          // ref pe Bag-ul existent
                
                /* === CREAREA REPO-ului `.git` === */
                await git.init({ fs, dir: calea }); // Atenție, urmează să se facă și primul commit.

                /* === SCRIE OBIECTUL JSON în BAG === */                
                const data = Buffer.from(JSON.stringify(newRes)); // transformă în `Buffer` obiectul `newRes`
                let strm = new Readable();
                strm._read = () => {}; // _read este necesar!!!
                strm.push(data);
                strm.push(null);

                // creează stream-ul destinație
                var destinationStream = existBag.createWriteStream(`${crypto.randomUUID({disableEntropyCache : true})}.json`); // uuid diferit de RED.uuid pentru a avea versiunile diferențiate

                // scrierea stream-ului pe hard (distruge streamul sursă și curăță) -> introdu un nou fișier în Bag-ul existent al resursei
                pipeline(strm, destinationStream, function clbkAfterREDWrittenStrm (error, val) {
                    if (error) {
                        console.error("[sockets.js::'red'] Nu s-a reușit scrierea fișei JSON în Bag", error);
                        logger.error(error);
                    }
                });
                
                /* === SAVARE RESURSĂ ÎN MONGO === */
                res.save(); // Se aplică un hook `post` pentru a indexa în ES (vezi în schemă)!
                return res;
            }).then(res => {
                socket.emit('confirm', res._id);    // se emite înregistrarea către frontend. Dacă frontendul primește înregistrare, va redirecta către resursă.
            }).catch((err) => {
                if (err) {
                    logger.error(err);  // 
                    // Dacă e vreo eroare, distruge directorul de pe hard!
                    fs.ensureDir(`${process.env.REPO_REL_PATH}${RED.idContributor}/${RED.uuid}/`, 0o2775).then(async function clbkFsExists () {
                        // logica de ștergere a directorului în cazul în care a eșuat crearea înregistrării în MongoDB.
                        await fs.remove(`${process.env.REPO_REL_PATH}${RED.idContributor}/${RED.uuid}/`);
                    }).then(() => {
                        console.log('[socket.js::red] Am șters directorul în urma operațiunii eșuate de creare a înregistrării în MongoDB.');
                    }).catch(error => {
                        logger.error(error);
                        console.error(JSON.stringify(error.body, null, 2));
                    });
                }
            });
        });

        // === RED UPDATE :: Actualizarea unei înregistrări existente
        socket.on('updatered', function clbkUpdateRED (obi) {
            if (obi.contribuitor && obi.uuid) {
                console.log(`[socket.js::updatered] Din client am primit `, obi);

                // Modifică conținutul subdirectorului data conform datelor care vin din `obi`
                // Constituie un nou BAG.


                // în cazul în care actualizarea repo-ului de git s-a făcut cu succes
                if(updategit()){

                }
            }
        });

        /**
         * Funcția are rolul de a crea primul commit atunci când este apelată
         * @param path {String} Calea relativă a subdirectorului în care sunt datele de introdus în repo
         * @param name {String} Numele utilizatorului `name`
         * @param email {String} Emailul userului `email`
         */
        async function addAllAndCommit (path, name, email, message) {
            try {
                let apath2res = `${__basedir}/repo/${path}`; // este calea absolută de la rădăcina sistemului până la directorul resursei
                let path2res = `repo/${path}`; // este calea absolută de la rădăcina aplicației până la directorul resursei
    
                // Creează primul commit!!!
                let paths = await globby([`./**`, '!node_modules'], {cwd: `${apath2res}/`}); // https://github.com/isomorphic-git/isomorphic-git/issues/187 https://github.com/sindresorhus/globby/issues/87
                // console.log(`Căile sunt `, paths);

                // SETEAZĂ CINE FACE PRIMUL COMMIT
                await git.setConfig({ fs, dir: path2res, path: 'user.name', value: name });
                await git.setConfig({ fs, dir: path2res, path: 'user.email', value: email }); 

                // TRATEAZĂ CAZUL ÎN CARE sunt fișire modificate direct pe hard, dar nu stagged. CONȚINUTUL ESTE DEJA STAGGED, dar nu commited
                const FILE = 0, WORKDIR = 2, STAGE = 3;
                const statusPaths = await git.statusMatrix({fs, dir: path2res});
                const unstagedChanges = statusPaths.filter(row => row[WORKDIR] !== row[STAGE]).map(row => row[FILE]);
                // console.log(`[socket.js::createFirstCommit] fișierele modificate dar care nu sunt stagged `, unstagedChanges);

                if (unstagedChanges.length > 0) {
                    let filepath = '';
                    for (filepath of paths) {
                        // fs (implementarea de fs), dir: calea către directorul de lucru al repo-ului, filepath: calea către fișierul care trebuie adăugat
                        await git.add({ fs, dir: `${path2res}`, filepath: `${filepath}`});
                    }
                    //_ NOTE: Fă commit-ul doar dacă toate fișierele și directoarele au trecut în stagged
                    await git.commit({ fs, dir: path2res, message: message || `Mark-${Date.now()}` });
                    //_ NOTE: Trimite în client starea pentru afișare
                    const commitsPromise = gitToJs(apath2res);            
                    commitsPromise.then((commits) => {
                        // console.log(`[createFirstCommit::fișiere în stagged] Asta trimit în client: `, JSON.stringify(commits, null, 2));
                    }).catch((error)=> {
                        console.log(error);
                        logger.error(error);
                    });
                } else {
                    //_ NOTE: Trimite în client starea pentru afișare
                    const commitsPromise = gitToJs(apath2res);            
                    commitsPromise.then((commits) => {
                        socket.emit('gitstat', commits);
                        // console.log(`[createFirstCommit::fișiere în stagged] Asta trimit în client: `, JSON.stringify(commits, null, 2));
                    }).catch((error)=> {
                        console.log(error);
                        logger.error(error);
                    });
                }      
            } catch (error) {
                console.log(error);
                logger.error(error);
            }
        };

        // === GIT status of a repo
        socket.on('gitstat', async function clbkGITstat (data) {
            try {
                let targetrepopath = __basedir + '/repo/' + data.path; // Este fără '/.git'
                
                const commits = await git.log({ fs, dir: targetrepopath, depth: 5, ref: 'main'}).catch((error) => {
                    if (error.code === 'NotFoundError') {
                        return addAllAndCommit(data.path, data.name, data.email, data.message).catch((error) => {
                            console.log(`socket.js::gitstat A apărut o eroare la procesarea lui createFirstCommit()`, error);
                            logger.error(error);
                        }); // fii atent că este o promisiune
                    }
                });
    
                if (commits) {
                    const commitsPromise = gitToJs(targetrepopath);            
                    commitsPromise.then((commits) => {
                        console.log(`[socket.on('gitstat) clbkGITstat()] Datele care pleacă în client: `, JSON.stringify(commits, null, 2));
                    }).catch((error)=> {
                        console.log(error);
                        logger.error(error);
                    });
                }      
            } catch (error) {
                console.log(`socket.js::gitstat A apărut o eroare în trimiterea datelor despre repo`, error);
                logger.error(error);                
            }
            // git ls-tree -r master --name-only
            // git ls-tree -r HEAD --name-only
            // https://stackoverflow.com/questions/572549/difference-between-git-add-a-and-git-add
        });

        /*  === CLOSEBAG === 
            În momentul în care se va apăsa butonul care creează resursa, se va închide și Bag-ul.
            Dacă Bag-ul a fost închis, clientul primește true. False în caz contrar.
        */ 
        socket.on('closeBag', () => {
            // În cazul în care există o referință către un Bag deschis, finalizează-l
            if (lastBag) {
                lastBag.finalize(() => {                    
                    socket.emit('closeBag', true);
                });
            } else {
                socket.emit('closeBag', false);
            }
        });

        // === LOG === :: Crearea unei noi înregistrări în blog
        socket.on('log', (entry) => {
            // console.log(`Am primit de la client în campul creator `, entry.creator);

            // creează documentul
            var log = new Log({
                _id:           new mongoose.Types.ObjectId(),
                date:          Date.now(),
                title:         entry.title,
                idContributor: entry.idContributor,
                autor:         entry.autor,
                creator:       entry.creator,
                content:       entry.content,
                contorAcces:   entry.contorAcces,
                tags:          entry.tags,
                alias:         entry.alias
            });

            // salvează documentul
            log.save().then((result) => {
                socket.emit('log', result);
                // console.log(`Rezultatul băgat în bază este `, result);
            }).catch(err => {
                if (err) {
                    logger.error(err);
                    console.error('[socket.js] Ceva nu a funcționat la crearea înregistrării log');
                };
            });            
        });

        /* === DELFILE === */
        socket.on('delfile', (components) => {
            console.log("[sockets::delfile] Componentele primite sunt: ", components);

            let cleanFileName = decodeURIComponent(components.fileName);
            let dirPath = path.join(`${process.env.REPO_REL_PATH}`, `${components.idContributor}/`, `${components.uuid}/`, `data/`, `${cleanFileName}`);
            // console.log("[sockets::delfile] Fișierul pe care trebuie să-l șterg este: ", dirPath);

            // dacă ai o proprietate components.content are obiectul nou, actualizeaza și înregistrarea din Mongo
            
            /* === ȘTERGE FIȘIER === */
            fs.remove(dirPath, function clbkDirFolder (error) {
                if (error) {
                    console.error(error);
                }

                if (components.content) {
                    // Actualizează înregistrarea din baza de date
                    Resursa.findByIdAndUpdate(components.id, {content: components.content}, (doc) => {
                        socket.emit('delfile', `Am șters fișierul ${cleanFileName}, iar content este ${doc}`);
                    });
                }
            });
        });

        // === DELDIR === ::Ștergerea subdirectorului unei resurse
        socket.on('deldir', (resource) => {
            let dirPath = path.join(`${process.env.REPO_REL_PATH}`, `${resource.content.idContributor}`, `${resource.content.uuid}`);                
                /* === ȘTERGE SUBDIRECTOR === */
                fs.ensureDir(dirPath, 0o2775).then(function clbkFsExists () {
                    fs.remove(dirPath, function clbkDirFolder (error) {
                        if (error) {
                            console.error(error);
                        }
                        socket.emit('deldir', true);
                    });
                }).catch(error => {
                    console.log("[sockets.js::'deldir'] Eroare cu următoarele detalii: ", error);
                });
        });

        // === DELRESID === ::Ștergerea unei resurse
        socket.on('delresid', (resource) => {
            /*  Semnătura `resource` este:
                content: {titleI18n: Array(0), arieCurriculara: Array(1), level: Array(1), discipline: Array(1), disciplinePropuse: Array(0), …}
                contribuitor: "5e9832fcf052494338584d92"
                id: "5f50c7c65e8d30559601bf76"
                nameUser: ""
                uuid: "5c7d042a-3694-4419-89e1-c8e1be836a43"
                versioned: false
            */

            // Șterge din MongoDB, din Elasticsearch, precum și de pe hard FIXME: bagă callback-ul în resource-ops.js
            let dirPath      = path.join(`${process.env.REPO_REL_PATH}`, `${resource.contribuitor}`, `${resource.uuid}`),
                path2deleted = path.join(`${process.env.REPO_REL_PATH}`, `${resource.contribuitor}`, 'deleted'),
                path2deres   = `${path2deleted}/${resource.uuid}`; // constituie calea către viitoarea arhivă din deleted.          
            // console.info("Căile formate sunt: ", dirPath, path2deleted, path2deres);

            // Verifică dacă în rădăcina userului există subdirectorul `deleted`. Dacă nu, creează-l!!!
            fs.ensureDir(path2deleted, 0o2775).then(function clbkArchiveAndDel () {
                /* === ARHIVEAZĂ === */
                let output  = fs.createWriteStream(path2deres + `${resource.uuid}.zip`),
                    archive = archiver('zip', { zlib: { level: 9 } });

                // generează arhiva din subdirectorul resursei în subdirectorul țintă din deleted
                archive.directory(dirPath, path2deres);
                // constituie arhiva!                   
                archive.pipe(output);
                // WARNINGS
                archive.on('warning', function archiveMakingWarning (warning) {
                    console.warn("[sockets.js::'delresid'] Atenție, la arhivare a dat warning", warning);
                });
                // ERRORS
                archive.on('error', function manageErrorOnArchiving (err) {
                    console.error("[sockets.js::'delresid'] La crearea arhivei a apărut eroarea!", err);
                    logger.error(`[sockets.js::'delresid'] În timpul arhivării după ștergere a apărut eroarea ${err.message}`);
                    // throw err;
                });

                /* === Când se încheie procesul de arhivare === */
                output.on('close', clbkDelfromMgEs7);

                /* === FINALIZEAZĂ ARHIVAREA === */
                archive.finalize();
            }).catch((error) => {
                console.log("[sockets.js::'delresid'] Întreaga operațiune de arhivare și ștergere a subdirectorului resursei a eșuat cu eroarea: ", error);
                logger.error(error.message);
            });

            /**
             * Funcția este callback pentru evenimentul `close` 
             * emis la momentul în care se închide stream-ul ce creează arhiva
             */
            function clbkDelfromMgEs7 () {
                // rre('mesaje', 'Resursa a intrat în conservare!');
                // rre('delresid', {bytes: archive.pointer()});

                // console.log("[sockets.js::'delresid'] Acest id am să incerc să-l șterg. Acum îl caut în Mongoose: ", resource.id);

                /* === Șterge din MONGODB și din Elasticsearch === */
                Resursa.findOneAndDelete({_id: resource.id}, (err, doc) => {       
                    if (err) {
                        console.log("[sockets.js::'delresid'] În timpul ștergerii din MongoDB a apărut eroarea: ", err);
                        logger.error(err);
                    }

                    if (doc.id) {
                        // console.log('Documentul adus din bază este ', doc);

                        //_ FIXME: Reactivează la momentul reglării mecanismului de indexare.
                        // if (RES_IDX_ALS) {
                        //     // Șterge înregistrarea din Elasticsearch, dacă ștergerea din bază a reușit                        
                        //     esClient.delete({
                        //         id: doc.id,
                        //         index: RES_IDX_ES7,
                        //         refresh: true
                        //     }, function (err, response, status) {
                        //         if (err) {
                        //             console.error(`[sockets.js::'delresid'] În timpul ștergerii din Elasticsearch, a apărut eroarea pentru ${doc.id} la indexul ${index}, având eroarea: ${err.message}`, `reason`, response.body.error.reason, 'status: ', status);
                        //             logger.error(err);
                        //         }
                        //         // console.log(`[sockets.js::'delresid'] Starea operațiunii asupra Elasticsearch este `, status);
                        //         // console.log(`[sockets.js::'delresid'] Avem răspunsul din partea lui Elasticsearch `, response);
                        //     });
                        // }
                        // reason: 'no write index is defined for alias [resedus]. The write index may be explicitly disabled using is_write_index=false or the alias points to multiple indices without one being designated as a write index'

                        /* === ȘTERGE SUBDIRECTOR === */
                        // fs.ensureDir(dirPath, 0o2775).then(function clbkFsExists () {
                        fs.stat(dirPath).then(function clbkFsStat (response) {
                            if (response.isDirectory() === true) {
                                fs.remove(dirPath, function clbkDirRemove (error) {
                                    if (error) {
                                        console.error("[sockets.js::'delresid'] În timpul ștergerii subdirectorului, a apărut eroarea: ", error);
                                        logger.error(`[sockets.js::'delresid'] În timpul ștergerii subdirectorului, a apărut eroarea ${error}`);
                                    }
                                    socket.emit('delresid', doc); // trimite în frontend obiectul ce reprezinta resursa stearsă pentru o confirmare frumoasă.
                                });
                            }
                        }).catch((err) => {
                            console.log("[sockets.js::'delresid'] În timpul verificării existentei subdirectorului resursei șterse, a apărut eroarea: ", err);
                            logger.error(err);
                            // throw error;
                        });

                        /* REVIEW: Testează și următoare alternativă pentru verificarea existenței unui fișier/director
                        fs.access(filename, err => {
                            if (err && err.code === 'ENOENT') {

                        Faptul că fișierul nu există indică inexistența întregii structuri.
                         */
                    }
                });
            }
        });

        // === MKADMIN === ::Aducerea fișei unui singur id (email) și trimiterea în client
        socket.on('mkAdmin', (userSet) => {    
            // Atenție: https://mongoosejs.com/docs/deprecations.html#-findandmodify-
            let docUser = User.findOne({_id: userSet.id}, 'admin');
            if (userSet.admin == true) {                
                docUser.exec(function clbkSetAdmTrue(error, doc) {
                    if (error) {
                        console.log("[sockets.js::'mkAdmin'] Eroare cu următoarele detalii: ", error);
                        throw error;
                    }
                    doc.roles.admin = true;
                    doc.save().then(() => {
                        rre('mesaje', 'Felicitări, ai devenit administrator!');
                    }).catch(error => {
                        console.log("[sockets.js::'mkAdmin'] Eroare cu următoarele detalii: ", error);
                        if (err) throw error;
                    });
                });
            } else {
                docUser.exec(function clbkSetAdmFalse(error, doc) {
                    if (error) {
                        console.log("[sockets.js::'mkAdmin'] Eroare cu următoarele detalii: ", error);
                        throw error;
                    }
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
            let docUser = User.findOne({_id: newRoles.id}, 'roles');
            // dacă vreunul din rolurile trimise nu există deja în array-ul din profilul utilizatorului, acesta va fi adăugat.
            docUser.exec(function clbkAddRole (error, doc) {
                if (error) {
                    console.log("[sockets.js::'addRole'] Eroare cu următoarele detalii: ", error);
                }
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
            let docUser = User.findById(newUnits.id);

            docUser.exec(function clbkAddArrUnit (error, doc) {
                if (error) {
                    console.log("[sockets.js::'addUnit'] Eroare cu următoarele detalii: ", error);
                }

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
                        index: RES_IDX_ALS,
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
                        index: RES_IDX_ALS,
                        id: queryObj._id,
                        body: {
                            script: 'ctx._source.generalPublic = ' + queryObj.generalPublic
                        },
                        refresh: true
                    }).then(result => {
                        console.log("[sockets.js::'setPubRes'] Am setat resursa ca fiind publică. Înregistrarea: ", result.body.result);
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

                // Dacă se încearcă forțarea câmpului cu mai mult de 250 de caractere
                if (trimmedQ.length > 250) {
                    queryString = trimmedQ.slice(0, 250);
                }
                
                // _TODO: Integrează gestionarea cuvintelor evidențiate returnate de Elasticsearch: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-highlighting
                // resurse căutate după termenii cheie
                // console.log(` socket.on('searchres')::Query-ul este: `, query);
                
                const rezProm = findInIdx(query.index, trimmedQ, query.fields);
                rezProm.then(r => {
                    socket.emit('searchres', r.body.hits.hits);
                }).catch(error => {
                    console.log("[sockets.js::'searchres'] Înregistrarea userului nu există. Detalii: ", error);
                });
            } else {
                rre('mesaje', "Nu am primit niciun termen de căutare...");
            }

            // agregare făcută după termenii cheie
            // const aggProm = aggFromIdx(query.index, trimmedQ);
            // aggProm.then(r => {              
            //     socket.emit('searchres', r.body.hits.hits);
            // }).catch(e => console.log(e)); 
        });

        // === PIT === :: Creează un PIT
        async function clbkPitES7 (data) {
            try {
                /*
                    {
                        data.del: true | false,
                        data.pit: string,
                        data.conf: {
                            index: string | string [],
                            keep_alive: string
                        }
                    }
                */
                // console.log(`sockets.js::pit Am primit data: `, data);

                // Verifică dacă nu cumva deja există un PIT deschis. Vezi în REDIS. Dacă este, trimite-l!!!
                // console.log(`sockets.js::pit ID-ul creat în urma solicitării este: `, result.body.id);

                // CAZUL în care un pit deja a fost creat și este în REDIS
                // await redisClient.connect();
                if (await redisClient.get('pit')) {
                    socket.emit('pit', await redisClient.get('pit')); // trimite-l pe cel mai recent
                }

                // CAZUL în care nu ai niciun PIT și îl creezi pe primul
                let result = await esClient.openPointInTime(data.conf);
                // setează în Redis id-ul PIT-ului cu același timp de expirare
                await redisClient.set( "pit", result.body.id, "EX", 60); // https://github.com/NodeRedis/node-redis/issues/1000

                // CAZUL în care ștergi PIT-ul în mod voit.
                if (data.del === true) {
                    // scrie logica necesară ștergerii PIT-ului.
                    // trimite în client obiectul rezultat în urma ștergerii PIT-ului
                    let response = await esClient.closePointInTime({
                        body: data.pit
                    });
                    if (response) {
                        socket.emit('pit', response);
                    }
                }

                socket.emit('pit', result.body.id);
            } catch (error) {
                console.log(error);
                logger.error(error);
            }
        }
        socket.on('pit', (data) => {
            clbkPitES7(data).catch(err => {
                console.log(err);
                logger.error(error);
            })
        });

        // === SEARCH === ::Căutare generală în Elasticsearch
        async function clbkSearch (queryobj, idx) {
            // Funcția va primi din client obiectul de interogare, precum și indexul în care se va face căutarea
            try {

                //_ TODO: CAZUL în care primești cererea cu un PIT id, dar pe server deja este altul.
                // În acest caz, înlocuiești PIT-ul din cerere cu cel de pe server, iar când rezultatul ajunge înapoi, clientul actualizează PIT-ul în `localStore`

                const {body} = await esClient.search({
                    index: idx,
                    body:  queryobj
                });

                if (body) {
                    socket.emit('search', body);
                }
            } catch (error) {
                console.log(error);
                logger.error(error);
            }
        }
        socket.on('search', (queryobj, idx) => {
            clbkSearch(queryobj, idx).catch((err) => {
                console.log(err);
                logger.error(error);
            })
        });

        // === PERSON === ::căutarea unui utilizator și reglarea înregistrărilor dintre ES și MONGODB
        async function searchUserInES (queryString) {
            // console.log("Stringul de interogare din socket.on(person) este următorul: ", queryString);
            
            // _FIXME: Sanetizează inputul care vine prin `queryString`!!! E posibil să fie flood. Taie dimensiunea la un singur cuvânt!!!
            // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html
            const searchqry = {
                "query": {
                    "multi_match": {
                        "query": validator.trim(queryString),
                        "type": "best_fields",
                        "fields": ["email", "googleProfile.name", "name", "*_name"],
                        "slop": 1,
                        "fuzziness": "auto"
                    }
                }
            };

            // Se face căutarea în Elasticsearch!!!
            // Atenție, folosesc driverul nou conform: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/introduction.html E suuuuperfast! :D
            try {
                const {body} = await esClient.search({
                    index: USR_IDX_ALS,
                    body:  searchqry
                });
                // console.log("Pe evenimentul person am următorul rezultat ", body.hits.hits.length);
                
                // DACĂ AM ÎNREGISTRĂRI ÎN INDEX-ul Elasticsearch
                if (body.hits.hits.length > 0) {
                    // console.log("[sockets.js::person] Rezultatul adus de la indexul ElasticSearch", body.hits.hits);
                    // pentru fiecare id din elasticsearch, cauta daca există o înregistrare în MongoDB. Dacă nu există în MongoDB, șterge din Elastic.
                    body.hits.hits.map((user) => {
                        // dacă documentul nu există în MongoDB, șterge înregistrarea din Elastic
                        User.exists({_id: user._id}).then((result) => {
                            if (!result) {
                                esClient.delete({
                                    // index: 'users0',
                                    index: USR_IDX_ALS,
                                    type: 'user',
                                    id:   user._id
                                }).then((res) => {
                                    console.log("[sockets.js::'person'] Înregistrarea userului nu există. Detalii: ", res);
                                    socket.emit('mesaje', `Pentru că documentul nu mai există în baza de date, l-am șters și de la indexare cu detaliile: ${res}`);
                                }).catch((error)=>{
                                    console.log("[sockets.js::'person'] Eroare la aducerea unui user cu următoarele detalii: ", error);
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
                    // _TODO: Aici ai putea testa daca ai date; daca nu ai date, tot aici ai putea face căutarea în baza Mongoose să vezi dacă există.     
                } else {
                    // NU EXISTĂ ÎNREGISTRĂRI ÎN INDEX-ul ELASTICSEARCH
                    // _TODO: Caută dacă adresa de email există în MongoDB. Dacă există și nu apare în index, indexeaz-o!
                    let trimStr = validator.trim(queryString);
                    // PAS 1 -> Analizează dacă `queryString` este un email
                    if (validator.isEmail(trimStr)) {
                        // caută în MongoDB dacă există emailul. În cazul în care există, indexează-l în Elasticsearch!
                        User.exists({email: queryString}).then(async (result) => {
                            try {
                                if (result) {
                                    await esClient.index({
                                        index: USR_IDX_ALS,
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
                        // _TODO: Sanetizează ceea ce este primit prin trimming și limitare la dimensiune de caractere
                    }
                    socket.emit('mesaje', `Am căutat în index fără succes. Pur și simplu nu există înregistrări sau trebuie să schimbi cheia de căutare nițel`);
                }
            } catch (error) {
                console.log("[sockets.js::'person'] Eroare la aducerea unui user cu următoarele detalii: ", error);
                logger.error(error);
                socket.emit('mesaje', `Din nefericire, căutarea utilizatorului a eșuat cu următoarele detalii: ${error}`);

                // CAZUL index_not_found_exception
                if (error.body.error.type == "index_not_found_exception") {
                    console.error("[sockets.js::'person'] Nu am găsit indexul utilizatorilor!!! Vezi dacă serverul de Elasticsearch este pornit.");
                } else if(error.body.error.type != "index_not_found_exception") {
                    console.error("Este o eroare pe care nu pot să o apreciez. Detalii: ", error);
                }
            }
        }
        socket.on('person', (queryString) => {
            searchUserInES (queryString).catch((err) => {
                console.log(err);
                logger.error(error);
            })
        });

        // === PERSONRECORD === :: FIȘA completă de utilizator
        socket.on('personrecord', (id) => {
            console.log('Din sockets.js [personrecord] -> id-ul primit este ', id);
            // https://mongoosejs.com/docs/api.html#model_Model.populate
            User.findById(id, function clbkFindById (error, user) {
                if (error) {
                    console.error("[sockets.js::'personrecord'] Eroare la aducerea resurselor personale cu următoarele detalii: ", error);
                    logger.error(error);
                    // socket.emit('mesaje', 'A dat eroare căutarea...');
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
                // Populează modelul!
                User.populate(user, opts, function clbkExecPopUser (error, res) {
                    if (error) {
                        console.log("[sockets.js::'personrecord'] Eroare la popularea modelului cu date: ", error);
                        logger.error(error);
                        // socket.emit('mesaje', 'A dat eroare căutarea...');
                    }
                    // console.log('Din sockets.js[on(personrecord)] -> după populare: ', res);
                    if (res) {
                        socket.emit('personrecord', res); // trimite rezultatul în client
                    }
                });
            });
        });

        // === STATS === ::STATS GENERAL
        socket.on('stats', (projectionObj) => {
            if (projectionObj) {
                // pentru fiecare dintre descriptori adu un set de date din MongoDB pe care-l trimiți în frontend
                projectionObj.descriptors.map(function clbkTreatDecr (descriptor) {
                    // pentru fiecare set de date extras, voi emite înapoi pentru a fi creat element în pagină
                    switch (descriptor) {
                        case 'reds':
                            Resursa.estimatedDocumentCount({}, function clbkResTotal (error, result) {
                                if (error) {
                                    console.log("[sockets.js::'stats'] Eroare la aducerea statisticilor cu următoarele detalii: ", error);
                                    logger.error(`[sockets.js::'stats'] Eroare la aducerea setului de RED-uri: ${error}`)
                                }
                                socket.emit('stats', {reds: result});
                                return result;                   
                            });
                        case 'users':
                            User.estimatedDocumentCount({}, function clbkUsersTotal (error, result) {
                                if (error) {
                                    console.log("[sockets.js::'stats'] Eroare la aducerea statisticilor cu următoarele detalii: ", error);
                                    logger.error(`[sockets.js::'stats'] Eroare la aducerea setului de useri: ${error}`);
                                }
                                socket.emit('stats', {users: result});
                                return result;    
                            });
                        case 'compets':
                            Competente.estimatedDocumentCount({}, function clbkCompetsTotal (error, result) {
                                if (error) {
                                    console.log("[sockets.js::'stats'] Eroare la aducerea numarului de competențe: ", error);
                                    logger.error(`[sockets.js::'stats'] Eroare la aducerea numărului de competențe: ${error}`)
                                }
                                socket.emit('stats', {compets: result});
                                return result;    
                            }); 
                        default:
                            return undefined;
                    }

                    // testează după valoarea descriptorului
                    if (descriptor === 'reds') {
                        const TotalREDs = Resursa.estimatedDocumentCount({}, function clbkResTotal (error, result) {
                            if (error) {
                                console.log("[sockets.js::'stats'] Eroare la aducerea statisticilor cu următoarele detalii: ", error);
                                logger.error(`[sockets.js::'stats'] Eroare la aducerea setului de RED-uri: ${error}`)
                            }
                            socket.emit('stats', {reds: result});
                            return result;                   
                        });
                    } else if (descriptor === 'users') {
                        const TotalUsers = User.estimatedDocumentCount({}, function clbkUsersTotal (error, result) {
                            if (error) {
                                console.log("[sockets.js::'stats'] Eroare la aducerea statisticilor cu următoarele detalii: ", error);
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

        // === STATS::ELK ===
        socket.on('elkstat', () => {
            let stats = esClient.indices.stats({
                index: "*,-.*",
                level: "indices"
            });

            let health = esClient.cat.health({
                format: "json",
                v: true
            });

            Promise.all([stats, health]).then((r) => {
                let data = {};
                for (obi of r) {
                    if (obi.body.indices) {
                        data.indices = obi.body.indices;
                    }
                    data.health = obi.body;
                }
                socket.emit('elkstat', data);
            }).catch((err) => {
                console.log('[sockets::elkstat] a apărut eroarea ', err.message);
                logger.error(err);
            });
        });

        // === REINDEXARE ES7 - funcția din '../models/model-helpers/es7-helper' ===
        socket.on('es7reidx', function es7reidxHandle (data) {
            return reidxincr(data, socket).catch((error) => {
                console.log(`[sockets.js::es7reidxr] `, error);
                logger.error(error);
            });
        });

        // === INDEX MONGODB RECs ===
        socket.on('mgdb2es7', function mgdb2es7Handle (data) {
            return mgdb2es7(data, socket);
        });
        
        // === DEL ES7 INDEX ===
        socket.on('es7delidx', function es7delidxHandle (data) {
            return deleteIndex(data, socket);
        });

        /**
         * Funcția `statDataMgdb` joacă rol de callback pentru 
         * `mongoose.connection.db.listCollections().toArray(statDataMgdb)` a evenimentului `socket.on('mgdbstat'`
         * Are rolul de a oferi clientului date privind numele colecțiilor
         * din MongoDB, indexul corespondent din Elasticseach și numărul documentelor fiecărora
         * <- `objectsOps` -> `searchOne()` face parte din setul de utilitare `/util/objectsOps.js`
         * <- `objectsOps` -> `pathOfProps` face parte din setul de utilitare `/util/objectsOps.js`
         * @param {Array} names reprezintă toate colecțiile bazei aplicației din MongoDB
         */
        async function statDataMgdb (err, names) {
            if (err) {
                console.log(`[socket::mgdbstat::statDataMgdb()] A apărut eroarea: ${err}`);
                logger.error(err);
            };

            // console.log(`Valoarea parametrului names este`, names);
            let mongocolections = names.map(ob => ob.name);

            // populează un array cu date despre indecșii din ES7,
            let data = JSON.parse(JSON.stringify(await es7stats())),
                nameCols = names.reduce((ac, nxt, idx) => {
                    if (ac.length === 0) {
                        ac[idx] = nxt.name
                    } else {
                        ac.push(nxt.name);
                    };                    
                    return ac;
                }, []); // iar din obiectul colecțiilor, extrage un array doar cu numele lor :: [ 'users', 'resursedus', 'logentries', 'competentaspecificas' ]

            /* 
            NOTE:
                Pentru fiecare nume de colecție din `nameCols`, cauta în `indicesES7` daca exista un index corespondent
                Dacă există, cauta o cheie cu același nume în `names` și îmbogățește obiectul pe acea ramură
            */
            let indicesES7 = Object.entries(data.body.indices); // constituie un array de array-uri
            // console.log('[socket::mgdbstat::statDataMgdb()] In array-ul de array-uri am: ', indicesES7);

            // Augmentez obiectul prin îmbogațirea cu informații despre cale.
            let colAugObject = objectsOps.pathOfProps(names); // augmentează obiectul!!!
            // console.log('[socket::mgdbstat::statDataMgdb()] Colectiile din MongoDB ca obiect augmentat are: ', colAugObject);
            indicesES7.forEach(([key, value]) => {

                // console.log(`Cheia este `, key, `iar valoarea este`, value);

                // Acoperă cazul în care alias-ul a fost numit gresit cu versiune in coadă, iar indexul fără. NOTE: motive istorice
                if ((/(\d{1,})+/g).test(key)) {
                    // Regex-ul testează dacă textul se termină cu cifre

                    // taie fragmentul de nume până la cifra care indică versiunea
                    let aliasES7 = key.slice(0, key.search(/(\d{1,})+/g)); // fragmentul indică alias-ul corect
                    let foundES7Idx, colname;

                    for (colname of mongocolections) {
                        if (aliasES7 === colname) {
                            foundES7Idx = objectsOps.searchOne(colname, colAugObject);
                            names[foundES7Idx.idxDataSet]['es7name'] = key;
                            names[foundES7Idx.idxDataSet]['noEs7Docs'] = value.total.docs;
                        }
                    }
                    // dacă nu, înseamnă că din motive istorice avem nevoie să lucrăm cu două seturi diferite de nume ( FIXME: )
                    // switch(aliasES7){
                    //     case 'resedus':
                    //         foundES7Idx = objectsOps.searchOne('resursedus', colAugObject);
                    //         names[foundES7Idx.idxDataSet]['es7name'] = key;
                    //         names[foundES7Idx.idxDataSet]['noEs7Docs'] = value.total.docs;
                    //         break;
                    //     case 'users':
                    //         foundES7Idx = objectsOps.searchOne('users', colAugObject);
                    //         names[foundES7Idx.idxDataSet]['es7name'] = key;
                    //         names[foundES7Idx.idxDataSet]['noEs7Docs'] = value.total.docs;
                    //         break;
                    // }
                }

                // cazul în care indexul de ES7 are echivalent același nume între colecțiile MongoDB
                if (nameCols.includes(key)) {
                    let foundES7Idx =  objectsOps.searchOne(key, colAugObject);
                    names[foundES7Idx.idxDataSet]['es7name'] = key;
                    names[foundES7Idx.idxDataSet]['noEs7Docs'] = value.total.docs;
                }
            });

            // creează un array al promisiunilor pentru a rezolva numărul documentelor
            let proms = names.map(async (entity) => {

                // obiectul șablon pentru fiecare înregistare (ajunge în client)
                let collection = {
                    name: '',
                    no: '',
                    es7name: '',
                    noEs7Docs: ''
                };

                // constituirea unui obiect cu datele pentru fiecare colecție în parte
                switch (entity.name) {
                    case "resursedus":
                        collection.name      = 'resursedus';
                        collection.no        = await Resursa.estimatedDocumentCount();
                        collection.es7name   = entity.es7name;
                        collection.noEs7Docs = entity.noEs7Docs;                        
                        return collection;
                        break;
                    case "users":
                        collection.name      = 'users';                      
                        collection.no        = await User.estimatedDocumentCount();
                        collection.es7name   = entity.es7name;
                        collection.noEs7Docs = entity.noEs7Docs;                          
                        return collection;
                        break;
                    case "logentries":
                        collection.name      = 'logentries';                        
                        collection.no        = await Log.estimatedDocumentCount();
                        collection.es7name   = entity.es7name;
                        collection.noEs7Docs = entity.noEs7Docs;                        
                        return collection;
                        break;
                    case "competentaspecificas":
                        collection.name      = 'competentaspecificas';
                        collection.no        = await Competente.estimatedDocumentCount();
                        collection.es7name   = entity.es7name;
                        collection.noEs7Docs = entity.noEs7Docs;                           
                        return collection;
                        break;
                };
            });
            // revolvă promisiunile și trimite datele în client
            Promise.all(proms).then((r) => {
                socket.emit("mgdbstat", r);
            }).catch((err) => {
                console.log(`[socket::mgdbstat::statDataMgdb()]A apărut eroarea`, err);
                logger.error(`[socket::mgdbstat::statDataMgdb()]A apărut eroarea ${err}`);
            });
        };
        // === STATS::MONGODB ===
        socket.on('mgdbstat', () => {
            mongoose.connection.db.listCollections().toArray((err, names) => {
                statDataMgdb(err, names).catch((err) => {
                    console.log(err);
                    logger.error(error);
                });
            });
        });

        /**
         * Funcția `es7stats` are rolul de a returna o promisiune 
         * care odata rezolvată va oferi date statistice despre indecșii existenți în ES7
         * Este folosită de funcția `statDataMgdb`.
         * @returns Promise
         */
        function es7stats () {
            return esClient.indices.stats({
                index: "*,-.*",
                level: "indices"
            });
        }

        // === ALLRES === ::TOATE RESURSELE
        socket.on('allRes', () => {
            // _FIXME: La un moment dat, când vei cere allRes, vor fi zeci de mii!!! Trebuie trimis un subset. Fă un bucketing pe MongoDB și adu agregate pe user!
            Resursa.find({}).exec().then(allRes => {
                socket.emit('allRes', allRes);
            }).catch((err) => {
                logger.error(`[sockets.js::'allRes'] Eroare la aducerea tuturor resurselor cu următoarele detalii: ${err}`);
            });
        });

        // === PAGEDRES === :: RESURSELE PAGINATE din MONGODB
        socket.on('pagedRes', (data) => {
            // console.log(`Ce am primit din client este `, JSON.stringify(data, null, 2));
            //_ TODO: modelează acest eveniment pentru resursele paginate necesare clientului
            // let dataPromise = pagination(data, Resursa);
            let dataPromise = pagination_cursor(data, Resursa);
            dataPromise.then( (data) => {
                // console.log(`Datele pe care le trimit în client sunt `, data.pagination);
                socket.emit('pagedRes', data);
            }).catch((err) => {
                console.log(`[sockets.js::'pagedRes'] Eroare la aducerea resurselor paginate cu următoarele detalii: ${err}`);
                logger.error(error);
            });
        });

        // === PERSONAL RES === ::TOATE RESURSELE UNUI UTILIZATOR
        socket.on('usrRes', (id) => {
            // console.log("Identificatorul pentru user pe care l-am primit este", id);
            Resursa.find({idContributor: id}).exec().then(pRes => {
                socket.emit('usrRes', pRes);
            }).catch((error) => {
                logger.error(error);
            });
        });

        /**
         * Funcția `getUser` returnează un user din bază
         * @param {String} id este identificatorul alfanumeric al utilizatorului în sistem
         * @returns Promise
         */
        function getUser (id) {
            return User.findById(id).exec();
        }

        // === PERSONAL LOGS === ::TOATE CONRIBUTIILE LOG
        socket.on('usrLog', async (id) => {
            try {
                let user = await getUser(id);
                socket.emit('usrLog', await Log.find({idContributor: user.email}).exec());
            } catch (error) {
                logger.error(`[sockets.js::'usrRes'] Eroare la aducerea utilizatorului cu următoarele detalii: ${error}`);
            }
        });

        // === ALLUSERS === ::TOȚI UTILIZATORII
        socket.on('allUsers', () => {
            User.find({}).exec().then(allUsers => {
                socket.emit('allUsers', allUsers);
            }).catch((err) => {
                logger.error(`[sockets.js::'allUsers'] Eroare la aducerea utilizatorilor cu următoarele detalii: ${err}`);
            });
        });

        // === ALLCOMPS === ::TOATE COMPETENȚELE SPECIFICE
        socket.on('allComps', () => {
            Competente.find().populate('nrREDuri').exec()
            .then((allComps) => {
                // console.log(allComps[0]);
                socket.emit('allComps', allComps);
            }).catch((err) => {
                logger.error(`[sockets.js::'allComps'] Eroare la aducerea tuturor competențelor specifice: ${err}`);
            });
        });

        // ==== ALLUNCLAIMEDREDS === :: Toate redurile care au fost încărcate dar nu au fost revendicate
        socket.on('allUnclaimedReds', (data) => {
            Resursa.find({angel: {$exists: true}}, '_id emailContrib uuid title claimed generalPublic').exec()
            .then((allUnclaimed) => {
                // console.log(`Datele pe care le trimit clientului sunt `, allUnclaimed);
                socket.emit('allUnclaimedReds', allUnclaimed);
            }).catch((err) => {
                logger.error(`[sockets.js::'allComps'] Eroare la aducerea tuturor competențelor specifice: ${err}`);
            });
        });

        // TEST!!!
        socket.on('tryme', (data) => {
            console.log(data);
        })

        // === ACTUALIZEAZĂ O COMPETENȚĂ ===
        async function clbkUpdComp (record) {
            try {
                const data = {
                    nume:       record.nume,
                    activitati: record.activitati,
                    cod:        record.cod,
                    coddisc:    record.coddisc,
                    disciplina: record.disciplina,
                    nivel:      record.nivel,
                    parteA:     record.parteA,
                    ref:        record.ref
                };
                // Cazul Update
                if(record.id) {
                    // console.log('Datele primite în server pe `updateComp` sunt: ', record);
                    let filter =  {_id: record.id};
                    let doc = await Competente.findOneAndUpdate(filter, data, {
                        new: true,
                        upsert: true // Make this update into an upsert
                    });
                    doc.save();
                } else {
                    // Cazul Create
                    data._id = new mongoose.Types.ObjectId();
                    let doc = new Competente(data);
                    doc.save().then((result) => {
                        // trimite clientului 
                        socket.emit('updateComp', result.id);
                    }).catch(error => {
                        console.log('Am încercat să salvez o nouă competență, dar a apărut eroarea: ', error.message);
                        logger.error(error);
                    })
                }
            } catch (error) {
                console.log(error);
                logger.error(error);
            }
        }
        socket.on('updateComp', (record) => {
            clbkUpdComp(record).catch((err) => {
                console.log(err);
                logger.error(error);
            })
        });

        // === ȘTERGE O COMPETENȚĂ ===
        async function clbkDelComp (id) {
            try {
                if (id) {
                    const res = await Competente.deleteOne({ _id: id });
                    // console.log('Rezultatul ștergerii este: ', res);
                    if (res.ok === 1) {
                        socket.emit('delComp', id);
                    }
                } else {
                    console.log('Nu am pe cine să șterg. Id-ul primit este: ', id);
                }    
            } catch (error) {
                console.log(error);
                logger.error(error);
            }
        }
        socket.on('delComp', (id) => {
            clbkDelComp(id).catch((err) => {
                console.log(err);
                logger.error(error);
            })
        });

        /**
         * Funcția are rolul de a strânge toate activitățile unei competențe specifice într-un array dedicat.
         * Când sunt erori, problema stă în normalizarea datelor. ATENȚIE! M-am opărit!
         * @param {Object} data Este un obiect de date
         */
        function foldOneField (data) {
            const folded = data.reduce((arrAcc, elemArrOrig, idx, srcArr) => {
                // Inițial, acumulatorul este un array fără niciun element. Este necesară introducerea primului:
                if (arrAcc.length === 0) {
                    arrAcc[idx] = elemArrOrig;
                }
                // Verifică câmpul `ids` al ultimului element din array (ultimul introdus)
                if (arrAcc.slice(-1)[0].ids[0] === elemArrOrig.ids[0]) {
                    // pentru toate activitățile existente în array-ul `activități`,
                    elemArrOrig.activitati.forEach((act) => {
                        arrAcc.slice(-1)[0].activitati.push(act); // introdu-le în array-ul activități a înregistrării preexistente
                    });
                } else {
                    // În cazul în care `ids` diferă, înseamnă că ai de-a face cu o nouă competență, care va constitui o nouă înregistrare
                    arrAcc.push(srcArr[idx]); // care la rândul ei va împături activități.
                }
                return arrAcc;
            }, []);
            return folded;
        }

        // === ÎNCARCĂ UN SET DE COMPETENȚE ===
        socket.on('loadCompSet', (file) => {
            let fileBuffer = Buffer.from(file);
            // console.log('toString()', fileBuffer.toString());
            const readF = Readable.from(fileBuffer); // Creează stream Read din fișierul CSV sursă.
            /* === PRELUCRAREA CSV-ului ===  */
            Papa.parse(readF, {
                worker: true,
                header: true,
                encoding: 'utf8',
                transformHeader: function (header) {
                    // console.log(header);
                    if (header === 'nume') return 'nume';
                    if (header === 'ids') return 'ids';
                    if (header === 'cod') return 'cod';
                    if (header === 'activitate') return 'activitati';
                    if (header === 'disciplină') return 'disciplina';
                    if (header === 'coddisc') return 'coddisc';
                    if (header === 'nivel') return 'nivel';
                    if (header === 'act normativ') return 'ref';
                    if (header === 'competență generală') return 'parteA';
                    // if (header === 'număr competența generală') return 'compGen';
                },
                transform: function (value, headName) {
                    // console.log(headName);
                    // Array.isArray(obj) ? obj:[obj]
                    if (headName === 'nume') {
                        return value;
                    } else if (headName === 'ids') {
                        value = [].concat(value);
                        return value;
                    } else if ((headName === 'cod')) {
                        return value;
                    } else if (headName === 'activitati') {
                        value = [].concat(value);
                        return value;
                    } else if (headName === 'disciplina') {
                        value = [].concat(value);
                        return value;           
                    } else if (headName === 'coddisc') {
                        return value;           
                    } else if (headName === 'nivel') {
                        value = [].concat(value);
                        return value;
                    } else if (headName === 'ref') {
                        value = [].concat(value);
                        return value;
                    } else if (headName === 'parteA') {
                        return value;
                    } 
                    // else if (headName === 'compGen') {
                    //     return value;
                    // }
                },
                complete: function (results, file) {
                    if (results.errors) {
                        console.log(results.errors);
                        logger.error(results.errors);
                    }
                    const folded = foldOneField(results.data); // apelează funcția de folding
                    // scrie datele pe disc...
                    // fs.writeFile(`${dir}/all.json`, JSON.stringify(folded), 'utf8', (err) => {
                    //     if (err) throw err;
                    // });
                    
                    // scrie datele în bază
                    //mongoose.connection.dropCollection('competentaspecificas'); // Fii foarte atent: șterge toate datele din colecție la fiecare load!.
                    
                    Competente.insertMany(folded, function cbCompetenteInsMany (err, result) {
                        if (err) {
                            console.log(err);
                            logger.error(err);
                            socket.emit('loadCompSet', false);
                        } else {
                            socket.emit('loadCompSet', result.length);
                            // console.log('Numărul de competențe specifice inserate în colecție (nu înregistrări): ', result.length);
                        }
                    });
                },
                error: function (err, file) {
                    if (err) {
                        console.log(err.message);
                        logger.error(err.message);
                    }
                }
            });
        });

        // Filtru MongoDB Compass: {date: {$gt: ISODate('2022-01-24T08:29:43.011+00:00')}}

        // NOTE: Procedura mare
        // #1. Caută în colecția `users` dacă există vreo înregistrare cu emailul înregistrării prelucrate.
        // #2. Dacă există userul, introdu `_id`-ul la valoarea unui nou câmp `idContributor` în înregistrare (este claiming-ul automat)
        // #2.0. Creează o funcție care generează programatic o înregistrare validă de editorjs. Obiectul rezultat va fi valoarea câmpului `content`.
        // #2.1. Creează resursa pe hard în subdirectorul `repo/${idContributor}`
        // #2.2. Creează înregistrarea resursei în colecția `resedus`.
        // #3. Dacă nu există userul introdu un câmp `claimed` a cărui valoare să fie `false`.
        // #3.0. Creează o funcție care generează programatic o înregistrare validă de editorjs. Obiectul rezultat va fi valoarea câmpului `content`.
        // #3.1. Creează resursa pe hard în subdirectorul `repo/general/red/nume_email`.
        // #3.2. Creează înregistrarea resursei în colecția `resedus`. Problemă: cum generezi o înregistrare validă de editorjs programatic.
        const CSModel = require('../models/competenta-specifica');

        /**
         * Funcția are rolul de a prelua un rând - o înregistrare și în baza câmpurilor existente
         * va crea o înregistrare nouă în baza de date, precum și directorul aferent
         * @param {Object} resursa Este un rând din fișierul csv care este parcurs de Papaparse 
         */
        async function createREDRecord (data) {
            // VIITORUL RED.content
            let content = {
                time: Date.now(),
                blocks: [],
                version: process.env.EDITORJS
            };

            // Completarea cu date a obiectului necesar afișării folosind Editor.js
            // Introdu paragrafele de text (nu necesită procesare)
            content.blocks.push({
                "id": nanoid(10),
                "type": "paragraph",
                "data": {
                    "text": `<p>${data.re_competentapropusa}</p>`
                }
            });

            /* Tratarea a tot ce înseamnă link - https://stackoverflow.com/questions/30931079/validating-a-url-in-node-js/55585593 */
            // Array cu stringurile care pretind că sunt linkuri care trimit spre diferitele componente ale resursei (vezi și https://github.com/ogt/valid-url)

            let lfields = [data.re_linkonline, data.re_incarcarematerial, data.re_adresadescriptor];
            let links4processing = lfields.filter((textstring) => validUrl.isUri(textstring)), lnk; // Filtrează NULL-urile

            /* === CONSTRUCȚIA PREVIEW-urilor PENTRU RESURSELE CARE OFERĂ POSIBILITATE DE EMBED === */
            for (lnk of links4processing) {
                let urlobject  = new URL(lnk); // https://www.kindacode.com/article/node-js-get-domain-hostname-and-protocol-from-a-url/
                let hostName   = urlobject.hostname;
                let domainName = hostName.replace(/www\.?/g, '');
                /*
                    [SERVICII FOLOSITE]
                    library.livresq.com
                    youtube.com
                    view.genial.ly
                    animoto.com
                    docs.google.com
                    forms.gle
                    view.livresq.com
                    sway.office.com
                    ro.padlet.com
                    walter-fendt.de
                    learningapps.org
                    wordwall.net
                    canva.com
                    liveworksheets.com
                */

                switch (domainName) {
                    case "youtube.com":
                        // https://stackoverflow.com/a/51870158/1271340
                        let rgx = /(https?:\/\/)?((www\.)?(youtube(-nocookie)?|youtube.googleapis)\.com.*(v\/|v=|vi=|vi\/|e\/|embed\/|user\/.*\/u\/\d+\/)|youtu\.be\/)([_0-9a-z-]+)/i;
                        let videoid = lnk.match(rgx)[7];
                        content.blocks.push({
                            "id": nanoid(10),
                            "type": "embed",
                            "data": {
                                "service": "youtube",
                                "source": `https://youtu.be/${videoid}`,
                                "embed": `https://youtube.com/embed/${videoid}`,
                                "width": 580,
                                "height": 320,
                                "caption": ""
                            }
                        });
                        break;
                    /* === NOTE: Deschis issue: https://github.com/editor-js/embed/issues/80#issue-1125280058 (deocamdată doar link!!!)*/
                    // case "view.genial.ly":
                    //     let segments = urlobject.pathname.split('/');
                    //     let id = segments[1];

                    //     let titlearr, title;
                    //     if (segments[2]){
                    //         titlearr = segments[2].split('-');
                    //         if (titlearr[0] === 'presentation' || titlearr[0] === 'video'){
                    //             titlearr.shift();
                    //             title = titlearr.join(' ');
                    //         }
                    //     }

                    //     if (id) {
                    //         content.blocks.push({
                    //             "id": nanoid(10),
                    //             "type": "embed",
                    //             "data": {
                    //                 "service": "genially",
                    //                 "source": `https://view.genial.ly/${id}`,
                    //                 "embed": `https://view.genial.ly/${id}`,
                    //                 "caption": title
                    //             }
                    //         });
                    //     }
                    //     break;
                    default:
                        // creează un block de link
                        content.blocks.push(
                            {
                                "id": nanoid(10),
                                "type": "paragraph",
                                "data": {
                                    "text": `<a href="${lnk}">${lnk}</a>`
                                }
                            }
                        );
                        break;
                }

            }

            //_TODO: Prelucrează etichetele
            let etichete = data.etichete.split(',');

            // OBIECTUL COLECTOR MARE completat cu datele inițiale
            let RED = {
                title:         data.title,
                description:   data.description === 'NULL' ? '' : data.description,
                autori:        data.autori,
                emailContrib:  data.emailContrib,
                date:          data.date,
                discipline:    [data.discipline],
                level:         [data.level],
                competenteGen: [data.competenteGen],
                competenteS:   [],
                content:       content,
                etichete,
                licenta:       'CC-BY',
            }

            let users = await User.find({email: data.emailContrib}).exec(); // adu array-ul userilor găsiți

            // în cazul în care există userul
            if (users.length > 0) {
                RED.claimed = true; // resursa este claimed automat
                if (users[0].id) {
                    RED.idContributor = users[0].id;
                    RED.angel = data.angel;
                } else {
                    console.error(`[createREDRecords] Identificatorul userului nu a fost găsit [User.find]`);
                }
            } else {
                // userul nu există. Creează înregistrare având `claimed: false`
                RED.claimed = false;
                // _TODO: Metoda:
                // în câmpul `idContributor` va fi id-ul adminului până în momentul în care se va face claimul de către persoana care și-a făcut și contul ceva mai târziu.
                // la `emailContrib` va fi mailul persoanei, identificator în baza căruia se va putea face claim-ul.
                // când persoana face claim-ul (încarcă resursa care prezintă un buton numit *claim*; îi apare într-un tabel separat de posibile claim-uri), va modica câmpul `idContrib` cu propriul id.
                // Asta înseamnă că resursele se vor crea în subdirectorul de administrator. Când se face claimul, se vor muta în subdirectorul userului care a făcut claimul.
                
                if (data.angel) {
                    RED.idContributor = data.angel;
                    RED.angel = data.angel;
                } else {
                    console.error(`[createREDRecords] Identificatorul angel nu a fost găsit [User.find]`);
                }
            }

            // Adu-mi array-ul competențelor
            let competentele = await CSModel.aggregate([{$match: {
                cod: {$in: [data.re_competentaspecificacod]}
            }}]);

            if (competentele) {
                // Introdu obiectele id ale fiecărei competențe aduse
                competentele.forEach((c) => RED['competenteS'].push(c._id));

                // console.log(`[loadRedSet] Calea de depozitare este `, path2deposit);
                let uuid = crypto.randomUUID({disableEntropyCache : true});
                let path2deposit = `${process.env.REPO_REL_PATH}${RED.idContributor}/${uuid}`;
                
                // Încarcă modelul cu date!!!
                var resursaEducationala = new Resursa({
                    _id:             mongoose.Types.ObjectId(),
                    date:            RED.date,
                    uuid:            uuid,
                    title:           RED.title,
                    description:     RED.description,
                    idContributor:   RED.idContributor,
                    emailContrib:    RED.emailContrib,
                    autori:          RED.autori,
                    rol:             'resursa susține o activitate de învățare indicată în programa școlară',
                    level:           RED.level,
                    discipline:      RED.discipline,
                    competenteGen:   RED.competenteGen,
                    competenteS:     RED.competenteS,
                    content:         RED.content,
                    etichete:        RED.etichete,
                    licenta:         RED.licenta,
                    expertCheck:     true,
                    generalPublic:   true,
                    angel:           RED.angel
                });

                /* ==== Salvează în baza de date ==== */
                let res = await resursaEducationala.save();
                
                /* 
                    ==== Salvează în repo ==== 
                    # Salvează ca json întreaga înregistrare în `./data`;
                    # Creează repo-ul git-ului
                */
                if (res === resursaEducationala) {
                    /* === Scrie JSON-ul întregii înregistrării în `data` === */
                    const newRes = Object.assign({}, res);          // fă o copie shallow a obiectului primit din client
                    newRes._id   = res._id;                         // introdu în obiectul JSON id-ul înregistrării din MongoDB. Se va dovedi util în cazul reconstituirii bazei de date.
                    let existBag = BagIt(path2deposit, 'sha256');   // ref pe Bag-ul existent

                    /* === CREAREA REPO-ului `.git` === */
                    await git.init({ fs, dir: path2deposit });      // Primul commit se va face la prima cerere de investigare informațiilor despre resursă.

                    /* === SCRIE OBIECTUL JSON în BAG === */                
                    const data = Buffer.from(JSON.stringify(newRes)); // transformă în `Buffer` obiectul `newRes`
                    let strm = new Readable();
                    strm._read = () => {}; // _read este necesar!!!
                    strm.push(data);
                    strm.push(null);

                    // creează stream-ul destinație
                    var destinationStream = existBag.createWriteStream(`${crypto.randomUUID({disableEntropyCache : true})}.json`); // uuid diferit pentru a avea timestampul uuid-ului v4 diferit de cel al subdirului

                    // scrierea stream-ului pe hard (distruge streamul sursă și curăță) -> introdu un nou fișier în Bag-ul existent al resursei
                    pipeline(strm, destinationStream, function clbkAfterREDWrittenStrm (error, val) {
                        if (error) {
                            console.error("[sockets.js::'loadRedSet'] Nu s-a reușit scrierea fișei JSON în Bag", error);
                            logger.error(error);
                        }

                        /* === ÎNCHIDE BAG-ul!!! === */
                        existBag.finalize(() => {
                            // Scrie un log privind importul
                            // https://stackoverflow.com/questions/3459476/how-to-append-to-a-file-in-node/43370201#43370201
                            fs.appendFileSync(`${__basedir}/data/log.json`, JSON.stringify(res));
                            return;
                        });
                    });
                }
            } 
        };

        // === ÎNCARCA SETUL RED-urilor din sursă externă ===
        socket.on('loadRedSet', (file) => {
            let fileBuffer = Buffer.from(file);
            const readF = Readable.from(fileBuffer); // Creează stream Read din fișierul CSV sursă.

            let results = Papa.parse(readF, {
                worker: true,
                header: true,
                encoding: 'utf8',
                step: function (results, parser) {
                    // console.log(`datele`, results.data);
                     // apelează funcția de prelucrare a fiecărei înregistrări
                    createREDRecord(results.data).catch((error) => {
                        console.log(error);
                        logger.error(error);
                    }); // `results.data` este un singur rând // https://github.com/mholt/PapaParse/issues/613
                },
                complete: function (results, file) {
                    // console.log(`Informație suplimentară `, results.meta, `Erori dacă sunt `, results.errors);
                    
                    // DRY-RUN: scrie datele pe disc...
                    // fs.writeFile(`${__basedir}/data/imported.json`, JSON.stringify(results.data), 'utf8', (err) => {
                    //     if (err) throw err;
                    // });
                },
                error: function (err, file) {
                    if (err) {
                        console.log(`Papa are următoarele erori `, err);
                        logger.error(err.message);
                    }
                }
            });
            console.log(`Rezultate în urma prelucrării`, results);                
        });

        // === UPDATE PE CÂMPURI UNICE ALE UNUI RED ===
        socket.on('redfieldup', (data) => {
            // console.log(`Pe redfieldup am primit`, data);
            // _NOTE: Trebuie actualizată înregistrarea din MongoDB dar și cea din Elasticsearch

            // TODO: Verifică ca userul să aibă drepturile să facă modificarea (câmpul `idContributor`)
            Resursa.findById(data.id, function clbkFindByIdRedfieldupResursa (err, record) {

                // Verifică cazul în care `record.idContributor` are credențiale `admin` sau `validator`. constituie un array cu rolurile. Validatorul nu are drept de modificare, doar adminul
                User.findById(data.user, function clbkFindByIdRedfieldupUser (err, user) {
                    // cazul când se face verificarea strictă, fie userul este același cu cel al resursei, fie este administrator
                    if (record.idContributor === data.user || user.roles.admin) {
                        Resursa.findByIdAndUpdate(data.id, {[data.fieldname]: data.content}, (doc) => {
                            socket.emit('redfieldup', doc);
                        }); // https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
                    } else {
                        socket.emit('redfieldup', {message: "Înregistrarea nu-ți aparține. Prerogativă a administratorului", code: 401});
                    }
                });
            });
        });

        // === UPDATE PE APRECIERE
        socket.on('ratingred', (data) => {
            
        });

        /**
         * Folosește în funcția clbkMgmt drept callback evenimentului `mgmt`
         * Doc pentru upsert https://masteringjs.io/tutorials/mongoose/findoneandupdate
         * @param {*} data Object date
         */
        function clbkMgmt (data) {
            const filter = {focus: 'general'};

            // CAZUL în care obiectul este gol
            // Dacă primești un obiect gol de la client, verifică mai întâi să cu cumva să existe deja creată înregistrarea goală, având doar valorile default
            Mgmtgeneral.findOne(filter, (error, result) => {
                if (error) {
                    console.log(error);
                    logger.error(error);
                }
                // dacă obiectul este diferit de null, înseamnă că pasul de creare a primei înregistrări a fost făcut. Trimite-l clientului.
                if (result) {
                    socket.emit('mgmt', result);
                } else {
                    // dacă te afli în momentul 0, la setările inițiale, se va crea prima înregistrare
                    Mgmtgeneral.create({}, (error, doc) => {
                        if (error) {
                            console.log(error);
                            logger.error(error);
                        }
                        socket.emit('mgmt', doc);
                    }); 
                    // se creează prima înregistrare cu cele două câmpuri care capătă valorile default
                }
            });
        }
        socket.on('mgmt', (data) => {
            // console.log(`Am primit datele: `, data);
            const objFromClient = data.mgmt;
            const objIsEmpty = objFromClient && Object.keys(objFromClient).length === 0 && Object.getPrototypeOf(objFromClient) === Object.prototype;
            // console.log(`Obiectul primit de la user este gol: `, objIsEmpty);

            const filter = {focus: 'general'};
            const opts = { new: true, upsert: true };

            // CAZUL în care obiectul este gol
            if (objIsEmpty) {
                clbkMgmt(data);
            } else {
                // Aici facem upsertul cu datele noi
                Mgmtgeneral.findOneAndUpdate(filter, objFromClient, opts, (error, doc) => {
                    if (error) {
                        console.log(error);
                        logger.error(error);
                    }
                    socket.emit('mgmt', doc);
                });
            }
        });
    }

    /* === SOCKETURI!!! === */
    pubComm.on('connect', clbkOnConnect);

    return io;
};

module.exports = sockets;