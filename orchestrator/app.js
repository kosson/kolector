// Importă frameworkul Fastify și creează o instanță
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import * as fs from 'node:fs'
import util from 'util';
import { pipeline } from 'stream';
import last from 'it-last';
import all from 'it-all';
import {importer, importFile, importDirectory, importBytes, importByteStream} from 'ipfs-unixfs-importer';

// instanțiază nodul
import { knode } from './node.js';
import {unixfs} from '@helia/unixfs';
const nixfs = unixfs(knode);        // creează un sistem de fișiere suport pentru nodul Helia, care în acest caz este UnixFS
const encoder = new TextEncoder();  // folosește TextEncoder pentru a transforma string-urile în Uint8Arrays
const decoder = new TextDecoder();  // this decoder will turn Uint8Arrays into strings

// CONECTARE LA NODUL KUBO
import { create, globSource, urlSource } from 'kubo-rpc-client';
// connect to the default API address http://localhost:5001
const kuboClient = await create();

const pump = util.promisify(pipeline);

const envToLogger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: true,
  test: false,
}
// instanțiază frameworkul Fastify
export const app = Fastify({
  logger: envToLogger ?? true // defaults to true if no entry matches in the map
});


app.register(multipart); // înrolează modulul `multipart`


// Creează prima rută de test
app.get('/test', {
  handler: async function handlerRoot (request, reply) {

    app.log.info('Am primite cerere de testare');
    // creează un content identifier
    const identificatorDeTest = await nixfs.addBytes(encoder.encode('Salutare, prietene!'));
  
    console.log('Adaug datelele identificate prin:', identificatorDeTest.toString());
    let text = '';
  
    // use the second Helia node to fetch the file from the first Helia node
    for await (const chunk of nixfs.cat(identificatorDeTest)) {
        text += decoder.decode(chunk, {
            stream: true
        })
    }
    return reply.code(200).send({ 
      CID: identificatorDeTest,
      content: text 
    });
  }
});

app.post('/upload', async function uploadMultiform (request, reply) {
  const parts = request.parts(); // pentru a prelucra și restul datelor din câmpuri, nu numai fișierele
  const data = [];
  for await (const part of parts) {
    if (part.file) {
      await pump(part.file, fs.createWriteStream(`./localstore/${part.filename}`));
    } else {
      // data.push(JSON.stringify(part.fields));
      if (part.type === 'field') {
        let fldata = {
          name: part.fieldname,
          value: part.value
        }
        data.push(fldata);
      }      
    }
  }
  return {
    message : 'Am primit datele',
    metadata: data
  };
});

app.post('/pin', async function pinClbk (request, reply) {
  try {
    // const parts = request.parts(); // pentru a prelucra și restul datelor din câmpuri, nu numai fișierele

    // const localstoreCid = await importDirectory({
    //   path: '-'
    // }, knode.blockstore); // observă faptul că trebuie să pasezi și referința către blockstore
    // app.log.info(`CID-ul directorului local este ${localstoreCid}`);

    const files = await request.saveRequestFiles();
    let id = undefined;
    let cidSubdirectorRoot4Res = null;

    let source = [];

    for (const file of files) {
      // app.log.info({
      //   path: file.filepath, 
      //   fieldname: file.fieldname, 
      //   filename: file.filename
      // });

      // if (id === undefined) {
      //   app.log.info(`id este undefined!`);
      //   id = file.fields.id;
      //   cidSubdirectorRoot4Res = await nixfs.mkdir(localstoreCid, id); // creează un subdirector numit după valoarea câmpului `id`
      //   cid4resDir = await all(nixfs.ls(cidSubdirectorRoot4Res));
      //   app.log.info(`Ei bine, directorul rădăcină al resursei este: ${cid4resDir}`); // listează conținutul directorului principal pentru a vedea dacă s-a creat subdirectorul
      // }

      // const {cid: fileCid} = await importBytes(Uint8Array.from([1, 2, 4]), knode.blockstore);  // creează un block nou de conținut (de fapt se creează un DAG nou)
      // app.log.info(`CID-ul pentru conținut este: ${fileCid}`);

      // const finalDirCid = await fs.cp(fileCid, cidSubdirectorRoot4Res, 'test.txt'); // introdu blocul de conținut creat mai sus ca fiind un fișier nou în subdirector (de fapt se creează alt DAG nou)
      // app.log.info(await all(nixfs.ls(finalDirCid))); // afișează structura actualizată

      source.push({
        path: file.filepath, 
        content: fs.createReadStream(file.filepath)
      })
    }

    // for await (const entry of importer(source, knode.blockstore)) {
    //   console.info(entry); 
    // }

    for await (const file of kuboClient.addAll(globSource('/tmp', '**/*'))) {
      console.log(`Am adăugat în kubo: ${file}`);
    }

    reply.send();
  } catch (error) {
    throw new Error(`La pinuire a apărut eroarea ${error}`);
  }
});