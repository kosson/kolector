const express = require('express');
const router  = express.Router();

router.get('/', function (req, res, next) {
    res.render('index', {
        title:   "RED colector",
        logoimg: "img/rED-logo192.png",
        user:    req.user
    });
});

module.exports = router;