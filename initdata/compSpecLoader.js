require('dotenv').config();
const fs    = require('fs-extra');
const path  = require('path');
const Papa  = require('papaparse');
const csv   = require('fast-csv');
const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true); // Deprecation warning

if (process.env.NODE_ENV !== "test") {
    mongoose.connect(process.env.MONGO_LOCAL_CONN, {
        auth: { "authSource": "admin" },
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PASSWD,
        useNewUrlParser: true, 
        useUnifiedTopology: true
    });
}
mongoose.connection.on('error', function () {
    console.warn('Conectare eșuată!');
    process.exit();
});
mongoose.connection.once('open', function () {
    console.log("Conectare la baza de date făcută cu succes");
});
// const writeF = fs.createWriteStream('CSuriX.json', 'utf8'); // Generează un JSON în caz că acest lucru este necesar. Să fie acolo.

/**
 * Funcția are rolul de a strânge toate activitățile unei competențe specifice într-un array dedicat.
 * Când sunt erori, problema stă în normalizarea datelor. ATENȚIE! M-am opărit!
 * @param {Object} data Este un obiect de date
 */
function foldOneField (data) {
    const arr = JSON.stringify(data);
    const folded = data.reduce((arrAcc, elemArrOrig, idx, srcArr) => {
        // Inițial, acumulatorul este un array fără niciun element. Este necesară introducerea primului:
        if (arrAcc.length === 0) {
            arrAcc[idx] = elemArrOrig;
        }
        // Verifică câmpul `ids` al ultimului element din array (ultimul introdus)
        if (arrAcc.slice(-1)[0].ids[0] === elemArrOrig.ids[0]) {
            // pentru toate activitățile existente în array-ul `activități`,
            elemArrOrig.activitati.forEach((act) => {
                arrAcc.slice(-1)[0].activitati.push(act); // introdu-le în array-ul activități a înregistrării preexistente
            });
        } else {
            // În cazul în care `ids` diferă, înseamnă că ai de-a face cu o nouă competență, care va constitui o nouă înregistrare
            arrAcc.push(srcArr[idx]); // care la rândul ei va împături activități.
        }
        return arrAcc;
    }, []);
    return folded;
}

// TODO: DEZVOLTĂ MAI DEPARTE ÎNTR-UN AUTOMATOR!!!
/* ============ OBȚINEREA CĂILOR TUTUROR FIȘIERELOR =============== */
// De la https://gist.github.com/kethinov/6658166
var dir = 'surse'; // este numele directorului în care vor sta toate fișierele care trebuie concatenate
/**
 * Funcția area rolul de a genera un Array cu toate fișierele existente în directorul desemnat prin variabila `dir`
 * @param {String} dir Numele directorului în care se află fișierele care trebuie concatenate
 */
const read = (dir) =>
    fs.readdirSync(dir)
        .reduce((files, file) => {
            let pth = fs.statSync(path.join(dir, file)).isDirectory() ?
                        files.concat(read(path.join(dir, file))) :
                        files.concat(path.join(dir, file));
            return pth;
        },[]);

// În caz că vrei să afișezi numele fișierelor prelucrate în vreun context viitor, activeză fragmentul !!!
// walk('/csvuri/').then((res) => {
//     console.log(res); // fa ceva cu lista de fișiere
// });

class CsvFile {
    static write(filestream, rows, options) {
        return new Promise((res, rej) => {
            csv.writeToStream(filestream, rows, options)
                .on('error', err => rej(err))
                .on('finish', () => res());
        });
    }

    constructor(opts) {
        this.headers = opts.headers;
        this.path = opts.path;
        this.writeOpts = { headers: this.headers, includeEndRowDelimiter: true };
    }

    create(rows) {
        return CsvFile.write(fs.createWriteStream(this.path), rows, { ...this.writeOpts });
    }

    append(rows) {
        return CsvFile.write(fs.createWriteStream(this.path, { flags: 'a' }), rows, {
            ...this.writeOpts,
            // dont write the headers when appending
            writeHeaders: false,
            rtrim: true,
            ltrim: true
        });
    }

    read() {
        return new Promise((res, rej) => {
            fs.readFile(this.path, (err, contents) => {
                if (err) {
                    return rej(err);
                }
                return res(contents);
            });
        });
    }
}

/* === CONCATENAREA TUTUROR CSV-urilor în unul singur === */
/**
 * Funcția `concatCSVAndOutput` construiește un array de promisiuni pentru fiecare fișier csv
 * pe care îl și rezolvă cu Promise.all
 * De la https://stackoverflow.com/questions/50905202/how-to-merge-two-csv-files-rows-in-node-js
 * Pentru utilizarea funcției, trebuie să avem dependința `fast-csv` instalată deja
 * @param {Array} csvFilePaths 
 * @param {String} outputFilePath 
 * @returns {Promise}
 */
function concatCSVAndOutput(csvFilePaths, outputFilePath) {
    // console.log(csvFilePaths);
    
    // construiești un array de promisiuni
    const promises = csvFilePaths.map((path) => {
        // pentru fiecare fișier CSV, generează o promisiune.
        return new Promise((resolve) => {
            const dataArray = [];
            csv.parseFile(path, { headers: true })
                .on('data', function clbkOnData (data) { dataArray.push(data); })
                .on('end', function clbkOnEnd () { resolve(dataArray); });
        });
    });

    return Promise.all(promises)
                .then((results) => {
                    // console.log(Array.isArray(results));
                    const allRecordsArr = [];                 

                    results.forEach((result) => {      
                        // console.log(Array.isArray(result));              
                        result.forEach((record) => {
                            // console.log("O singură înregistrare arată astfel: ", record);
                            allRecordsArr.push(record);  
                        });
                    });
                    
                    const csvFile = new CsvFile({
                        path: outputFilePath,
                        headers: ["nume","ids","cod","activitate","disciplină","coddisc","nivel","act normativ","competență generală"]
                    });

                    csvFile.create(allRecordsArr).catch(err => {
                        console.error(err.stack);                        
                    });
                }).catch(error => {
                    console.log(error);
                    process.exit(1);
                });
                
}
// generează fișierul consolidat cu toate câmpurile din toate csv-urile sau atunci când mai introduci un calup nou de date.
// concatCSVAndOutput(read(dir), `csvuri/all.csv`); // linie activată doar în cazul în care baza este goală și nu există generat deja fișierul all.csv

const readF = fs.createReadStream(`csvuri/all.csv`, 'utf8'); // Creează stream Read din fișierul CSV sursă.

/* === PRELUCRAREA CSV-ului ===  */
// FIXME: Actualizează scriptul... dă erori (deprecated?!)
Papa.parse(readF, {
    header: true,
    encoding: 'utf8',
    transformHeader: function (header) {
        // console.log(header);
        if (header === 'nume') return 'nume';
        if (header === 'ids') return 'ids';
        if (header === 'cod') return 'cod';
        if (header === 'activitate') return 'activitati';
        if (header === 'disciplină') return 'disciplina';
        if (header === 'coddisc') return 'coddisc';
        if (header === 'nivel') return 'nivel';
        if (header === 'act normativ') return 'ref';
        if (header === 'competență generală') return 'parteA';
        // if (header === 'număr competența generală') return 'compGen';
    },
    transform: function (value, headName) {
        // console.log(headName);
        // Array.isArray(obj) ? obj:[obj]
        if (headName === 'nume') {
            return value;
        } else if (headName === 'ids') {
            value = [].concat(value);
            return value;
        } else if ((headName === 'cod')) {
            return value;
        } else if (headName === 'activitati') {
            value = [].concat(value);
            return value;
        } else if (headName === 'disciplina') {
            value = [].concat(value);
            return value;           
        } else if (headName === 'coddisc') {
            return value;           
        } else if (headName === 'nivel') {
            value = [].concat(value);
            return value;
        } else if (headName === 'ref') {
            value = [].concat(value);
            return value;
        } else if (headName === 'parteA') {
            return value;
        } 
        // else if (headName === 'compGen') {
        //     return value;
        // }
    },
    complete: function (results, file) {
        if (results.errors) {
            console.log(results.errors);
        }
        const folded = foldOneField(results.data); // apelează funcția de folding
        // scrie datele pe disc...
        // fs.writeFile(`${dir}/all.json`, JSON.stringify(folded), 'utf8', (err) => {
        //     if (err) throw err;
        // });
        
        // scrie datele în bază
        const CSModel = require('../models/competenta-specifica');
        //mongoose.connection.dropCollection('competentaspecificas'); // Fii foarte atent: șterge toate datele din colecție la fiecare load!.
        
        CSModel.insertMany(folded, function cbInsMany (err, result) {
            if (err) {
                console.log(err);
                process.exit(1);
            } else {
                console.log('Numărul de competențe specifice inserate în colecție (nu înregistrări): ', result.length);
                process.exit();
            }
        });
    },
    error: function (err, file) {
        if (err) {
            console.log(err.message);
        }
    }
});