const express = require('express');
const router  = express.Router();

router.get('/resursepublice', function (req, res) {
    res.render('resursepublice', {
        title: "Resurse",
        logoimg: "img/rED-logo192.png",
    });
});

let checkRole = require('./controllers/checkRole.helper');
router.get('/resurse', function (req, res) {
    // FIXME: DREPTURI ACL hardcodate. Constituie ceva centralizat!!!
    let roles = ["user"];
    //Adu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        res.render('resurse', {
            user:    req.user,
            title:   "Resurse",
            logoimg: "/img/rED-logo192.png",
        });
    } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
        res.render('resurse', {
            user:    req.user,
            title:   "Resurse",
            logoimg: "/img/rED-logo192.png",
        });
    } else {
        res.redirect('/401');
    }
    // console.log(req.session.passport.user.roles); // { rolInCRED: [], unit: [], admin: true }
});

// Pe această rute se pot obține formularul de adăugare a resurselor doar dacă ești logat, având rolurile menționate
router.get('/resurse/adauga', function (req, res) {
    let roles = ["user", "educred", "validator"];
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        res.render('adauga-res', {
            title: "Adauga",
            logoimg: "/img/rED-logo192.png",
        });
    } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
        res.render('adauga-res', {
            title: "Adauga",
            logoimg: "/img/rED-logo192.png",
        });
    } else {
        res.redirect('/401');
    }
});

// router.get('/resurse/:id', function (req, res) {
//     res.render('resursa', {
//         title: "Resursa",
//         logoimg: "/img/rED-logo192.png",
//     });
// });

module.exports = router;