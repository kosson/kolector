require('dotenv').config();
const fs = require('fs');
const Papa = require('papaparse');
const readF = fs.createReadStream('CSuri.csv', 'utf8');
// const writeF = fs.createWriteStream('CSuriX.json', 'utf8');

const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true); // Deprecation warning
const connectionString = `mongodb://localhost:27017/${process.env.MONGO_LOCAL_CONN}`;

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
        if (header === 'nivel') return 'nivel';
        if (header === 'act normativ') return 'ref';
        if (header === 'competență generală') return 'parteA';
        if (header === 'număr competența generală') return 'compGen';
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
        } else if (headName === 'nivel') {
            value = [].concat(value);
            return value;
        } else if (headName === 'ref') {
            value = [].concat(value);
            return value;
        } else if (headName === 'parteA') {
            return value;
        } else if (headName === 'compGen') {
            return value;
        }
    },
    complete: function (results, file) {
        if (results.errors) {
            console.log(results.errors);
        }
        const folded = foldOneField(results.data); // apelează funcția de folding
        // scrie datele pe disc...
        fs.writeFile('CSuri.json', JSON.stringify(folded), 'utf8', (err) => {
            if (err) throw err;
        });
        
        // scrie datele în bază
        mongoose.connect(connectionString, { useNewUrlParser: true });
        const CSModel = require('../models/competenta-specifica');
        mongoose.connection.dropCollection('competentaspecificas'); // Fii foarte atent: șterge toate datele din colecție la fiecare load!.
        
        CSModel.insertMany(folded, function cbInsMany (err, result) {
            if (err) {
                console.log(err);
                process.exit();
            }else{
                console.log('Înregistrări inserate: ', result.length);
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