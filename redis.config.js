const redis = require('redis');
const chalk = require('chalk');

/* === REDIS - configurare === */
// creează clientul conform https://github.com/tj/connect-redis/blob/HEAD/migration-to-v4.md
let redisClient = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
    db: 10
});

redisClient.on('ready', function clbkRedReady () {
    console.log(chalk.green('Conectare la REDIS ok!'));
})

redisClient.on('reconnecting', function clbkRedReady () {
    console.log('M-am reconectat la Redis!');
})

redisClient.on('error', (err) => {
    console.error('A apărut o eroare cu Redis ', 
        chalk.red(err.message)
    );
});

module.exports = redisClient;