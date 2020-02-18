const express  = require('express');
const router   = express.Router();
const moment   = require('moment');
const mongoose = require('mongoose');
const Resursa  = require('../models/resursa-red'); // Adu modelul resursei

//TODO: Adu-mi ultimele 10 resurse care sunt marcate a fi publice
Resursa.where({'generalPublic': true}).countDocuments(function cbCountResPub (err, count) {
    if (err) throw err;
    // console.log('Numărul resurselor este: ', count);
});

let resursePublice = Resursa.find({'generalPublic': true}).sort({"date": -1}).limit(8);
let promiseResPub = resursePublice.exec();
promiseResPub.then((result) => {
    // console.log(result.length);
    router.get('/', function (req, res, next) {
        // let localizat = moment(result.date).locale('ro').format('LLL');
        // result.dataRo = `${localizat}`; // formatarea datei pentru limba română.
        
        let newResultArr = [];

        result.map(function clbkMapResult (obi) {
            obi.dataRo = moment(obi.date).locale('ro').format('LLL');
            newResultArr.push(obi);
        });
        
        let scripts = [       
            {script: '/lib/moment/min/moment.min.js'}
        ];
        res.render('index', {
            title:   "RED colector",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "img/rED-logo192.png",
            user:    req.user,
            resurse: newResultArr,
            scripts
        });
    });
}).catch((err) => {
    if (err) throw err;
});

module.exports = router;