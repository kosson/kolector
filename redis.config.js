require('dotenv').config();
const logger = require('./util/logger');
const redis  = require('redis');
// const { createClient } = require('redis');

/* === REDIS - configurare === */
// creează clientul conform https://github.com/tj/connect-redis/blob/HEAD/migration-to-v4.md

try {
    /*
    Am setat o variabilă de mediu `APP_RUNTIME` care va indica dacă aplicația rulează virtualizat sau local.
    Valorile pe care această variabilă de mediu le poate avea sunt: `virtual` sau `local`.
    */  
    const CONFIG = {
        host: '',
        port: 6379,
        db: 10,
        password: process.env.REDIS_PASSWORD || undefined
    };
    process.env.APP_RUNTIME === 'virtual' ? CONFIG.host = 'redis' : CONFIG.host = '127.0.0.1';

    let redisClient = redis.createClient(CONFIG);
    // let redisClient = createClient(CONFIG);

    function clbkRedReady () {
        console.log('M-am reconectat la Redis:\x1b[32m', redisClient.address, "\x1b[37m", 'versiunea \x1b[32m', redisClient.server_info.redis_version, "\x1b[37m");
    };

    redisClient.on('ready', clbkRedReady);
    redisClient.on('reconnecting', clbkRedReady);
    redisClient.on('error', (error) => {
        return new Error(`La conectarea cu Redis a apărut eroarea `, error);
    });

    module.exports = redisClient;
} catch (error) {
    console.error('Conectarea la Redis nu s-a putut face!', CONFIG.host, redisClient.server_info.redis_version);
    logger.error(error);
}