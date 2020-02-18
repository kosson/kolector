const router = require('express').Router();

// ========== VERIFICAREA ROLURILOR ==========
let checkRole = require('./controllers/checkRole.helper');

router.get('/', function (req, res) {
    // ACL
    let roles = ["admin", "validator"];
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        let scripts = [
            {script: '/js/admin.js'},       
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/timeline/timeline-embed.js'}
        ];
        res.render('administrator', {
            title:   "administrator",
            user:    req.user,
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            scripts
        });
    // Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public
    } else if (confirmedRoles.includes('validator')) {
        let scripts = [
            {script: '/js/validator.js'},       
            {script: '/lib/moment/min/moment.min.js'}
        ];
        res.render('validator', {
            title:   "validator",
            user:    req.user,
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            scripts
        });
    } else {
        res.redirect('/401');
    }
});

router.get('/admins', function (req, res) {
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        let scripts = [    
            {script: '/js/redincredadmin.js'},       
            {script: '/lib/moment/min/moment.min.js'}        
        ];
        // TODO: Adu toți utilizatorii care au rangul de admin
        res.render('administrator', {
            title:   "administrator",
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            user:    req.user,
            scripts,
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
        });
    } else {
        res.redirect('/401');
    }
});

module.exports = router;