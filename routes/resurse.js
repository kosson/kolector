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

let checkRole = require('./controllers/checkRole.helper');
router.get('/resurse', verificaAuth, function (req, res) {
    // FIXME: DREPTURI ACL hardcodate. Constituie ceva centralizat!!!
    let roles = ["user"];
    //Adu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        res.render('resurse', {
            title: "Resurse",
            logoimg: "/img/rED-logo192.png",
        });
    } else if (confirmedRoles.length > 0) {
        res.render('resurse', {
            title: "Resurse",
            logoimg: "/img/rED-logo192.png",
        });
    } else {
        res.redirect('/401');
    }

    // console.log(req.user.roles);
    console.log(req.session.passport.user.roles); // { rolInCRED: [], unit: [], admin: true }
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