const fs = require('fs');
const Papa = require('papaparse');
const readF = fs.createReadStream('CSuri01.csv', 'utf8');
// const writeF = fs.createWriteStream('CSuriX.json', 'utf8');

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
        const folded = foldOneField(results.data);
        fs.writeFile('CSuriX.json', JSON.stringify(folded), 'utf8', (err) => {
            if (err) throw err;
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
        if (arrAcc.length === 0) {
            arrAcc[idx] = elemArrOrig;
            // console.log(arrAcc.slice(-1)[0].ids[0]);
        } 
        if (arrAcc.slice(-1)[0].ids[0] === elemArrOrig.ids[0]) {
            elemArrOrig.activitati.forEach((act) => {
                arrAcc.slice(-1)[0].activitati.push(act);
            });
        } else {
            arrAcc.push(srcArr[idx]);
        }
        return arrAcc;
    }, []);
    return folded;
}