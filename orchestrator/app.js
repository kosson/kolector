// Importă frameworkul Fastify și creează o instanță
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import fs from 'fs';
import util from 'util';
import { pipeline } from 'stream';
import last from 'it-last';
import all from 'it-all';
import {importDirectory, importBytes} from 'ipfs-unixfs-importer';

// instanțiază nodul
import { knode } from './node.js';
import {unixfs} from '@helia/unixfs';
const nixfs = unixfs(knode);        // creează un sistem de fișiere suport pentru nodul Helia, care în acest caz este UnixFS
const encoder = new TextEncoder();  // folosește TextEncoder pentru a transforma string-urile în Uint8Arrays
const decoder = new TextDecoder();  // this decoder will turn Uint8Arrays into strings

const pump = util.promisify(pipeline);

// instanțiază frameworkul Fastify
export const app = Fastify({
  logger: true
});
app.register(multipart); // înrolează modulul `multipart`


// Creează prima rută de test
app.get('/test', async function handlerRoot (request, reply) {
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
  return { 
      CID: identificatorDeTest,
      content: text 
  };

  // return { 
  //     test: 'fun and games'
  // };
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

// creează ruta care primește o resursă arhivată (BagIt) și o pinuieste în nodul local
app.post('/pin', async function pin (request, reply) {
  try {
    const parts = request.parts(); // pentru a prelucra și restul datelor din câmpuri, nu numai fișierele
    const data = {
      id: '',
      files: [],
      fields: []
    }; // culege datele
  
    const {cid: localstoreCid} = await importDirectory({
      path: '/localstore'
    }, knode.blockstore); // observă faptul că trebuie să pasezi și referința către blockstore
  
    // culege datele din request în obiectul local `data`
    for await (const part of parts) {
      // tratează datele din câmpuri
      if (part.type === 'field') {
        // dacă ai găsit id-ul colectează-l în obiectul centralizator
        if (part.fieldname === 'id') {
          data.id = part.value;
        }
        // creează un obiect local pentru a colecta daetele de interes
        let fldata = {
          name: part.fieldname,
          value: part.value
        }
        data.fields.push(fldata); // hidratează array-ul `fields`
      }    
      // tratează fișierele
      if (part.file) {
        data.files.push({file: part.file, filename: part.filename});
      }
    }
    let cid4resDir = '';
    // aici va sta toată logica de adăugare în MemoryBlockstore
    // console.info(emptyDirCid.toV0());
    if (data?.id !== 'undefined') {
      const cidSubdirectorRoot4Res = await nixfs.mkdir(localstoreCid, data.id); // creează un subdirector numit bar
      cid4resDir = await all(nixfs.ls(cidSubdirectorRoot4Res));
      console.info(cid4resDir); // listează conținutul directorului principal pentru a vedea dacă s-a creat subdirectorul
    }

    // const {cid: fileCid} = await importBytes(Uint8Array.from([1, 2, 4]), knode.blockstore);  // creează un block nou de conținut (de fapt se creează un DAG nou)
    // console.info(`CID-ul pentru conținut este: ${fileCid}`);

    // const finalDirCid = await fs.cp(fileCid, updateCid, 'text.txt'); // introdu blocul de conținut creat mai sus ca fiind un fișier nou în subdirector (de fapt se creează alt DAG nou)
    // console.info(await all(nixfs.ls(finalDirCid))); // afișează structura actualizată
  
    return {
      message : 'Am primit datele',
      metadata: data,
      subdirCID: cid4resDir
    };
  } catch (error) {
    throw new Error(`La pinuire a apărut eroarea ${error}`);
  }
});