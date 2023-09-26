require('dotenv').config();
const express = require('express');
const router  = express.Router();

/* === DEPENDINȚE === */
const moment       = require('moment');
const crypto       = require('crypto');
const logger       = require('../util/logger');

/* === MODELE === */
const Resursa     = require('../models/resursa-red');        // Adu modelul resursei
const Mgmtgeneral = require('../models/MANAGEMENT/general'); // Adu modelul management

/* === HELPERE === */
let getStructure  = require('../util/es7');

// INDECȘII ES7
let RES_IDX_ES7 = '', RES_IDX_ALS = '', USR_IDX_ES7 = '', USR_IDX_ALS = '';
getStructure().then((val) => {
    // console.log(`Am obținut `, val);
    USR_IDX_ALS = val.USR_IDX_ALS;
    USR_IDX_ES7 = val.USR_IDX_ES7;
    RES_IDX_ALS = val.RES_IDX_ALS;
    RES_IDX_ES7 = val.RES_IDX_ES7;
}).catch((error) => {
    console.log(`[resurse.ctrl.js::getStructure] nu a adus datele`, error);
    logger.error(error);
});

// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

// === TAGS ===
router.get('/:tag', async (req, res) => {
    // Setări în funcție de template
    let filterMgmt = {focus: 'general'};
    let gensettings = await Mgmtgeneral.findOne(filterMgmt);

    let scripts = [
        // MOMENT.JS
        {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
        // HOLDER.JS
        // {script: `${gensettings.template}/lib/npm/holder.min.js`},
        // HELPER DETECT URLS or PATHS
        {script: `${gensettings.template}/js/check4url.js`},
        // DOWNLOADFILE
        {script: `${gensettings.template}/lib/downloadFile.js`}
    ];

    let modules = [
        // JQuery
        {module: `${gensettings.template}/lib/npm/jquery.min.js`},
        // Toast
        {module: `${gensettings.template}/lib/npm/jquery.toast.min.js`},
        // LOCALE
        {module: `${gensettings.template}/js/tag.mjs`}           
    ];

    let searchObi = {
        'expertCheck': 'true', 
        etichete: {
            '$in': [req.params.tag]
        }
    };

    let total = await Resursa.where(searchObi).countDocuments();
    // console.log(`numărul total de resurse cu eticheta ${req.params.tag} este `, total);
    
    let rescueticheta = Resursa.find(searchObi).sort({"date": -1}); // Caută resursele care au eticheta menționată.

    rescueticheta.then((result) => {

        let fullstar = `<i class="bi bi-star-fill"></i>`,
            emptystart = `<i class="bi bi-star"></i>`,
            halfempty = `<i class="bi bi-star-half"></i>`;

        let newResultArr = result.map(function clbkMapResult (obi) {
            const newObi = Object.assign({}, obi._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
            // https://github.com/wycats/handlebars.js/blob/master/release-notes.md#v460---january-8th-2020
            newObi.dataRo = moment(obi.date).locale('ro').format('LLL');
            // introdu template-ul ca proprietare (necesar stabilirii de linkuri corecte in fiecare element afișat în client)
            newObi.template = `${gensettings.template}`;
            newObi.logo = `${LOGO_IMG}`; // _FIXME: http://localhost:8080/tag/img/repoloxgo.png DE NEGĂSIT

            newObi.ratingrepresentation = '';
            let kontor = newObi.contorRating ?? 0;
            let lastRating = newObi.rating ?? 0;
            let ratingTotal = newObi.ratingTotal ?? 0;
            let presentRating = ratingTotal / kontor;

            // 0 - 0.5 | 0.5 - 1 | 1 - 1.5 | 1.5 - 2 | 2 - 2.5 | 2.5 - 3 | 3 - 3.5 | 3.5 - 4 | 4 - 4.5 | 4.5 - 5
            if (isNaN(presentRating)) {
                newObi.ratingrepresentation = `${emptystart}${emptystart}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 0 && presentRating < 0.5) {
                newObi.ratingrepresentation = `${halfempty}${emptystart}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 0.6 && presentRating <= 1) {
                newObi.ratingrepresentation = `${fullstar}${emptystart}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 1 && presentRating <= 1.5) {
                newObi.ratingrepresentation = `${fullstar}${halfempty}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 1.6 && presentRating <= 2) {
                newObi.ratingrepresentation = `${fullstar}${fullstar}${emptystart}${emptystart}${emptystart}`;
            } else if (presentRating > 2 && presentRating <= 2.5) {
                newObi.ratingrepresentation = `${fullstar}${fullstar}${halfempty}${emptystart}${emptystart}`;
            } else if (presentRating > 2.6 && presentRating <= 3) {
                newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${emptystart}${emptystart}`;
            } else if (presentRating > 3 && presentRating <= 3.5) {
                newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${halfempty}${emptystart}`;
            } else if (presentRating > 3.6 && presentRating <= 4) {
                newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${emptystart}`;
            } else if (presentRating > 4 && presentRating <= 4.5) {
                newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${halfempty}`;
            } else if (presentRating > 4.6 && presentRating <= 5) {
                newObi.ratingrepresentation = `${fullstar}${fullstar}${fullstar}${fullstar}${fullstar}`;
            }
            // newResultArr.push(newObi);
            return newObi;
        });

        let user = req.user;
        let csrfToken = req.csrfToken();

        res.render(`tag_${gensettings.template}`, {
            template:     `${gensettings.template}`,
            title:        req.params.tag,
            user,
            logoimg:      `${gensettings.template}/${LOGO_IMG}`,
            csrfToken,
            resurse:      newResultArr,
            activeResLnk: true,
            resIdx:       RES_IDX_ES7,
            scripts,
            modules,
            creator: gensettings.creator,
            publisher: gensettings.publisher,
            brandname: gensettings.brand,
            description: gensettings.description,
            publisher: gensettings.publisher,
            author: gensettings.contact
        });
    }).catch((err) => {
        if (err) {
            console.log(JSON.stringify(err.body, null, 2));
            logger.error(err);
            next(err);
        }
    });
});
    
module.exports = router;