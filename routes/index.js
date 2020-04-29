const express  = require('express');
const router   = express.Router();
const moment   = require('moment');
const mongoose = require('mongoose');
const Resursa  = require('../models/resursa-red'); // Adu modelul resursei

// console.log(result.length);
router.get('/', function clbkRootRoute (req, res, next) {
    // let localizat = moment(result.date).locale('ro').format('LLL');
    // result.dataRo = `${localizat}`; // formatarea datei pentru limba română.

    Resursa.where({'generalPublic': true}).countDocuments(function cbCountResPub (err, count) {
        if (err) throw err;
        // console.log('Numărul resurselor este: ', count);
    });

    let resursePublice = Resursa.find({'generalPublic': true}).sort({"date": -1}).limit(8);
    let promiseResPub = resursePublice.exec();
    promiseResPub.then((result) => {
        let newResultArr = [];

        result.map(function clbkMapResult (obi) {
            const newObi = Object.assign({}, obi._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
            // https://github.com/wycats/handlebars.js/blob/master/release-notes.md#v460---january-8th-2020
            newObi.dataRo = moment(newObi.date).locale('ro').format('LLL');
            newResultArr.push(Object.assign(newObi));
        });
        
        let scripts = [       
            {script: '/lib/moment/min/moment.min.js'}
        ];
        
        res.render('index', {
            title:     "RED colector",
            style:     "/lib/fontawesome/css/fontawesome.min.css",
            logoimg:   "img/rED-logo192.png",
            user:      req.user,
            resurse:   newResultArr,
            csfrToken: req.csrfToken(),
            scripts
        });
    }).catch((err) => {
        if (err) throw err;
    });
});

module.exports = router;