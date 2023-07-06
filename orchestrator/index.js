import {app} from './app.js';

async function runServer () {
    try {
        await app.listen({ 
            port: 3300,
            host: "0.0.0.0"
        });
        // console.log(`server listening on ${app.server.address().port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, async () => {
        await app.close();
        process.exit(0);
    });
});

await runServer();