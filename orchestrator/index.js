
import {unixfs} from '@helia/unixfs';
import { json } from '@helia/json';
import { strings } from '@helia/strings';
import { logger } from '@libp2p/logger';
import last from 'it-last';

// Importă frameworkul Fastify și creează o instanță
import Fastify from 'fastify'
const fastify = Fastify({
  logger: true
});

async function createNode () {
    try {
        // creează un blockstore nou
        const blockstore = new MemoryBlockstore();
        // creează un datastore nou
        const datastore = new MemoryDatastore(); // necesar pentru a stoca info specifice (căutări DHT, etc)
    
        const libp2p = await createLibp2p({
            addresses: {
                listen: ['/ip4/0.0.0.0/tcp/0'] // a public P2P swarm port
            },
            transports: [
                webSockets(),
                tcp()
            ],
            connectionEncryption:[noise()],
            streamMuxers: [yamux()],
            datastore,
            identity:{
                host: {
                    agentVersion: 'helia/0.0.0'
                }
            },
            nat: {enabled: false},
            relay: {enabled: false},
            peerDiscovery: [
                bootstrap({
                  list: [
                    "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
                    "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
                    "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
                    "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt"
                  ]
                })
            ],
            services: {
                identify: identifyService()
            }
        });
    
        const log = logger('helia');

        // creează un nod Helia
        return await createHelia({
            libp2p,
            blockstore,
            datastore
        });
    } catch (error) {
        if (error) {
            throw new Error(`la crearea nodului s-a întâmplat ceva neașteptat: ${error}`);
        };   
    }
};

// creează un nod nou
const knode = await createNode();

// creează un sistem de fișiere suport pentru nodul Helia, care în acest caz este UnixFS
const fs = unixfs(knode);

// folosește TextEncoder pentru a transforma string-urile în Uint8Arrays
const encoder = new TextEncoder();
// this decoder will turn Uint8Arrays into strings
const decoder = new TextDecoder();

// Creează prima rută
fastify.get('/test', async function handlerRoot (request, reply) {
    // creează un content identifier
    const identificatorDeTest = await fs.addBytes(encoder.encode('Salutare, prietene!'));

    console.log('Adaug datelele identificate prin:', identificatorDeTest.toString());
    let text = '';

    // use the second Helia node to fetch the file from the first Helia node
    for await (const chunk of fs.cat(identificatorDeTest)) {
        text += decoder.decode(chunk, {
            stream: true
        })
    }
    return { 
        CID: identificatorDeTest,
        content: text 
    };
});

async function runServer () {
    try {
        await fastify.listen({ port: 3300 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

await runServer();