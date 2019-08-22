const fs = require('fs');
const { Transform } = require('stream');

const Papa = require('papaparse');

const readF = fs.createReadStream('CSuri01.csv', 'utf8');
const writeF = fs.createWriteStream('CSuri01.json', 'utf8');

Papa.parse(readF, {
    header: true,
    transform: function (value, headName) {
        // console.log(headName);
        // Array.isArray(obj) ? obj:[obj]
        if (headName === 'nume') {
            return value;
        }
        
        if (headName === 'ids') {
            value = [].concat(value);
            return value;
        } else if ((headName === 'cod')) {
            return value;
        } else if (headName === 'activitate') {
            headName = 'activitati';
            value = [].concat(value);
            return headName, value;
        } else if (headName === 'disciplină') {
            headName = 'disciplina';
            value = [].concat(value);
            return value;           
        } else if (headName === 'nivel') {
            value = [].concat(value);
            return value;
        } else if (headName === 'act normativ') {
            headName = 'ref';
            value = [].concat(value);
            return value;
        } else if (headName === 'competență generală') {
            headName = 'parteA';
            return value;
        }
    },
    complete: function (result) {
        // if (result.errors) throw result.errors;
        // result.data.reduce((ac, curr, idx, arr) => {
        //     if (ac.ids === curr.ids) {
        //         ac.activitate
        //     }
        // });
        fs.writeFile('CSuri01.json', JSON.stringify(result.data), 'utf8', (err) => {
            if (err) throw err;
        });
    }
});
