require('dotenv').config();
const logger      = require('./util/logger');
const { Client }  = require('@elastic/elasticsearch');
const setRedis    = require('./util/setInRedisESIndexs');

/*
Am setat o variabilă de mediu `APP_RUNTIME` care va indica dacă aplicația rulează virtualizat sau local.
Valorile pe care această variabilă de mediu le poate avea sunt: `virtual` sau `local`.
*/
const CONFIG = {
    node: '',
    maxRetries:     5,
    requestTimeout: 2000,
    sniffInterval:  500,
    sniffOnStart:   true,
    sniffOnConnectionFault: true,
    log: 'trace'
}
process.env.APP_RUNTIME === 'virtual' ? CONFIG.node = 'http://es01:9200' : CONFIG.node = process.env.ELASTIC_URL;

// instanțiere client
const client = new Client(CONFIG);

// Afișare date în consolă și introducerea reperelor în Redis
client.info().then((r) => {
    console.log("Conectare reușită la Elasticsearch \x1b[32m", r.body.version.number, "\x1b[37m Stare:\x1b[32m", r.meta.connection.status, "\x1b[37m a clusterului:\x1b[32m", r.body.cluster_name, "\x1b[37m");
    setRedis(client); // Funcția are rolul de a seta informație în Redis privind indecșii disponibili în Elastisearch.
}).catch((error) => {
    console.log(`A apărut o eroare de conectare la Elasticsearch`);
    logger.error(error);
});

// client.cluster.health().then(r => console.log(r)).catch(e => console.error);
// client.info().then(r => console.log(r)).catch(e => console.error);
module.exports = client;