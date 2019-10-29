const express  = require('express');
const router   = express.Router();
const moment   = require('moment');
const mongoose = require('mongoose');
const Resursa  = require('../models/resursa-red'); // Adu modelul resursei

//TODO: Adu-mi toate resursele care sunt marcate a fi publice
let countPub = Resursa.where({'generalPublic': true}).countDocuments(function cbCountResPub (err, count) {
    if (err) throw err;
    console.log('Numărul resurselor este: ', count);
});
let queryPubRes = Resursa.find();

router.get('/', function (req, res, next) {
    res.render('index', {
        title:   "RED colector",
        style:   "/lib/fontawesome/css/fontawesome.min.css",
        logoimg: "img/rED-logo192.png",
        user:    req.user
    });
});

module.exports = router;