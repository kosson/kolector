const express = require('express');
const router  = express.Router();

router.get('/', function (req, res, next) {
    res.render('index', {
        title:   "RED colector",
        style:   "/lib/fontawesome/css/fontawesome.min.css",
        logoimg: "img/rED-logo192.png",
        user:    req.user
    });
});

module.exports = router;