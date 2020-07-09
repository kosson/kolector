require('dotenv').config();
const fs          = require('fs-extra');
const archiver    = require('archiver');
const path        = require('path');
// const querystring = require('querystring');
const BagIt       = require('bagit-fs');
const {v4: uuidv4}= require('uuid'); // https://github.com/uuidjs/uuid#deep-requires-now-deprecated
// const Readable    = require('stream').Readable;
// const {pipeline}  = require('stream');
const {Readable, pipeline} = require('stream');
const mongoose    = require('mongoose');
const validator   = require('validator');
const esClient    = require('../elasticsearch.config');
const Resursa     = require('../models/resursa-red'); // Adu modelul resursei
const UserSchema  = require('../models/user'); // Adu schema unui user
const Log         = require('../models/logentry');
const editorJs2HTML= require('../routes/controllers/editorJs2HTML');
// necesare pentru constituirea și gestionarea repo-ului de git
const globby      = require('globby');
const git         = require('isomorphic-git');

// funcțiile de căutare
const {findInIdx, aggFromIdx} = require('./controllers/elasticsearch.ctrl');

/**
 * Funcția are rolul de a face staging la tot ce există în parametrul `calea` urmat de commit
 * Funcția este echivalentul lui `git add .` (cu respectarea unui `.gitignore`, dacă există) combinat cu `git commit -a -m "mesajul"`
 * @param {String} calea Este calea relativă a subdirectorului resursei. Începe cu punct
 * @param {String} autori Este stringul autorilor din care va fi extras primul ca fiind cel care face repo-ul
 * @param {String} email Adresa de email a celui care dace repo-ul
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
        console.log(sha); // E neapărat!!! Altfel nu se face commit-ul!
    } catch (error) {
        if (error) {
            console.error(error);
        }
    }
}

module.exports = function sockets (pubComm) {
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
    let desiredMode = 0o2775
    let options = { mode: 0o2775 }

    /* === SOCKETURI!!! === */
    pubComm.on('connect', (socket) => {
        // === MESAJE === ::Ascultă mesajele
        socket.on('mesaje', function cbMesaje (mesaj) {
            console.log(mesaj);
        });

        // === COMPETENȚELE SPECIFICE ===
        socket.on('csuri', function cbCsuri (data) {
            // console.log("[sokets.js::<'csuri'>] Array-ul disciplinelor selectate este ", data);// De ex: [ 'arteviz3', 'stanat3' ] `data` sunt codurile disciplinelor selectate
            
            const CSModel = require('../models/competenta-specifica');
            // Proiecția se constituie pe același câmp, dar pe valorile primite prin socket.
            CSModel.aggregate([{$match: {
                coddisc: {$in: data}
            }}]).then(rez => {
                pubComm.emit('csuri', JSON.stringify(rez));
            });
        }); // apel al funcția `cbCsuri` de mai jos

        // === RESURSA === ::Primește fișiere, fapt care conduce la crearea Bag-ului. Servește instanței de Editor.js (uploadByFile și uploadByUrl)
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
            let calea = `${process.env.REPO_REL_PATH}${resourceFile.user}/`;

            // Transformarea Buffer-ului primit într-un stream `Readable`
            var sourceStream = new Readable();      // Creează stream-ul Readable
            sourceStream.push(resourceFile.resF);   // Injectează Buffer-ul care este fișierul, de fapt
            sourceStream.push(null);                // Trimite null în stream pentru a semnala faptul că injectarea fișierului s-a încheiat.

            // asigură-te că poți scrie în directorul userului
            fs.access(calea, function clbkfsAccess (error) {
                if (error) {
                    console.log("[sockets.js::resursa] La verificarea posibilității de a scrie în directorul userului am dat de eroare: ", error);
                } else {
                    // console.log("[sockets.js::resursa] Directorul există și poți scrie liniștit în el!!!");
                }
            });

            /*
            * === PRIMUL FIȘIER ÎNCĂRCAT ===
            * dacă resursa primită nu are UUID, înseamnă că este prima. Tratează cazul primei resurse
            */
            if (resourceFile.uuid === '') {
                // console.log('[sockets::resursa] Prima imagine incarcata uuid-ul va fi: ', typeof(resourceFile.uuid));
                // setează lastUuid [este chiar numele subdirectorului resursei]
                lastUuid = uuidv4();

                // ajustează calea adăugând fragmentul uuid [subdirectorului resursei]
                let newPath = calea + `${lastUuid}`;
                // console.log("[sockets.js::'resource'] Aceasta este calea în care voi crea Bag-ul: ", newPath);

                /* === ASIGURĂ-TE CĂ DIRECTORUL EXISTĂ === */
                fs.ensureDir(newPath, desiredMode, err => {
                    // dacă directorul nu există, va fi emisă eroarea, dar va fi creat
                    if(err === null){
                        // console.log("[sockets.js::'resource'] Încă nu am directorul în care să scriu fișierul. Urmează!!!");                        
                    }
                    // Generează bag-ul. La Contact-Name vei avea numele autorului/rilor introduși în formular
                    lastBag = BagIt(newPath, 'sha256', {'Contact-Name': `${resourceFile.name}`}); //creează BAG-ul
                    // console.log("[sockets.js::'resource'] Am creat Bag-ul și `lastBag` are aceste detalii: ", lastBag);
                    
                    // creează stream-ul destinație
                    var destinationStream = lastBag.createWriteStream(`${resourceFile.numR}`);

                    // adăugarea fișierului primit în Bag
                    // sourceStream.pipe(destinationStream); // SCRIE PE HARD [OLD]
                    pipeline(sourceStream, destinationStream, (error, val) => {
                        if (error) {
                            console.error("Nu s-a reușit scrierea primului fișier în Bag", error);
                        }
                        // console.log('[sockets.js::resursa] Am primit următoarea valoare de pe streamul destination ', val);
                    });

                    // Calea către fișier [ce pleacă în client] și calea locală către aceasta
                    let file = `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${lastUuid}/data/${resourceFile.numR}`;
                    let localF = `${process.env.REPO_REL_PATH}${resourceFile.user}/${lastUuid}/data/${resourceFile.numR}`;

                    /* === VERIFICĂ DACĂ FIȘIERUL CHIAR A FOST SCRIS === */
                    fs.access(localF, fs.F_OK, (err) => {
                        if (err) {
                            console.log("[sockets.js::'resursa'::fără uuid] Nu am găsit fișierul tocmai scris: ",err);
                        }
                        // construiește obiectul de răspuns necesar lui Editor.js
                        var responseObj = {
                            success: 1,
                            uuid: lastUuid,
                            file,
                            size: resourceFile.size
                        };
                        // trimite înapoi în client obiectul de care are nevoie Editor.js pentru confirmare
                        socket.emit('resursa', responseObj);
                        // socket.emit('uuid', lastUuid); // actualizează uuid-ul în client
                    });
                })            
            /*
            * === SCRIEREA CELORLALTE FIȘIERE CARE VIN ===
            * dacă este primit un uuid din client, scrie fișierul în acel uuid!!
            */
            } else if (resourceFile.uuid) {
                // setează calea către directorul deja existent al resursei
                let existPath = calea + `${resourceFile.uuid}`;

                // Calea către fișier [ce pleacă în client]
                let file = `${process.env.BASE_URL}/${process.env.NAME_OF_REPO_DIR}/${resourceFile.user}/${resourceFile.uuid}/data/${resourceFile.numR}`;
                let localF = `${process.env.REPO_REL_PATH}${resourceFile.user}/${resourceFile.uuid}/data/${resourceFile.numR}`; // calea către fișierul local din server

                /* === ASIGURĂ-TE CĂ DIRECTORUL EXISTĂ === */
                fs.ensureDir(existPath, desiredMode, err => {
                    // console.log(err) // => null
                    if(err === null){
                        console.log("[sockets.js::'resursa'::cu uuid] Încă nu am directorul în care să scriu fișierul. Urmează!!!");                        
                    }
                    // reactualizează referința către Bag. Verifică dacă cu cumva funcționează fără.
                    lastBag = BagIt(existPath, 'sha256');

                    // creează stream-ul destinație
                    var destinationStream = lastBag.createWriteStream(`${resourceFile.numR}`);

                    // adăugarea fișierului primit în Bag
                    // sourceStream.pipe(destinationStream); // SCRIE PE HARD [OLD]
                    pipeline(sourceStream, destinationStream, (error, val) => {
                        if (error) {
                            console.error("[sockets.js::'resursa'::cu uuid] Nu s-a reușit scrierea fișierului în Bag", error);
                        }
                        // console.log('[sockets.js::resursa] Am primit următoarea valoare de pe streamul destination ', val);
                    });

                    /* === VERIFICĂ DACĂ FIȘIERUL CHIAR A FOST SCRIS === */
                    fs.access(localF, fs.F_OK, (err) => {
                        if (err) {
                            console.log("[sockets.js::'resursa'::cu uuid] Nu am găsit fișierul tocmai scris: ",err);
                            // socket.emit('mesaje', 'Deci, e grav rău! Nu am putut găsi fișierul subdirectorul resursei din depozit!');
                        }
                        // construiește obiectul de răspuns.
                        var responseObj4AddedFile = {
                            success: 1,
                            file,
                            size: resourceFile.size
                        };
                        // trimite înapoi obiectul necesar confirmării operațiunii lui Editor.js
                        socket.emit('resursa', responseObj4AddedFile);
                    });                    
                });
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
        socket.on('red', function clbkCreateRED (RED) {
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
            pResEd.then(async function clbkThenSave (res) {
                // Trimite înregistrarea și în Elasticsearch și creează și un fișier json pe hard în subdirectorul red-ului [FIXED::`post`hook pe schemă la `save`]
                /* === Scrie JSON-ul înregistrării în `data` === */
                const newRes = Object.assign({}, RED);
                newRes._id = res._id; // introdu în obiectul JSON id-ul înregistrării din MongoDB -> Recovery latter!
                
                let calea = `${process.env.REPO_REL_PATH}${RED.idContributor}/${RED.uuid}/`;    // creează calea pe care se va depozita.                
                let existBag = BagIt(calea, 'sha256');  // ref pe Bag-ul existent
                
                /* === CREAREA REPO-ului .git === */
                await git.init({ fs, dir: calea }); // Atenție, urmează să se facă și primul commit.

                // transformă în Buffer obiecul `newRes`
                const data = Buffer.from(JSON.stringify(newRes));
                let strm = new Readable();
                strm._read = () => {} // _read este necesar!!!
                strm.push(data);
                strm.push(null);

                // creează stream-ul destinație
                var destinationStream = existBag.createWriteStream(`${uuidv4()}.json`); // uuid diferit de RED.uuid pentru a avea versiunile diferențiate

                // scrierea stream-ului pe hard (distruge streamul sursă și curăță) -> introdu un nou fișier în Bag-ul existent al resursei
                pipeline(strm, destinationStream, function clbkAfterREDWrittenStrm (error, val) {
                    if (error) {
                        console.error("[sockets.js::'red'] Nu s-a reușit scrierea fișei JSON în Bag", error);
                    }
                    // console.log("[sockets.js::'red'] Înainte de a încerca să fac commit-ul", res);
                    commitAll(calea, res.autori, res.emailContrib, res.title);
                    // console.error("[sockets.js::'red'] obiectul care ar trebui să ajungă în client are id: ", res._id);
                });

                //socket.emit('ingest', res); // se emite înregistrarea către frontend. Dacă frontendul primește înregistrare, va redirecta către resursă.
                /* === SAVARE RESURSĂ ÎN MONGO === */
                res.save(); // Se aplică un hook `post` pentru a indexa în ES!
                return res;
            }).then(res => {
                socket.emit('confirm', res._id);
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
                // rre('mesaje', `Am șters fișierul ${cleanFileName}`);
                // socket.emit('delfile', `Am șters fișierul ${cleanFileName}`);
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
                }).catch(err => {
                    console.log(err);
                });
        });

        // === DELRESID === ::Ștergerea unei resurse
        socket.on('delresid', (resource) => {            
            let dirPath = path.join(`${process.env.REPO_REL_PATH}`, `${resource.content.idContributor}`, `${resource.content.uuid}`);
            
            // Șterge din MongoDB, din Elasticsearch, precum și de pe hard
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
                            throw err;
                        }
                    });
                    // ERRORS
                    archive.on('error', function(err) {
                        throw err;
                    });

                    /* === Când se încheie procesul de arhivare === */
                    output.on('close', function clbkFinalArhivare () {
                        // rre('mesaje', 'Resursa a intrat în conservare!');
                        // rre('delresid', {bytes: archive.pointer()});

                        /* === Șterge din MONGODB și din Elasticsearch === */
                        Resursa.findOneAndDelete({_id: resource.id}, (err, doc) => {       
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
                                /* === ȘTERGE SUBDIRECTOR === */
                                fs.ensureDir(dirPath, 0o2775).then(function clbkFsExists () {
                                    fs.remove(dirPath, function clbkDirFolder (error) {
                                        if (error) {
                                            console.error(error);
                                        }
                                        socket.emit('delresid', true);
                                    });
                                }).catch(err => {
                                    console.log(err);
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
            // console.log("Stringul de interogare din socket.on(person) este următorul: ", queryString);
            
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
            // console.log('Din sockets.js [personrecord] -> id-ul primit este ', id);
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
                // Populează modelul!
                UserModel.populate(user, opts, function clbkExecPopUser (error, res) {
                    if (error) {
                        console.log(error);
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

    return pubComm;
};