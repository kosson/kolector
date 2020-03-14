const express  = require('express');
const router   = express.Router();
const moment   = require('moment');

router.get('/', function (req, res, next) {
    // let localizat = moment(result.date).locale('ro').format('LLL');
    // result.dataRo = `${localizat}`; // formatarea datei pentru limba română.
    
    let scripts = [       
        {script: '/lib/moment/min/moment.min.js'}
    ];
    res.render('gform-catalog-res', {
        title:   "RED colector",
        style:   "/lib/fontawesome/css/fontawesome.min.css",
        logoimg: "img/rED-logo192.png",
        user:    req.user,
        scripts
    });
});

module.exports = router;