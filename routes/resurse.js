const express        = require('express');
const router         = express.Router();

router.get('/resursepublice', function (req, res) {
    res.render('resursepublice', {
        title: "Resurse",
        logoimg: "img/rED-logo192.png",
    });
});

function verificaAuth (req, res, next) {
    next();
}

// TODO: Această rută are nevoie de autentificare
router.get('/resurse', verificaAuth, function (req, res) {
    console.log(req.user.roles);
    res.render('resurse', {
        title: "Resurse",
        logoimg: "/img/rED-logo192.png",
    });
});

router.get('/resurse/adauga', verificaAuth, function (req, res) {
    res.render('adauga-res', {
        title: "Adauga",
        logoimg: "/img/rED-logo192.png",
    });
});

module.exports = router;