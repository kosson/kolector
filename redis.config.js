require('dotenv').config();
const logger = require('./util/logger');
// const redis  = require('redis');
const Redis = require("ioredis");
const redis = new Redis({
    port: 6379, // Redis port
    host: "redis", // Redis host
    username: "default", // needs Redis >= 6
    password: process.env.REDIS_HOST_PASSWORD,
    db: 10, // Defaults to 0
    connectionName: "KOSSON FECIT"
});

const{requiredParam} = require('./util/check-utils');

/* === REDIS - configurare === */
try {
    function redisEventListeners ({redisClient}) {
        let noRedisConn = '0';
        redisClient.on("error", (error) => {
            throw new Error(`[redis.config.js] Crearea clientului de Redis a eșuat: ${error}`);
        });       
        redisClient.on("connect", () => {
            noRedisConn++;
            console.log(`[redis.config.js] Am realizat conectarea la serviciul Redis. Nr. conectări: ${noRedisConn}`);
        });
        redisClient.on("end", () => {
            console.log(`[redis.config.js] Clientul Redis s-a deconectat.`);
        });
        redisClient.on("ready", () => {
            console.log(`[redis.config.js] Clientul Redis a fost inițializat.`);
        });
    };
    
    /*
    Am setat o variabilă de mediu `APP_RUNTIME` care va indica dacă aplicația rulează virtualizat sau local.
    Valorile pe care această variabilă de mediu le poate avea sunt: `virtual` sau `local`.
    */  
    const CONFIG = {
        host: 'localhost',
        port: 6379,
        db: 10
    };
    
    /** @type {object} */
    let redisClient = null; // obiectul clientului de Redis
    let redisClients = {}; // pot fi mai multe conexiuni la diferite instanțe de Redis în cluster

    /**
     * Funcția are rolul să creeze obiectul cu rol de conector la Redis
     * @return {object} o instanță a clientului (instanța cache-uită și clienții existenți)
    */
    function redisInit({redisCachedInstance = requiredParam(redisCachedInstance), redisClients} = {}) {
        redisClients['cachedInstance'] = redisCachedInstance;
        // redisEventListeners({redisClient: redisCachedInstance});
        return {
            redisCachedInstance,
            redisClients
        };
    }

    /* configurare a scenariului virtualizat */
    // testează pentru cazul în care aplicația va fi rulată în containere Docker
    if (process.env.APP_RUNTIME === 'virtual') {
        // crearea șirului de caractere al url-ului de conectare pentru Redis 7
        
        /** @type {string} */
        // let urlstring = `redis://default:${process.env.REDIS_HOST_PASSWORD}@redis:6379/10`;        
        // const options = urlstring ? {url: urlstring} : {};

        // let redisConnectorVirtual = redisInit({redisCachedInstance: redis.createClient(options), redisClients});
        // let redisConnectorVirtual = redisInit({redisCachedInstance: redis.createClient({
        //     username: "default",
        //     password: process.env.REDIS_HOST_PASSWORD,
        //     database: 10,
        //     socket: {
        //         host: 'redis',
        //         port: 6379,
        //     }
        // }), redisClients});
        let redisConnectorVirtual = redisInit({redisCachedInstance: redis, redisClients});
        // https://github.com/redis/node-redis/blob/master/docs/client-configuration.md

        // module.exports = redisConnectorVirtual;
        module.exports = redis;
    } else {
        let redisConnectorLocal = redisInit({redisCachedInstance: redis.createClient(options), redisClients});
        // redisClient = redis.createClient(CONFIG);
        module.exports = redisConnectorLocal;
    }
} catch (error) {
    console.error('Conectarea la Redis nu s-a putut face!', error);
    logger.error(error);
}