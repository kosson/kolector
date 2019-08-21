const fs = require('fs');
const { Transform } = require('stream');

const Papa = require('papaparse');

const readFile = fs.createReadStream('CSuri01.csv', 'utf8');
// const writeFile = fs.createWriteStream('CSuri01.json');
let input = fs.readFile('CSuri01.csv', 'utf8', (err, data) => {
    if (err) throw err;
    return data;
});

Papa.parse(readFile, {
    header: true,
    dynamicTyping: true,
    download: true,
    delimiter: ',',
    step: function (results) {
        // console.log("Row data:", results.data);
        // console.log("Row errors:", results.errors);
        fs.appendFile('./CSuri01.json', JSON.stringify(results.data) + ',', (err) => {
            if (err) throw err;
            console.log('ok?!');
        });
    },
    complete: function (results) {

    }
});
// function CSV2JSON () {

// }
// CSV2JSON(readFile);