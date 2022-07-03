require('dotenv').config();
// const esClient     = require('../elasticsearch.config');
const logger = require('./logger');
const { promisify } = require("util");
const redisClient  = require('../redis.config');

// promisifcare metodă `hgetall`
const hgetallAsync = promisify(redisClient.hgetall).bind(redisClient);

/* INDECȘII ES7 */
var ESIDXS = {
    RES_IDX_ES7: '', 
    RES_IDX_ALS: '', 
    USR_IDX_ES7: '', 
    USR_IDX_ALS: ''
};

/*
De fiecare dată când se realizează o conexiune, vezi `elasticsearch.config.js`, sunt setate valorile numelor în Redis.
În cazul în care ne aflăm chiar la instalarea aplicației, aceste valori n-au de unde să fie setate. Inițial sunt luate de aici
*/
exports.getStructure = async function getStructure () {
    try {
        // let val = await redisClient.hgetall(process.env.APP_NAME + ":es"); // redcolector:es
        let val = await hgetallAsync(process.env.APP_NAME + ":es"); // redcolector:es

        // console.log(`Valorile obținute de la Redis`, val);
        let k = Object.keys(val), i;
        for (i = 0; i < k.length; i++) {
            ESIDXS[k[i]] = val[k[i]];
        };
        return ESIDXS;
    } catch (error) {
        console.log(error);
        logger.error(error);
    }
};