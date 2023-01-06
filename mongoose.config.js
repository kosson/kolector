require('dotenv').config();
const config = require("config");
const logger   = require('./util/logger');

/**
 * Funcția joacă rol de inițiator al conexiunii cu baza de date.
 * În cazul în care este prima inițializare, vor fi create și colecțiile care vor fi populate cu date
 * Este apelată din `app.js`
 * @param {Object} mongoose 
 * @returns {Function}
 */
function dbconnection (mongoose) {
    return function mongoosedbconnectorguest ({getinfo}) {
        try {

            console.log(`Versiunea de mongoose rulată este ${mongoose.version}`);
        
            /* Pentru eroarea `MongoParseError: credentials must be an object with 'username' and 'password' properties` următorul obiect este răspunsul corect: */
            const CONFIG = {
                auth: { username: process.env.MONGO_USER, password: process.env.MONGO_PASSWD},
                authSource: "admin"
                // useNewUrlParser: true,
                // useUnifiedTopology: true
            };
            let hostname = process.env.APP_RUNTIME === 'virtual' ? 'mongo' : 'localhost';
            let address = `mongodb://${hostname}:27017/${process.env.MONGO_DB}`;

            // https://mongoosejs.com/docs/connections.html
            // https://mongoosejs.com/docs/api/mongoose.html#mongoose_Mongoose-createConnection
            // let dbconnection = mongoose.createConnection(address, CONFIG);

            // console.log(`adresa folosită este ${address} iar CONFIG este ${JSON.stringify(CONFIG)}`)
            mongoose.connect(address, CONFIG); // conectarea la bază
        
            mongoose.connection.on('error', (err) => {
                logger.error(error);
                throw new Error(`[mongoose.congfig.js] Nu mă pot conecta: ${err}`);
            });

            // doar dacă există vreo solicitare pentru afișarea în consolă a informațiilor de conectare, acesea vor fi oferite
            if (getinfo) {
                console.log(`Numărul conexiunilor la MongoDB este \x1b[32m ${mongoose.connections.length}\x1b[37m`);
                switch (mongoose.connection.readyState) {
                    case 0:
                        console.log(`Nu se conectează la baza de date. Verifică să existe serverul.`);
                        break;
                    case 2:
                        console.log(`Mă conectez la Mongo chiar acum:\x1b[32m mongodb://${hostname}:27017/${process.env.MONGO_DB}\x1b[37m`);
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
            }

            mongoose.connection.on('connected', async function clbkOnConnected () {
                // Extrage informații privind colecțiile existente
                let databases = await mongoose.connection.db.listCollections().toArray();
                if (databases.length >= 1 && getinfo) {
                    let elem, dbs = [];
                    for (elem of databases) {
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
                        Mgmtgeneral = require('./models/MANAGEMENT/general')  // creează modelele necesare
                        User = require('./models/user');
            
                    let collection;
                    for (collection of initcollections) {
                        switch (collection) {
                            case 'users':
                                let {generatePassword} = require('./routes/utils/password');
                                let {hash, salt} = generatePassword(config.get('adminpassword'));
                                let user = new User({
                                    _id: mongoose.Types.ObjectId(),
                                    roles: {admin: true, unit: ['global']},
                                    name: config.get("adminname"),
                                    email: config.get('adminemail'),
                                    created: new Date(Date.now()).toISOString(),
                                    hash,
                                    salt
                                });
                                let result = await user.save();
                                // console.log(`Am creat primul utilizator cu următoarele detalii ${JSON.stringify(result)}`);
                                break;
                            case 'mgmtgenerals':
                                // console.log(db.collection(`mgmtgenerals`));
                                let mgmtgeneralsdata = require('./initdata/databases/mgmtgenerals.json');
                                let mgmtarr = mgmtgeneralsdata.map(function clbkMapMgmtData (elem) {
                                    return {
                                        _id:         elem?._id?.['$oid'] ? mongoose.Types.ObjectId(elem?._id?.['$oid']) : new mongoose.Types.ObjectId(), // aici era eroarea. trebuia transformat din `{ '$oid': '616fd846d40ca748011c12b4' }` în `ObjectId`
                                        focus:       elem.focus,
                                        template:    elem.template,
                                        _v:          elem.__v,
                                        brand:       elem.brand,
                                        publisher:   elem.publisher,
                                        creator:     elem.creator,
                                        description: elem.description,
                                        contact:     elem.contact
                                    };
                                });
                                let datemgmtimportate = await Mgmtgeneral.insertMany(mgmtarr); 
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
                                let docsarr = things.map(function clbkMapThingsData (elem) {
                                    return {
                                        _id:  elem?._id?.['$oid'] ? mongoose.Types.ObjectId(elem?._id?.['$oid']) : new mongoose.Types.ObjectId(),
                                        res:  elem.res,
                                        arca:  elem?.arca !==  undefined ? elem.arca.map(function clbkArcaInThing (ref) {
                                            if (ref.$oid) {
                                                return mongoose.Types.ObjectId(ref.$oid);
                                            } else {
                                                return ref;
                                            } 
                                        }) : [],
                                        nota: elem.nota,
                                        cid: elem?.cid !== undefined ? elem.cid.map(function clbkCIDinThing (cid) {
                                            if (cid.$oid) {
                                                return mongoose.Types.ObjectId(cid.$oid);
                                            } else {
                                                return cid;
                                            } 
                                        }) : []
                                    };
                                });
                                let datethingsimportate = await Thing.insertMany(docsarr);
                                console.log(`Am importat în colecția things ${datethingsimportate.length} înregistrări.`);
                                break;                                             
                            default:
                                break;
                        }
                    }
                }
            });
        
            // mongoose.connection.on('open', async function clbkOnOpen () {});        
        
            mongoose.connection.on('error', function clbkOnError (error) {
                console.error(`[mongoose.config.js] Eroarea apărută este `, error);
            });

            return mongoose.connection;
        } catch (error) {
            logger.error(`A apărut o eroare la conectarea cu MongoDB ${error}`);
            console.log('A apărut o eroare la conectarea cu MongoDB ', error);
        }
    }
}

module.exports = dbconnection;