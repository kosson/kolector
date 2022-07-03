const mongoose = require('mongoose');

let render = new mongoose.Schema({
    typeofres: [], // resursele pe care le poți introduce în sistem
    activeres: []  // resursele care au fost activate pentru a fi afișat formular de introducere 
});

module.exports = new mongoose.model('render', render);