const express        = require('express');
const router         = express.Router();

router.get('/login', function (req, res) {
    res.render('login', {
        title: "login",
        logoimg: "img/rED-logo192.png",
        credlogo: "img/CREDlogo.jpg"
    });
});

module.exports = router;