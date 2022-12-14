require('dotenv').config();
const logger   = require('./util/logger');
const mongoose = require('mongoose');
// MONGOOSE - Conectare la MongoDB
// mongoose.set('useCreateIndex', true); // Deprecation warning
// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
// mongoose.set('useFindAndModify', false);

try {
    /*
    Am setat o variabilă de mediu `APP_RUNTIME` care va indica dacă aplicația rulează virtualizat sau local.
    Valorile pe care această variabilă de mediu le poate avea sunt: `virtual` sau `local`.
    */


    /* Pentru eroarea `MongoParseError: credentials must be an object with 'username' and 'password' properties` următorul obiect este răspunsul corect: */
    const CONFIG = {
        auth: { username: process.env.MONGO_USER, password: process.env.MONGO_PASSWD},
        authSource: "admin",
        // useNewUrlParser: true,
        // useUnifiedTopology: true
    };
    let hostname = process.env.APP_RUNTIME === 'virtual' ? 'mongo' : 'localhost';

    /* === ACTIVEAZĂ DOAR ÎN SCENARIUL VIRTUALIZAT === */
    if (process.env.APP_RUNTIME === 'virtual') {
        mongoose.connect(`mongodb://${hostname}:27017/${process.env.MONGO_DB}`, CONFIG).then((token) => {
            console.log(`Conectare la serviciul MongoDB din container cu succes:\x1b[32m mongodb://${hostname}:27017/${process.env.MONGO_DB}\x1b[37m`);
            // TODO: Verifică dacă bazele de date sunt create. Dacă nu, instanțiază-le și hidratează-le
        }).catch((error) => {
            throw new Error(`Conectarea la serviciul containerizat MongoDB a eșuat`, error);
        });
    } else {
        mongoose.connect(`mongodb://${hostname}:27017/${process.env.MONGO_DB}`, CONFIG).then(() => {
            console.log(`Conectare cu succes la baza de date mașină gazdă:\x1b[32m mongodb://${hostname}:27017/${process.env.MONGO_DB}\x1b[37m`);
        }).catch((error) => {
            throw new Error(`Conectarea la MongoDB a mașinii gazdă a eșuat!`, error);
        });
    }

    /*
    În cazul în care rulezi cu docker, mai intai avand containerele ruland foloseste `docker ps` și apoi comanda `docker inspect nume_container_mongodb`.
    Vezi secțiunea dedicată `Networks`. Ia de acolo IP-ul pe care rulează containerul de MongoDB. Dar cel mai repede scrii numele serviciului din fișierul
    compose și Docker va atribui în spate IP-ul.
    */ 
    // sau
    //  mongoose.connect("mongodb://nume_user:parola@ip_container_mongo:27017/?authSource=admin")
    module.exports = mongoose;
    
} catch (error) {
    console.log('A apărut o eroare la conectarea cu MongoDB ', error);
    logger.error(error);
}