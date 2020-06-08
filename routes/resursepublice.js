require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();
const moment  = require('moment');
const Resursa = require('../models/resursa-red'); // Adu modelul resursei
var content2html = require('./controllers/editorJs2HTML');

// Indexul de căutare
let idxRes = process.env.RES_IDX_ALS;

// === RESURSE PUBLICE ===
router.get('/', (req, res) => {
    Resursa.where({'generalPublic': true}).countDocuments(function cbCountResPub (err, count) {
        if (err) throw err;
        // console.log('Numărul resurselor este: ', count);
    });

    let resursePublice = Resursa.find({'generalPublic': 'true'}).sort({"date": -1}).limit(8);
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

        res.render('resursepublice', {
            title:        "Resurse publice",
            style:        "/lib/fontawesome/css/fontawesome.min.css",
            logoimg:      "img/rED-logo192.png",
            csfrToken:    req.csrfToken(),
            user:         req.user,
            resurse:      newResultArr,
            activeResLnk: true,
            resIdx:       idxRes,
            scripts
        });
    }).catch((err) => {
        if (err) throw err;
    });
});

router.get('/:id', (req, res) => {
    let query = Resursa.findById(req.params.id).populate({path: 'competenteS'});
    query.then(resursa => {
        let scripts = [      
            {script: '/js/redincredadmin.js'},       
            {script: '/lib/moment/min/moment.min.js'}        
        ];
        
        if (resursa !== null) {

            // transformă obiectul document de Mongoose într-un obiect normal.
            const newObi = Object.assign({}, resursa._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is

            // https://github.com/wycats/handlebars.js/blob/master/release-notes.md#v460---january-8th-2020
            newObi.dataRo = moment(newObi.date).locale('ro').format('LLL');
            newObi.content = content2html(resursa.content);
            // obiectul competenței specifice cu toate datele sale trebuie curățat.
            newObi.competenteS = newObi.competenteS.map(obi => {
                return Object.assign({}, obi._doc);
            });
            // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client de date serializate]
            newObi.editorContent = JSON.stringify(resursa);
            
            // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
            res.render('resursa-publica', {
                user:      req.user,
                title:     "RED public",
                style:     "/lib/fontawesome/css/fontawesome.min.css",
                logoimg:   "/img/red-logo-small30.png",
                credlogo:  "../img/CREDlogo.jpg",
                csfrToken: req.csrfToken(),
                resursa:   newObi,
                scripts
            });
        } else {
            console.log(`Nu a putut fi adusă resursa!`);
        }
    }).catch(err => {
        if (err) {
            console.log(err);
        }
    });
});

module.exports = router;