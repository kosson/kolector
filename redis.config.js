require('dotenv').config();
const logger = require('./util/logger');
const redis  = require('redis');
// const { createClient } = require('redis');

/* === REDIS - configurare === */
// creează clientul conform https://github.com/tj/connect-redis/blob/HEAD/migration-to-v4.md

/*
Am setat o variabilă de mediu `APP_RUNTIME` care va indica dacă aplicația rulează virtualizat sau local.
Valorile pe care această variabilă de mediu le poate avea sunt: `virtual` sau `local`.
*/  
const CONFIG = {
    host: '',
    port: 6379,
    db: 10
};
process.env.APP_RUNTIME === 'virtual' ? CONFIG.host = 'redis' : CONFIG.host = '127.0.0.1';

let redisClient = redis.createClient(CONFIG);
// let redisClient = createClient(CONFIG);

function clbkRedReady () {
    console.log('Conectare la REDIS', redisClient.server_info.redis_version, 'OK!');
}

function clbkRedReady () {
    console.log('M-am reconectat la Redis!');
};

redisClient.on('ready', clbkRedReady);
redisClient.on('reconnecting', clbkRedReady);
redisClient.on('error', (error) => {
    console.error('Conectarea la Redis nu s-a putut face!');
    logger.error(error);

});

module.exports = redisClient;