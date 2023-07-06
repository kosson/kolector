import {app} from './app.js';

async function runServer () {
    try {
        await app.listen({ port: 3300 });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

await runServer();