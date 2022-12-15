require('dotenv').config();
const logger   = require('./util/logger');
const mongoose = require('mongoose');
// MONGOOSE - Conectare la MongoDB
// mongoose.set('useCreateIndex', true); // Deprecation warning
// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
// mongoose.set('useFindAndModify', false);

try {

    console.log(`Versiunea de mongoose rulată este ${mongoose.version}`);

    async function checkAndPopulateDB () {

    }

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
        case 2:
            console.log(`Mă conectez la Mongo chiar acum:\x1b[32m mongodb://${hostname}:27017/${process.env.MONGO_DB}\x1b[37m`);
            break;   
        case 3:
            console.log(`M-am deconectat de la server`);
            break;       
        default:
            break;
    }

    kolectordb.on('connected', function clbkOnConnected () {
        // Extrage informații privind colecțiile existente
        kolectordb.db.listCollections().toArray((error, names) => {
            if (error) {
                throw new Error(`Aceasta este o eroare care a apărut la citirea colecțiilor existente din MongoDB.`);
              } else {
                let elem, dbs = [];
                for (elem of names) {
                    dbs.push({name: elem.name, uuid: elem.info.uuid, readOnly: elem.info.readOnly});
                }
                console.log(`Colecțiile din bază sunt:`);
                console.table(dbs);
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