import {createHelia} from 'helia';
import {createLibp2p} from 'libp2p';
import {tcp} from '@libp2p/tcp';
import {noise} from '@chainsafe/libp2p-noise';
import {yamux} from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { webSockets } from '@libp2p/websockets';
import { identifyService } from 'libp2p/identify';
import {MemoryBlockstore} from 'blockstore-core';
import {MemoryDatastore} from 'datastore-core';
import {unixfs} from '@helia/unixfs';
import { json } from '@helia/json';
import { strings } from '@helia/strings';
import { logger } from '@libp2p/logger';
import last from 'it-last';
import * as kubo from 'kubo';


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
                // webSockets(),
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


export const knode = await createNode();

// const input = Uint8Array.from([1,2,4]);
// const {cid} = await kubo.api.add({content: input}, {
//     cidVersion: 1,
//     rawLeaves: true
// })

// const output = await knode.blockstore.get(cid);

// if (input == output) {
//     console.log("A funcționat");
// }
