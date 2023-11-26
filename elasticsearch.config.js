require('dotenv').config();
const fs         = require('fs');
const config     = require('config');
const logger     = require('./util/logger');
const { Client } = require('@elastic/elasticsearch');
const {searchIdxAndCreateIfNotExists} = require('./util/es8-utils');

/**
 * Funcția are rolul de a inițializa un client Elasticsearch
 * Cere ./util/setInRedisESIndexs căruia îi pasează (es8client, redisClient)
 * @param {object} redisClient Este clientul de Redis neinițializat
 * @returns {object} es7client care este clietul inițializat de elasticsearch
 */
async function createEs8Client (redisClient) {
    if (redisClient == null) {
        throw `[elasticsearch.config.js] Clientul Redis nu există. Am primit: ${redisClient}`;
    }
    // console.log(`[elasticsearch.config.js] Răspuns server Redis: ${await redisClient.ping()}`);
    /*
    Rolul acestui modul este de a returna un client pentru Elasticsearch.
    Am setat o variabilă de mediu `APP_RUNTIME` care va indica dacă aplicația rulează virtualizat sau local.
    Valorile pe care această variabilă de mediu le poate avea sunt: `virtual` sau `local`.
    */
    try {
        const CONFIG = {
            // node: `https://es01:9200`,
            node: '',
            auth: {
                username: 'elastic',
                password: 'i43dr54n0w'
            },
            tls: {
            //   ca: fs.readFileSync('./assets/elasticsearch/certs/ca/ca.crt'),
              ca: fs.readFileSync('./assets/elasticsearch/ca/ca.crt'),
              rejectUnauthorized: false
            }
        }
        // configurarea clientului în funcție de modul în care rulează aplicația
        process.env.APP_RUNTIME === 'virtual' ?  CONFIG['node'] = `https://elastic:${process.env.ELASTIC_PASSWORD}@es01:9200` : CONFIG.node = 'http://localhost:9200';
        
        // instanțiere client
        const es8client = new Client(CONFIG);
        //FIXME: Creează niște credențiale folosind API-ul. Este recomandarea producătorului.

        es8client.ping()
            .then(response => console.log("[elasticsearch.config.js] Te-ai conectat la Elasticsearch!"))
            .catch((error) => {
                console.log(error);
                throw new Error(`[elsaticsearch.config] Eroare la ping() pe ES!`, error);
            });

        // Testează dacă există date
        let es8info = await es8client.info();
        let connectionInfo = {
            status_code: es8info?.statusCode || 'N/A',
            version:     es8info?.body?.version?.number || es8info?.version?.number,
            build:       es8info?.body?.build_type || es8info?.version?.build_type,
            host:        es8info?.body?.name || es8info?.name,
            cluster:     es8info?.body?.cluster_name || es8info?.cluster_name,
            cluster_id:  es8info?.body?.cluster_uuid || es8info?.cluster_uuid,
            client_info: es8info?.meta?.request?.params?.headers['user-agent'] || 'N/A',
            request_id:  es8info?.meta?.request?.id || 'N/A',
            connection:  es8info?.meta?.connection?.url || 'N/A',
            status:      es8info?.meta?.connection?.status || 'N/A',
            compatibility: es8info?.version?.minimum_wire_compatibility_version || 'N/A'
        }
        console.table(connectionInfo); // afișează date primare despre cluster

        // Setează indeșii și alias-urile atunci când ești la momentul primei inițializări a aplicației
        let initialDescriptors = config.get('esindexes');

        if (initialDescriptors?.RES_IDX_ALS !== undefined || initialDescriptors?.USR_IDX_ALS !== undefined) {
            indexAndSchemaDescriptorNames = [initialDescriptors?.RES_IDX_ALS, initialDescriptors?.USR_IDX_ALS];        
            for (let descriptor of indexAndSchemaDescriptorNames) {
                let opResult = await searchIdxAndCreateIfNotExists({
                    esClient: es8client, 
                    schema:   descriptor,
                    idx:      descriptor
                });
                // console.log(`[elasticsearch.config.js] Răspuns de la crearea indecșilor`, JSON.stringify(opResult));
            }
        }



        // populare date în Redis cu cele culese din Elasticsearch
        const setInRedisESIndexs = await require('./util/setInRedisESIndexs')(es8client, redisClient);
        // Afișare date în consolă și introducerea reperelor în Redis
        // console.log(`[elasticsearch.config.js] Răspuns de la setInRedisESIndexs: ${JSON.stringify(setInRedisESIndexs)}`);

        if (!setInRedisESIndexs.succeded) {
            throw new Error(`[elasticsearch.config.js] Eroare de setare a indecșilor în Redis. Valoarea obținută este ${JSON.stringify(setInRedisESIndexs)}`);
        }

        return es8client;
    } catch (error) {
        console.log(`[elasticsearch.config.js] A apărut o eroare de conectare la Elasticsearch: ${error}`);
        logger.error(error);
    }
};

module.exports = createEs8Client;