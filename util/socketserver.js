require('dotenv').config();
const httpserver = require('./httpserver');

module.exports = function sockets (http,sessionMiddleware) {
    // #1 Creează server prin atașarea celui existent
    const corsOptsSockets = {
        origin: "",
        methods: ["GET", "POST"],
        allowedHeaders: ["_csrf"],
        credentials: true
    };
    // conectează-te cu Redis
    const adapter = require('socket.io-redis');
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

    const io = require('socket.io')(http, {
        cors: corsOptsSockets,
        maxHttpBufferSize: 1e8,
        pingTimeout: 30000,
        transports: [ "websocket", "polling" ]
    });

    // #2 conectarea cu Redis
    const redisAdapter = adapter(CONFIG_ADAPTER);
    io.adapter(redisAdapter);

    // #3 Creează un wrapper de middleware Express pentru Socket.io
    function wrap (middleware) {
        return function matcher (socket, next) {
            middleware (socket.request, {}, next);
        };
    };
    io.use(wrap(sessionMiddleware));

    return io;
};