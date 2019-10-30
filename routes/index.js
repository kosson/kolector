const express  = require('express');
const router   = express.Router();
const moment   = require('moment');
const mongoose = require('mongoose');
const Resursa  = require('../models/resursa-red'); // Adu modelul resursei

//TODO: Adu-mi ultimele 10 resurse care sunt marcate a fi publice
Resursa.where({'generalPublic': 'true'}).countDocuments(function cbCountResPub (err, count) {
    if (err) throw err;
    // console.log('Numărul resurselor este: ', count);
});

let resursePublice = Resursa.find({'generalPublic': 'true'}).limit(10);
let promiseResPub = resursePublice.exec();
promiseResPub.then((result) => {
    // console.log(result.length);
    router.get('/', function (req, res, next) {
        res.render('index', {
            title:   "RED colector",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "img/rED-logo192.png",
            user:    req.user,
            resurse: result
        });
    });
}).catch((err) => {
    if (err) throw err;
});

module.exports = router;