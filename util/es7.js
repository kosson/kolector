require('dotenv').config();
const logger = require('./logger');

// const {redisCachedInstance, redisClients} = require('../redis.config');
const redisCachedInstance = require('../redis.config');

/**
 * De fiecare dată când se realizează o conexiune, vezi `elasticsearch.config.js`, sunt setate valorile numelor în Redis.
 * @returns 
 */
async function getStructure () {
    try {
        // console.log(`[util/es7.js] Răspuns server Redis: ${await redisCachedInstance.ping()}`);

        /* INDECȘII PREZENȚI ÎN ElasticSearch 7 */

        /** @type {object}*/
        let ESIDXS = {
            RES_IDX_ES7: 'resursedus0', 
            RES_IDX_ALS: 'resursedus', 
            USR_IDX_ES7: 'users0', 
            USR_IDX_ALS: 'users'
        };

        // console.log(`[util/es7.js] Cheia hash-ului ar trebui să fie: ${process.env.APP_NAME}:es`);
        // let val = await redisCachedInstance.hGetAll(`${process.env.APP_NAME}:es`); // Rezultă un string similar cu: kolector:es
        let val = await redisCachedInstance.hgetall(`${process.env.APP_NAME}:es`); // Rezultă un string similar cu: kolector:es

        let k = Object.keys(val), i;
        for (i = 0; i < k.length; i++) {
            if (val[k[i]]) {
                ESIDXS[k[i]] = val[k[i]];
            }
        };
        // console.log(`[util/es7.js] Obiectul indecșilor este ${JSON.stringify(ESIDXS)}`);
        
        /** @type {object}*/
        return ESIDXS;
    } catch (error) {
        logger.error(error);
        throw new Error(`[util/es7.js] Eroarea este: ${error}`)
    }
};
module.exports = getStructure;