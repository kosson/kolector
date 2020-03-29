require('dotenv').config();
/* ==== DEPENDINȚE ==== */
const express = require('express');
const router  = express.Router();
const moment  = require('moment');
const Resursa = require('../models/resursa-red'); // Adu modelul resursei

// ========== RESURSE PUBLICE ========
router.get('/', (req, res) => {
    let resursePublice = Resursa.find({'generalPublic': 'true'}).sort({"date": -1}).limit(8);
    let promiseResPub = resursePublice.exec();
    promiseResPub.then((result) => {

        let scripts = [     
            {script: '/lib/moment/min/moment.min.js'}        
        ];

        // LOCALIZARE DATĂ ÎN ROMÂNĂ
        let newResultArr = []; // noul array al obiectelor resursă
        result.map(function clbkMapResult (obi) {
            obi.dataRo = moment(obi.date).locale('ro').format('LLL');
            newResultArr.push(obi);
        });
        
        res.render('resursepublice', {
            title:   "Resurse publice",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "img/rED-logo192.png",
            user:    req.user,
            resurse: newResultArr,
            scripts
        });
    }).catch((err) => {
        if (err) throw err;
    });
});

router.get('/:idres', (req, res) => {
    var record = require('./controllers/resincred.ctrl')(req.params); // aduce resursa și transformă conținutul din JSON în HTML
    record.then(result => {
        let scripts = [      
            {script: '/js/redincredadmin.js'},       
            {script: '/lib/moment/min/moment.min.js'}        
        ];
        res.render('resursa-publica', {
            user:    req.user,
            title:   "RED public",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            resursa: result,
            scripts
        });
    }).catch(err => {
        if (err) {
            console.log(err);
        }
    });
});

module.exports = router;