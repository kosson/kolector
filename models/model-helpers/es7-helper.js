require('dotenv').config();
const esClient     = require('../../elasticsearch.config');
const mongoose     = require('../../mongoose.config');
const Resursa      = require('../resursa-red');
const User         = require('../user');
const logger       = require('../../util/logger');
const setRedis     = require('../../util/setInRedisESIndexs');
// https://nesin.io/blog/fix-mongoose-cannot-overwrite-model-once-compiled-error
// https://mongoosejs.com/docs/5.x/docs/faq.html#overwrite-model-error

    // io.on('connect', socket => {
    //     console.log("Id-ul conectat este: ", socket.id);
    //     console.log(socket.handshake);
    //     // console.log(socket.handshake.query._csrf);
    //     socket.on('testconn', function cbMesaje (mesaj) {
    //         const detaliiConn = pubComm.server.eio.clients[socket.id]; // obține detaliile de conexiune individuale
    //         console.log('Serverul a primit următorul mesaj: ', mesaj, detaliiConn.upgraded);
    //     });
    // });


// const CompetentaS  = require('../competenta-specifica');
// const ES7schemaRED = require('../resursa-red-es7');
const editorJs2TXT = require('../../routes/controllers/editorJs2TXT'); 
// mapping-urile indecșilor
const resursaRedES7 = require('../resursa-red-es7'); // '-es7' indică faptul că sunt setările și mappingul noului index
const userES7       = require('../user-es7');
// utilități pentru Elasticsearch
// let {getStructure}  = require('../../util/es7'); // `getStructure()` este o promisiune a cărui rezultat sunt setările indecșilor și ale alias-urilor (vezi `elasticsearch.config.js`, unde sunt setați)

if (Resursa instanceof mongoose.Model) {
    console.log(`Resursa este un obiect de tip Model`);
}

if (User instanceof mongoose.Model) {
    console.log(`User este un obiect de tip Model`);
}


/*
Această structură are scopul de a oferi informație pentru fiecare index ES7
Cheile obiectului sunt numele de alias. Valoarea este un hash care pune în conexiune mappingul indexului ES7 cu modelul mongoose în baza căruia s-a creat colecția
Structura a fost creată pentru a adresa necesitatea de căutare dinamică în funcție de alias-ul comunicat din browserul clientului.
Această structură evită crearea de hardcodări în funcțiile cu rol de helper în lucrul cu ES7. Este un registru util.
*/
const col2idx = {
    users:      {mapping: userES7, mongModel: User},
    resursedus: {mapping: resursaRedES7, mongModel: Resursa}
}
// contorul pentru ținerea evidenței documentelor care au fost deja procesate.
var procesate = 0;


// stabilirea denumirii indexului zero pentru resurse și a alias-ului.
let primeREDidx   = process.env.MONGO_REDS + '0';
let primeREDidxAl = process.env.MONGO_REDS;

/**
 * Funcția are rolul de a verifica dacă indexul și aliasul indexului există.
 * Dacă indexul nu există și în consecință alias-ul, vor fi create și va fi indexat primul document.
 * În cazul în care indexul există, va fi indexat documentul dacă acesta nu există deja în index.
 * ATENȚIE!! Este rolul apelantului să paseze valori pentru `idx`, cât și pentru `aliasidx`.
 * @param {Object} schema Este schema ES7 în baza căreia creezi index nou în Elasticsearch, dacă acest lucru este necesar!!!
 * @param {Object} data Este un obiect care mapează documentul Mongoose și constituie un POJO nou remodelat, dacă e nevoie
 * @param {String} idx Este un string din Redis cu numele indexului ES pentru care s-a constituit alias-ul
 * @param {String} aliasidx Este un string din .env cu numele indexului alias la care trebuie indexată înregistrarea
 */
exports.searchIdxAndCreateDoc = async function searchIdxAndCreateDoc (schema, data, idx, aliasidx) {
    // https://stackoverflow.com/questions/44395313/node-mongoose-how-to-get-a-full-list-of-schemas-documents-and-subdocuments
    // console.log('[es7-helper.js::searchIdxAlCreateDoc()] `schema.paths` are valorile: ', schema);
    // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
    // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/exists_examples.html (verifică dacă un anumit document există)

    try {
        // #1 Testează dacă există index și alias-ul său. https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_indices_exists
        let idxE = await esClient.indices.exists(
            {index: idx}, 
            {errorTrace: true}
        );
        let idxAlE = await esClient.indices.existsAlias({name: aliasidx, index: idx});

        // #2 dacă indexul există și are alias creat, creează documentului în index
        if (idxE.statusCode === 200 && idxAlE.statusCode === 200) {
            // console.log('[es7-helper.js::searchIdxAlCreateDoc] Indexul pasat există și are și alias.');

            // INDEXEAZĂ DOCUMENT!!!
            await esClient.create({
                id:      data.id,
                index:   idx,
                refresh: true,
                body:    data
            });
        // #3 Indexul și alias-ul său nu există (te afli la prima înregistrare în bază)
        } else if (idxE.statusCode === 404) {
            // console.log("[es7-helper.js::searchIdxAlCreateDoc] Indexul și alias-ul nu există. Le creez acum!");
            // creează indexul și aliasul. 
            await esClient.indices.create({
                index: idx,
                body:  schema
            },{errorTrace: true});

            // creează alias la index
            await esClient.indices.putAlias({
                index: idx,
                name:  aliasidx
            },{errorTrace: true});
            
            // INDEXEAZĂ DOCUMENT!!!
            await esClient.create({
                id:      data.id,
                index:   aliasidx,
                refresh: true,
                body:    data
            });

            // Scrie hset-ul în REDIS cu umele indecșilor din Elasticsearch [doar în cazul în care nu existau]
            esClient.info().then((r) => {
                setRedis(esClient); // Funcția are rolul de a seta informație în Redis privind indecșii disponibili în Elastisearch.
            }).catch((error) => {
                console.log(`În timp ce actualizam Redisul, a apărut o eroare de conectare la Elasticsearch`);
                logger.error(error);
            });      
        }        
    } catch (error) {
        console.error(JSON.stringify(error.body, null, 2));
        logger.error(error);
    };
};

/**
 * Funcția are rolul de a căuta o înregistrare după id într-un index Elasticsearch care este precizat
 * @param {String} id Id-ul resursei
 * @param {String} idx Numele indexului din Elasticsearch
 * @returns 
 */
exports.recExists = async function recExists (id, idx) {
    try {
        const {body} = await esClient.exists({
            index: idx,
            id: id
        });
        return body;
    } catch (error) {
        console.error(JSON.stringify(error.body, null, 2));
        logger.error(error);
    }
};

/**
 * Funcția are rolul de a șterge indexul precizat prin string ca argument.
 * @param {Object} data Numele indexului și a alias-ului care trebuie șterse `{idx: "nume", alsr: "numeals"}`
 * @returns 
 */
exports.deleteIndex = function deleteIndex (data, socket) {
    console.log('[es7-helper.js::deleteIndex] Datele primite sunt: ', data);
    // dacă există și alias pentru index, șterge alias-ul și indexul
    if (data.alsr) {
        delAlias(data).then((r) => {
            // console.log(`[es7-helper::delAlias] Rezultatul ștergerii alias-ului dupa returnare`, r);
            if (r === 200 || r === 404) {
                delIdx(data.idx); // șterge indexul
            }
        }).catch((error) => {
            if (error) {
                logger.error(error);
            }
        });
    } else if (data.idx) {
        delIdx(data.idx); // șterge indexul
        socket.emit(`es7delidx`, {als: false, idx: data.idx, msg: `Am șters indexul totuși.`});
    };
};

/**
 * Funcția are rol de helper pentru `deleteIndex()`
 * Sterge un index
 * @param {Object} data Numele indexului și a alias-ului care trebuie șterse `{idx: "nume", alsr: "numeals"}`
 * @returns 
 */
function delIdx (idx) {
    esClient.indices.delete({
        index: idx
    }).then((body) => {
        if (body.error) {            
            // console.log('\x1b[33m' + 'Nu am reușit să șterg indexul' + '\x1b[37m');
            // console.log(JSON.stringify(body.error, null, 4));
            throw error;
        }
    }).catch((err) => {
        logger.error(err);
    });
}

/**
 * Funcția are rol de helper pentru `deleteIndex()`
 * Sterge un alias
 * @param {Object} data Numele indexului și a alias-ului care trebuie șterse `{idx: "nume", alsr: "numeals"}`
 * @returns 
 */
function delAlias (data) {
    return esClient.indices.deleteAlias({
        index: data.idx,
        name: data.alsr
    }).then((body) => {
        // console.log(`[es7-helper::delAlias] Rezultatul ștergerii alias-ului`, body);
        return body.statusCode;
    }).catch((err) => {
        if (err.meta.statusCode === 404) {
            // console.error(`[es7-helper::delAlias] Alias-ul nu exista. Stare: `, err.meta.statusCode);
            return err.meta.statusCode;
        }
        logger.error(err);
    });
}

/**
 *Funcția are rolul de a șterge un index primit ca valoare și aliasul său urmat de crearea unui index și a alias-ului său
 *Opțional, poți schimba denumirea indexului nou
 * @param {Object} schema Este schema ES7 în baza căreia creezi index nou
 * @param {String} oldIdx Numele indexului vechi
 * @param {Number|''} vs  Versiunea indexului vechi (acoperă cazul denumirilor necanonice în care numele indexului este cel al alias-ului)
 * @param {String} newIdx Numele noului index, în cazul în care dorești și o schimbare de nume 
 * @returns {Boolean} true dacă s-a făcut index nou și s-au reindexat datele pe acesta
 */
exports.delAndCreateNew = async function delAndReindex (schema, oldIdx, vs = '', newIdx) {
    // în cazul în care nu ai valoare pentru `vs`, asigură-te că este un empty string
    let idx = oldIdx + vs,
        nvs,
        alsr,
        ndx;

    // VERIFICĂ DACĂ `oldIdx` are numarul de versiune atașat [CANONIC VERSION!] și creează numărul nou de versiune
    if ((/(\d{1,})+/g).test(oldIdx)) {
        // taie fragmentul de nume până la cifra care indica versiunea
        // console.log("[es7helper.js::delAndReindex()] Pot taia", d.slice(0, d.search(/(\d{1,})+/g)));
        alsr = oldIdx.slice(0, oldIdx.search(/(\d{1,})+/g));        // extrage numele alias-ului pentru index
        let nr = Number(oldIdx.slice(oldIdx.search(/(\d{1,})+/g))); // extrage versiunea și transformă în număr
        if (nr !== NaN) {
            nvs = ++nr;  // dacă ai obținut numărul de versiune, incrementează-l
        } else {
            nvs = 0;    // dacă ceea ce ai obținut este un `NaN`, te afli în cazul în care nu ai nr de versiune la index [NECANONIC]
        }
    }

    try {
        // verifică dacă `idx` există deja
        let idxE = await esClient.indices.exists(
            {index: idx}, 
            {errorTrace: true}
        );
        let idxAlE = await esClient.indices.existsAlias({name: alsr, index: idx});
        // dacă `idx` există, șterge-l!!
        if (idxE.statusCode === 200) {
            // în cazul în care se dorește modificare denumirii noului index, folosim parametrul special
            if (newIdx) {
                ndx = `${newIdx}${nvs}`;
                alsr = `${newIdx}`;
            }
            ndx = `${alsr}${nvs}`;   // constituie numele indexului nou din numele celui vechi

            /* === REINDEXARE ==== */
            // #1 creează noul index
            await esClient.indices.create({
                index: ndx,
                body:  schema
            },{errorTrace: true});

            // #2 creează alias nou-nouț la index, dacă nu există deja unul
            // fii foaste atent pentru că de ai ales modificarea numelui, nu mai ai alias la care să faci legătura indexului nou creat.
            await esClient.indices.putAlias({
                index: ndx,
                name:  alsr
            },{errorTrace: true});

            // #3 reindexare (mută datele din indexul vechi) -->https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/reindex_examples.html
            await esClient.reindex({
                waitForCompletion: true,
                refresh: true,
                source: {
                    index: oldIdx
                },
                destination: {
                    index: ndx
                }
            });

            // #4 verifică dacă noul index există ți șterge-l pe cel vechi
            // verifică dacă indexul nou există
            let idxN = await esClient.indices.exists(
                {index: ndx}, 
                {errorTrace: true}
            );
            if (idxN.statusCode === 200) {
                deleteIndex(oldIdx);
                return true;
            }
        }
        //- TODO: Reindexarea datelor în nou index
    } catch (error) {
        // console.error(JSON.stringify(error.body, null, 2));
        logger.error(error);
        next(error);
    }
}

/**
 * Funcția are rolul de a face o reindexare cu date existente în indexul vechi.
 * Numărul versiunii va fi incrementat ori de câte ori este apelată.
 * Reindexarea se va face ori de câte ori este modificat mapping-ul (vezi variabila `resursaRedES7`).
 * Datele primite vin de la funcția `idxactions` din `admin.mjs`.
 * @param {Object} data Numele aliasului și numărul versiunii la care este indexul
 * @param {Object} socket Este obiectul socket necasar comunicării
 */
exports.reidxincr = async function reidxincr (data, socket) {
    // data { vs: '0', alsr: 'resursedus' }

    let pscript =  '';
    // În funcție de modificarea mapping-ului trebuie adaptat scriptul painless care să opereze modificările de structură (vezi variabila `pscript`).
    
    // console.log("[es7-helper.js::reidxincr] Am primit in `reidxincr` datele", data);

    let idx = data.alsr + data.vs,
        nvs = ''; // noua versiune

    // Verifică mai întâi dacă ai mapping pentru colecția respectivă. Dacă cu ai mapping, trimite înapoi mesaj că acesta nu există și nu se va face indexarea
    if (data.alsr in col2idx) {
        // console.log("[es7-helper.js::reidxincr] Am mapping-ul ", col2idx[data.alsr]);
        // Verifică existența alias-ului (alias-ul nu este purtător de versiune)

        let alsrExist = await esClient.indices.existsAlias({name: data.alsr});
        let whatIdx = await esClient.cat.aliases({
            name: data.alsr,
            format: "json"     
        });// verifică cărui index aparține alias-ul.

        // ALIAS-ul există, procedează la reindexare
        if (alsrExist.statusCode == 200) {
            // dacă este un alias care se termină cu un număr, atunci înseamnă că e un install vechi. Șterge MANUAL indexul, sterge alias-ul. Reindexează de la 0.
            // https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-aliases.html#indices-aliases-api-rename-alias-ex
            /*
                #1 Adaugă un index nou 
                #2 reindexează înregistrările pe noul index 
                    - https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_reindex
                    - https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/reindex_examples.html
                #3 Leagă indexul nou de alias-ul existent
                #4 Șterge indexul vechi
            */

            // în cazul în care indexul primit este egal cu cel verificat pentru alias creează noul index
            if (idx === whatIdx.body[0].index) {
        
                // incrementează versiunea
                let nrvs = parseInt(data.vs);
                let newvs = ++nrvs;
                nvs = data.alsr + newvs; // `nvs` e prescurtare de la `new version`

                // CREEAZĂ INDEXUL nou pasând la index, numele noului index, iar la body, mapping-ul indexului. Ori de câte ori modiffice mappingul, reindexezi
                /* col2idx:
                    {
                        users:      {mapping: userES7, mongModel: User},
                        resursedus: {mapping: resursaRedES7, mongModel: Resursa}
                    }
                */
                // let createdIndex = await esClient.indices.create({
                await esClient.indices.create({
                    index: nvs,
                    body:  col2idx[data.alsr].mapping
                });
                // console.log("[es7-helper.js::reidxincr] Indexul nou creat este ", createdIndex);

                // REINDEXEAZĂ
                let body4reindex = {
                    source: {
                        index: idx
                    },
                    dest: {
                        index: nvs
                    }
                    // ,
                    // script: {
                    //     lang: 'painless',
                    //     source: pscript
                    // }
                };
                await esClient.reindex({
                    waitForCompletion: true,
                    refresh: true,
                    body: body4reindex
                });

                // ATAȘEZ alias-ul noului index creat
                // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_indices_putalias
                let newAlsr = await esClient.indices.putAlias({
                    index: nvs,
                    name:  data.alsr
                });

                if (newAlsr.statusCode === 200) {
                    let stats4new = await esClient.indices.stats();
                    console.log("[es7-helper::reidxincr()] stats are ", stats4new);
                }

                // ȘTERGE indexul vechi
                esClient.indices.delete({
                    index: idx
                }, (error, r) => {
                    if (error) {
                        logger.error(error);
                        console.log("[es7-helper::reidxincr()] Când să șterg indicele, am avut o eroare");
                    };

                    // _FIXME: Actualizează datele din Redis!!!
                    setRedis(esClient);

                    // Trimite datele noului index
                    socket.emit('es7reidx', {newidx: nvs, oldidx: idx, deleted: r.body.acknowledged}); // trimit clientului datele
                });
            }
        }

        socket.emit('es7reidx', 'Nu există aliasul vechi ', alsrExist.statusCode);


    } else {
        // dacă nu ai alias, ȘTERGE indexul vechi și creează index și alias de la 0. Acesta va fi cazul indexurilor create prost anterior. Va fi rar folosit
        esClient.indices.delete({
            index: idx
        }, (error, r) => {
            if (error) {
                logger.error(error);
                console.log("[es7-helper::reidxincr()] Când să șterg indicele, am avut o eroare");
            };
            // creează de la 0
            createIdxAls({idx, als: data.alsr, mpg: col2idx[data.alsr].mapping});
        });
        
    }




    // Pentru că nu există un fișier de mapping pentru respectiva colecție
    socket.emit('es7reidx', {mapping: false}); // trimit clientului datele
};

/**
 * Funcția creează de la 0 un index ES7 pentru o colecție MongoDB.
 * Funcția are rol de handler pentru tratarea datelor pe evenimentul `mgdb2es7` din socket.js
 *  
 * @param {Object} es7 Obiect cu datele necesare creării unui nou index
 * @param {Object} socket 
 */
exports.mgdb2es7 = function mgdb2es7 (es7, socket) {

    // Verifică mai întâi dacă ai mapping pentru colecția respectivă. Dacă nu ai mapping, trimite înapoi mesaj că acesta nu există și nu se va face indexarea
    if (es7.alsr in col2idx) {
        // console.log("[es7-helper::mgdbes7] Mappingul pentru viitorul index este: ", col2idx[es7.alsr].mapping);

        if (col2idx[es7.alsr].mapping) {

            esClient.indices.create({
                index: es7.idx,
                body: col2idx[es7.alsr].mapping
            }).then(async (r) => {
                // console.log("[es7-helper::esClient.indices.create] Rezultatul creării indicelui", r);
        
                // Creează alias-ul
                if (r.statusCode == 200) {
    
                    indexMongoColInES7(es7.alsr, es7.idx);

                    // esClient.indices.putAlias({
                    //     index: es7.idx,
                    //     name:  es7.alsr
                    // }).then((r) => {
                    //     // console.log("[es7-helper] Rezultatul creării alias-ului", r);
                        
                    //     // INDEXEAZĂ CONȚINUTUL UNEI COLECȚII
                    //     indexMongoColInES7(es7.alsr, es7.idx);
                    // }).catch((e) => {
                    //     console.error("Nu s-a putut face indexarea", e);
                    // });
                }
                
            }).catch(e => {
                socket.emit('mgdb2es7', {error: e.meta.body.error.reason}); // trimit clientului datele
                console.error(e, `M-am oprit la ${procesate} documente`);
            });
        }
        socket.emit('mgdb2es7', {mapping: false});
    }
    // Pentru că nu există un fișier de mapping pentru respectiva colecție
    socket.emit('mgdb2es7', {mapping: false}); // trimit clientului datele
}

/**
 *Funcția creează index, alias-ul acestuia în baza unui mapping existent
 *
 * @param {Object} data
 */
function createIdxAls (data) {
    // console.log("Indexul nu există și pornesc la crearea de la 0 cu următoarele date:", data);
    /* {
            idx: "nume_index",
            als: "nume_alias",
            mpg: "nume_mapping",
            data: {}
        }
    */
    
    // CREEAZĂ INDEXUL nou pasând la index, numele noului index, iar la body, mapping-ul indexului. Ori de câte ori modiffice mappingul, reindexezi
    esClient.indices.create({
        index: data.idx,
        body:  data.mpg
    }).then(async (r) => {
        // ATAȘEZ alias-ul noului index creat
        let result = await esClient.indices.putAlias({
            index: data.idx,
            name:  data.als
        });
        // console.log("[es7-helper::createIdxAls()] Aliasul creat cu următorul rezultat ", result);
    }).catch((err) => {
        if (err) {
            console.log("[es7-helper::createIdxAls()] Am eșuat crearea noului index de la 0 cu următoarele detalii: ", err)
            logger.error(err);
        };
    });
}

/**
 * Această funcție face indexarea documentelor dintr-o colecție MongoDB în ElasticSearch7
 * @param {String} col Este identificatorul colecției din MongoDB care trebuie indexată în ElasticSearch
 * @param {String} idx Este indexul ES7 în care ajung datele
 */
function indexMongoColInES7 (col, idx) {
    console.log("[es-helper::indexMongoColInES7] Am primit la `col`:", col, 'iar indexul este', idx);
    let procesate = 0;
    try {
        // verifică mai întâi să ai colecția în registrul `col2idx`
        if (col in col2idx) {

            let model = col2idx[col]['mongModel'];
            // cazurile speciale vor fi gestionate folosind un switch
            switch (col) {
                case 'resursedus':
                    const Resursa     = require('../resursa-red');
                    // let cursorResedus = model.find({}).populate('competenteS').cursor(); //produce circular dependency NOTE: DE CE? Debug cânt ai timp
                    let cursorResedus = Resursa.find({}).populate('competenteS').cursor();

                    cursorResedus.eachAsync(async (doc) => {
                        let obi = Object.assign({}, doc._doc);
                        // verifică dacă există conținut
                        var content2txt = '';
                        if ('content' in obi) {
                            content2txt = editorJs2TXT(obi.content.blocks); // transformă obiectul în text
                        }
                        // indexează documentul
                        const data = {
                            id:               obi._id,
                            date:             obi.date,
                            idContributor:    obi.idContributor,
                            emailContrib:     obi.emailContrib,
                            uuid:             obi.uuid,
                            autori:           obi.autori,
                            langRED:          obi.langRED,
                            title:            obi.title,
                            titleI18n:        obi.titleI18n,
                            arieCurriculara:  obi.arieCurriculara,
                            level:            obi.level,
                            discipline:       obi.discipline,
                            disciplinePropuse:obi.disciplinePropuse,
                            competenteGen:    obi.competenteGen,
                            rol:              obi.rol,
                            abilitati:        obi.abilitati,
                            materiale:        obi.materiale,
                            grupuri:          obi.grupuri,
                            domeniu:          obi.demersuri,
                            spatii:           obi.spatii,
                            invatarea:        obi.invatarea,
                            description:      obi.description,
                            dependinte:       obi.dependinte,
                            coperta:          obi.coperta,
                            content:          content2txt,
                            bibliografie:     obi.bibliografie,
                            contorAcces:      obi.contorAcces,
                            generalPublic:    obi.generalPublic,
                            contorDescarcare: obi.contorDescarcare,
                            etichete:         obi.etichete,
                            utilMie:          obi.utilMie,
                            expertCheck:      obi.expertCheck,
                            rating:           obi.rating
                        };
                        await esClient.create({
                            id:      data.id,
                            index:   idx,
                            refresh: true,
                            body:    data
                        });
                        // Ține contul documentelor procesate
                        ++procesate;                    
                    });
                    
                    console.log(`Am procesat un număr de ${procesate} documente.`);
                    break;

                case 'users':
                    let cursorUsers = model.find({}).cursor();
                    cursorUsers.eachAsync(async (doc) => {
                        let obi = Object.assign({}, doc._doc);
                        // indexează documentul
                        const data = {
                            id:       obi._id,
                            created:  obi.created,
                            email:    obi.email,
                            roles:    obi.roles,
                            ecusoane: obi.ecusoane,
                            googleID: obi.googleID,
                            googleProfile: obi.googleProfile
                        };
                        await esClient.create({
                            id:      data.id,
                            index:   idx,
                            refresh: true,
                            body:    data
                        });
                        // Ține contul documentelor procesate
                        ++procesate;
                    });
                    console.log(`[es-helper::indexMongoColInES7] Am procesat un număr de ${procesate} documente.`);
                    break;
            }
            setRedis(esClient); // actualizează datele din Redis după ce s-a făcut indexarea unei colecții MongoDB
        }
        // cazul în care se cere indexarea unei colecții pentru care nu există cod.
        console.log(`[es-helper::indexMongoColInES7] Colecția pentru care se cere îndexare, încă nu are suport în cod`);
    } catch (error) {
        console.log("[es-helper::indexMongoColInES7] Eroare:", error);
        logger.error(error);
    }
}