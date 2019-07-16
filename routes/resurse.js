const express        = require('express');
const router         = express.Router();

function verificaAuth (req, res, next) {
    next();
}

// TODO: Această rută are nevoie de autentificare
router.get('/resurse', verificaAuth, function (req, res) {
    res.render('resurse', {
        title: "Resurse",
        logoimg: "img/rED-logo192.png",
    });
});

router.get('/resurse/adauga', verificaAuth, function (req, res) {
    res.render('adauga-res', {
        title: "Adauga",
        logoimg: "/img/rED-logo192.png",
    });
});

module.exports = router;