require('dotenv').config();

module.exports = function sockets (http, sessionMiddleware, redisCachedInstance) {
    // #1 Creează server prin atașarea celui existent
    const corsOptsSockets = {
        origin: "",
        methods: ["GET", "POST"],
        allowedHeaders: ["_csrf"],
        credentials: true
    };
    
    // conectează-te cu Redis
    // const adapter = require('socket.io-redis');
    const { createAdapter } = require('@socket.io/redis-adapter');
    /*
    This package has been renamed to '@socket.io/redis-adapter', please see the migration guide here: https://socket.io/docs/v4/redis-adapter/#migrating-from-socketio-redis
    https://www.npmjs.com/package/@socket.io/redis-adapter
    */
    const CONFIG_ADAPTER = {
        host: '',
        port: 6379
    };
    // Cazul rulării pe volume și cel curent (nodemon?!)
    if (process.env.APP_RUNTIME === 'virtual') {
        corsOptsSockets.origin = 'http://' + process.env.DOMAIN_VIRT + ':' + process.env.PORT;
        CONFIG_ADAPTER.host = 'redis'
    } else {
        corsOptsSockets.origin = 'http://' + process.env.DOMAIN;
        CONFIG_ADAPTER.host = '127.0.0.1'
    }

    const pubClient = redisCachedInstance;
    const subClient = pubClient.duplicate();

    const io = require('socket.io')(http, {
        cors: corsOptsSockets,
        maxHttpBufferSize: 1e8,
        pingTimeout: 30000,
        transports: [ "websocket", "polling" ]
    });

    io.adapter(createAdapter(pubClient, subClient));

    // Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    //     io.adapter(createAdapter(pubClient, subClient));
        // io.listen(3000);
    // });

    // #2 conectarea cu Redis
    // const redisAdapter = adapter(CONFIG_ADAPTER);
    // io.adapter(redisAdapter);

    // #3 Creează un wrapper de middleware Express pentru Socket.io
    function wrap (middleware) {
        return function matcher (socket, next) {
            middleware (socket.request, {}, next);
        };
    };
    io.use(wrap(sessionMiddleware));

    return io;
};