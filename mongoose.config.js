require('dotenv').config();
const config = require("config");
const logger   = require('./util/logger');
const mongoose = require('mongoose');
// MONGOOSE - Conectare la MongoDB
// mongoose.set('useCreateIndex', true); // Deprecation warning
// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
// mongoose.set('useFindAndModify', false);

try {

    console.log(`Versiunea de mongoose rulată este ${mongoose.version}`);

    /* Pentru eroarea `MongoParseError: credentials must be an object with 'username' and 'password' properties` următorul obiect este răspunsul corect: */
    const CONFIG = {
        auth: { username: process.env.MONGO_USER, password: process.env.MONGO_PASSWD},
        authSource: "admin",
        // useNewUrlParser: true,
        // useUnifiedTopology: true
    };
    let hostname = process.env.APP_RUNTIME === 'virtual' ? 'mongo' : 'localhost';
    let address = `mongodb://${hostname}:27017/${process.env.MONGO_DB}`;

    /* === TESTEAZĂ DACĂ AI CONEXIUNE === */
    // mongoose.connect(`mongodb://${hostname}:27017/${process.env.MONGO_DB}`, CONFIG).then(() => {
    //     console.log(`Conectare cu succes la baza de date:\x1b[32m mongodb://${hostname}:27017/${process.env.MONGO_DB}\x1b[37m`);
    // }).catch((error) => {
    //     throw new Error(`Conectarea la MongoDB a mașinii gazdă a eșuat!`, error);
    // });


    // https://mongoosejs.com/docs/connections.html
    // https://mongoosejs.com/docs/api/mongoose.html#mongoose_Mongoose-createConnection
    let kolectordb = mongoose.createConnection(address, CONFIG);
    // https://mongoosejs.com/docs/api.html#connection_Connection-readyState
    switch (kolectordb.readyState) {
        case 0:
            console.log(`Nu se conectează la baza de date. Verifică să existe serverul.`);
            break;
        case 1:
            console.log(`Conectare cu succes la baza de date:\x1b[32m mongodb://${hostname}:27017/${process.env.MONGO_DB}\x1b[37m`);
            break;
        case 3:
            console.log(`M-am deconectat de la server`);
            break;       
        default:
            break;
    }
    console.log(`Numărul conexiunilor la MongoDB este \x1b[32m ${mongoose.connections.length}\x1b[37m`);

    kolectordb.on('connected', function clbkOnConnected () {
        // Extrage informații privind colecțiile existente
        kolectordb.db.listCollections().toArray(async (error, names) => {
            if (error) {
                throw new Error(`[mongoose.config.js] Aceasta este o eroare care a apărut la citirea colecțiilor existente din MongoDB.`);
            } else if (names.length >= 1) {
                let elem, dbs = [];
                for (elem of names) {
                    dbs.push({name: elem.name, uuid: elem.info.uuid, readOnly: elem.info.readOnly});
                }
                console.log(`Colecțiile din bază sunt:`);
                console.table(dbs);
            } else {

                let initcollections = config.get('initcollections'); // obține array-ul colecțiilor care trebuie create din fișierul de configurare `default`
            
                // Incarca modelele pentru cele de baza
                let ThingSchema = require('./models/thing'); // adu schema pentru Thing
                let Competente = require('./models/competenta-specifica'), 
                    Thing = mongoose.model('thing', ThingSchema),
                    Mgmtgeneral = require('./models/MANAGEMENT/general') ; // creează modelele necesare

                let collection;
                for (collection of initcollections) {
                    switch (collection) {
                        case 'mgmtgenerals':
                            // console.log(kolectordb.collection(`mgmtgenerals`));
                            let mgmtgeneralsdata = require('./initdata/databases/mgmtgenerals.json');
                            // https://www.tabnine.com/code/javascript/functions/mongoose/Model/insertMany
                            let datemgmtimportate = await Mgmtgeneral.insertMany(mgmtgeneralsdata.map(function clbkMapMgmtData (elem) {
                                return {
                                    _id: mongoose.Types.ObjectId(elem._id.$oid), // aici era eroarea. trebuia transformat din `{ '$oid': '616fd846d40ca748011c12b4' }` în `ObjectId`
                                    focus:       elem.focus,
                                    template:    elem.template,
                                    _v:          elem.__v,
                                    brand:       elem.brand,
                                    publisher:   elem.publisher,
                                    creator:     elem.creator,
                                    description: elem.description,
                                    contact:     elem.contact
                                };
                            })); 
                            console.log(`Am importat în colecția mgmtgenerals ${datemgmtimportate.length} înregistrări.`);
                            break;
                        case 'competentaspecificas':
                            let competentaspecificas = require('./initdata/databases/competentaspecificas.json');
                            let datecompetenteimportate = await Competente.insertMany(competentaspecificas.map(function clbkMapCompeData (elem) {
                                return {
                                    _id: mongoose.Types.ObjectId(elem._id.$oid),
                                    idRED:      elem.idRED,
                                    ids:        elem.ids,
                                    activitati: elem.activitati,
                                    disciplina: elem.disciplina,
                                    nivel:      elem.nivel,
                                    ref:        elem.ref,
                                    REDuri:     elem.REDuri,
                                    nume:       elem.nume,
                                    cod:        elem.cod,
                                    coddisc:    elem.coddisc,
                                    parteA:     elem.parteA,
                                    _v:         elem.__v
                                };
                            }));
                            console.log(`Am importat în colecția competentaspecificas ${datecompetenteimportate.length} înregistrări.`);
                            break;            
                        case 'things':
                            let things = require('./initdata/databases/things.json');
                            let datethingsimportate = await Thing.insertMany(things.map(function clbkMapThingsData (elem) {
                                return {
                                    _id: mongoose.Types.ObjectId(elem._id.$oid),
                                    res:  elem.res,
                                    arca: elem.arca.map(function clbkArcaInThing (elem) {
                                        if (elem.$oid) {
                                            return mongoose.Types.ObjectId(elem.$oid);
                                        } else {
                                            return elem;
                                        } 
                                    }),
                                    nota: elem.nota
                                }
                            }));
                            console.log(`Am importat în colecția things ${datethingsimportate.length} înregistrări.`);
                            break;                                             
                        default:
                            break;
                    }
                }
            }
        });
    });

    /*
    În cazul în care rulezi cu docker, mai intai avand containerele ruland foloseste `docker ps` și apoi comanda `docker inspect nume_container_mongodb`.
    Vezi secțiunea dedicată `Networks`. Ia de acolo IP-ul pe care rulează containerul de MongoDB. Dar cel mai repede scrii numele serviciului din fișierul
    compose și Docker va atribui în spate IP-ul.
    */ 
    // sau
    //  mongoose.connect("mongodb://nume_user:parola@ip_container_mongo:27017/?authSource=admin")
    // module.exports = mongoose;
    module.exports = {kolectordbconfig: CONFIG, kolectordbaddress: address};
    
} catch (error) {
    console.log('A apărut o eroare la conectarea cu MongoDB ', error);
    logger.error(error);
}