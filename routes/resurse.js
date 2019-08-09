const express = require('express');
const router  = express.Router();

// ========== RESURSE PUBLICE ==========
/* ========== GET */
router.get('/resursepublice', function (req, res) {
    res.render('resursepublice', {
        title: "R.E.D.",
        logoimg: "img/rED-logo192.png",
    });
});

// ========== RESURSE ==========
let checkRole = require('./controllers/checkRole.helper');
/* ========== GET */
// Cere helperul `checkRole` cu care verifică dacă există rolurile necesare accesului
router.get('/resurse', function (req, res) {
    // ACL
    let roles = ["user"];   //FIXME: DREPTURI ACL hardcodate. Constituie ceva centralizat!!!
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    if(req.session.passport.user.roles.admin){
        // Dacă avem un admin, atunci oferă acces neîngrădit
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

/* ========== GET - Pe această rută se obține formularul de adăugare a resurselor doar dacă ești logat, având rolurile menționate */
// Cere helperul `checkRole`
router.get('/resurse/adauga', function (req, res) {
    let scripts = [{script: '/js/json2form.js'}];
    let roles = ["user", "educred", "validator"];
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    if(req.session.passport.user.roles.admin){
        // Dacă avem un admin, atunci oferă acces neîngrădit
        res.render('adauga-res', {
            user:    req.user,
            title:   "Adauga",
            logoimg: "/img/rED-logo192.png",
            scripts
        });
    } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
        res.render('adauga-res', {
            title: "Adauga",
            logoimg: "/img/rED-logo192.png",
            scripts
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