require('dotenv').config();
const logger      = require('./util/logger');
const { Client }  = require('@elastic/elasticsearch');
const setRedis    = require('./util/setInRedisESIndexs');

/*
Am setat o variabilă de mediu `APP_RUNTIME` care va indica dacă aplicația rulează virtualizat sau local.
Valorile pe care această variabilă de mediu le poate avea sunt: `virtual` sau `local`.
*/
try {
    const CONFIG = {
        node: '',
        maxRetries:     5,
        requestTimeout: 2000,
        sniffInterval:  500,
        sniffOnStart:   true,
        sniffOnConnectionFault: true,
        log: 'trace'
    }
    process.env.APP_RUNTIME === 'virtual' ?  CONFIG.node = `http://${process.env.DOMAIN_VIRT}/es01:9200` : CONFIG.node = 'http://localhost:9200';
    
    // instanțiere client
    const client = new Client(CONFIG);
    
    // Afișare date în consolă și introducerea reperelor în Redis
    client.info().then((r) => {
        // TODO: Verifică dacă bazele de date există și dacă acestea lipsesc, creează-le
        // #1 Testează dacă există conectare la MongoDB
        setRedis(client); // Funcția are rolul de a seta informație în Redis privind indecșii disponibili în Elastisearch.
    }).catch((error) => {
        return new Error(`La conectarea cu Elasticsearch a apărut eroarea `, error);
    });
    
    // client.cluster.health().then(r => console.log(r)).catch(e => console.error);
    // client.info().then(r => console.log(r)).catch(e => console.error);
    module.exports = client;
} catch (error) {
    console.log(`[elasticsearch.config.js] A apărut o eroare de conectare la Elasticsearch`);
    logger.error(error);
}