require('dotenv').config();
const express  = require('express');
const router   = express.Router();
const moment   = require('moment');
const Resursa  = require('../models/resursa-red'); // Adu modelul resursei

/* === LANDING :: / === */
router.get('/', function clbkRootRoute (req, res, next) {

    // let localizat = moment(result.date).locale('ro').format('LLL');
    // result.dataRo = `${localizat}`; // formatarea datei pentru limba română.

    Resursa.where({'generalPublic': true}).countDocuments(function cbCountResPub (err, count) {
        if (err) throw err;
        // console.log('Numărul resurselor este: ', count);
    });

    // creează Promise
    let resursePublice = Resursa.find({'generalPublic': true}).sort({"date": -1}).limit(8);

    resursePublice.exec().then((result) => {
        let newResultArr = [];

        result.map(function clbkMapResult (obi) {
            const newObi = Object.assign({}, obi._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
            // https://github.com/wycats/handlebars.js/blob/master/release-notes.md#v460---january-8th-2020
            newObi.dataRo = moment(newObi.date).locale('ro').format('LLL');
            newResultArr.push(Object.assign(newObi));
        });
        
        let scripts = [
            //JQUERY
            {script: '/lib/npm/jquery.slim.min.js'},
            {script: '/lib/npm/jquery.waypoints.min.js'},
            // MOMENT.JS
            {script: '/lib/npm/moment-with-locales.min.js'}, 
            // FONTAWESOME
            {script: '/lib/npm/all.min.js'},
            // HOLDERJS
            {script: '/lib/npm/holder.min.js'},            
            {script: '/lib/npm/bootstrap.bundle.min.js'},
            {script: '/js/custom.js'}
        ];

        let modules = [
            {module: '/lib/npm/popper.min.js'},
            // {module: '/js/main.mjs'},
            {module: '/js/indexpub.mjs'}
        ];

        let styles = [
            {style: '/lib/npm/all.min.css'}
        ];
    
        res.render('index', {
            title:       "Acasă",
            user:        req.user,
            language:    "ro",
            creator:     process.env.CREATOR,
            publisher:   process.env.PUBLISHER,
            brandname:   process.env.BRAND_NAME,
            description: process.env.DESCRIPTION,
            contact:     process.env.CONTACT,
            logoimg:     "img/" + process.env.LOGO,            
            resurse:     newResultArr,
            csrfToken:   req.csrfToken(),
            modules,
            scripts,
            styles
        });
    }).catch((err) => {
        if (err) throw err;
        next(err);
    });
});

module.exports = router;