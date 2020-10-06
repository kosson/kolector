const redis = require('redis');
/* === REDIS - configurare === */
// creează clientul conform https://github.com/tj/connect-redis/blob/HEAD/migration-to-v4.md
let redisClient = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
    db: 10
});

redisClient.on('ready', function clbkRedReady () {
    console.log('Conectare la Redis, OK!');
});

redisClient.on('reconnecting', function clbkRedReady () {
    console.log('M-am reconectat la Redis!');
});

redisClient.on('error', console.error);

module.exports = redisClient;