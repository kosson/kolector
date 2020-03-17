const router = require('express').Router();
const Resursa = require('../models/resursa-red');

// === VERIFICAREA ROLURILOR ===
let checkRole = require('./controllers/checkRole.helper');

/* === /administrator @->administrator === */
router.get('/', function clbkAdmRoot (req, res) {
    // ACL
    let roles = ["admin", "validator"];
    
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    /* === VERIFICAREA CREDENȚIALELOR === */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        let scripts = [       
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/moment/locale/ro.js'},    
            {script: '/lib/datatables.net/js/jquery.dataTables.min.js'},
            {script: '/lib/datatables.net/js/dataTables.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/dataTables.select.min.js'},
            {script: '/lib/datatables.net-buttons/js/dataTables.buttons.min.js'},
            {script: '/lib/datatables.net-buttons/js/buttons.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/select.bootstrap.min.js'},
            {script: '/lib/datatables.net-responsive/js/dataTables.responsive.min.js'},
            {script: '/lib/datatables.net-responsive-dt/js/dataTables.responsive.min.js'},
            {script: '/js/admin.js'}
        ];
        let styles = [
            {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
            {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
        ];
        res.render('administrator', {
            title:   "administrator",
            user:    req.user,
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            scripts,
            styles,
            activeAdmLnk: true
        });
    // Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public
    } else if (confirmedRoles.includes('validator')) {
        let scripts = [
            {script: '/js/validator.js'},       
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/timeline3/js/timeline.js'}
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

router.get('/reds', function clbkAdmReds (req, res) {
    // ACL
    let roles = ["admin", "validator"];
    
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        let scripts = [       
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/moment/locale/ro.js'},    
            {script: '/lib/datatables.net/js/jquery.dataTables.min.js'},
            {script: '/lib/datatables.net/js/dataTables.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/dataTables.select.min.js'},
            {script: '/lib/datatables.net-buttons/js/dataTables.buttons.min.js'},
            {script: '/lib/datatables.net-buttons/js/buttons.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/select.bootstrap.min.js'},
            {script: '/lib/datatables.net-responsive/js/dataTables.responsive.min.js'},
            {script: '/lib/datatables.net-responsive-dt/js/dataTables.responsive.min.js'},
            {script: '/js/res-visuals.js'}
        ];
        let styles = [
            {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
            {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
        ];
        res.render('reds-data-visuals', {
            title:   "REDs data visuals",
            user:    req.user,
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            scripts,
            styles,
            activeAdmLnk: true
        });
    // Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public
    } else {
        res.redirect('/401');
    }
});

router.get('/users', function clbkAdmUsr (req, res) {
    // ACL
    let roles = ["admin", "validator"];
    
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        let scripts = [
            {script: '/lib/fontawesome/js/all.js'},
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/moment/locale/ro.js'},            
            // DATATABLES
            {script: '/lib/datatables.net/js/jquery.dataTables.min.js'},
            {script: '/lib/datatables.net/js/dataTables.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/dataTables.select.min.js'},
            {script: '/lib/datatables.net-buttons/js/dataTables.buttons.min.js'},
            {script: '/lib/datatables.net-buttons/js/buttons.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/select.bootstrap.min.js'},
            {script: '/lib/datatables.net-responsive/js/dataTables.responsive.min.js'},
            {script: '/lib/datatables.net-responsive-dt/js/dataTables.responsive.min.js'},

            {script: '/js/users-visuals.js'}
        ];
        let styles = [
            {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
            {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
        ];
        res.render('users-data-visuals', {
            title:   "User data visuals",
            user:    req.user,
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            scripts,
            styles,
            activeAdmLnk: true
        });
    // Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public
    } else {
        res.redirect('/401');
    }
});

router.get('/users/:id', function clbkAdmRoot (req, res) {
    // ACL
    let roles = ["admin", "validator"];
    
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    /* === VERIFICAREA CREDENȚIALELOR === */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        let scripts = [       
            {script: '/lib/fontawesome/js/all.js'},
            {script: '/lib/timeline3/js/timeline.js'},
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/moment/locale/ro.js'},            
            // DATATABLES
            {script: '/lib/datatables.net/js/jquery.dataTables.min.js'},
            {script: '/lib/datatables.net/js/dataTables.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/dataTables.select.min.js'},
            {script: '/lib/datatables.net-buttons/js/dataTables.buttons.min.js'},
            {script: '/lib/datatables.net-buttons/js/buttons.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/select.bootstrap.min.js'},
            {script: '/lib/datatables.net-responsive/js/dataTables.responsive.min.js'},
            {script: '/lib/datatables.net-responsive-dt/js/dataTables.responsive.min.js'},
            {script: '/js/user.js'}
        ];
        let styles = [
            {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
            {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
        ];
        res.render('user-admin', {
            title:   "fișa user",
            user:    req.user,
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            scripts,
            styles,
            activeAdmLnk: true
        });
    // Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public
    } else if (confirmedRoles.includes('validator')) {
        let scripts = [
            {script: '/lib/fontawesome/js/all.js'},
            {script: '/lib/timeline3/js/timeline.js'},
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/moment/locale/ro.js'},            
            // DATATABLES
            {script: '/lib/datatables.net/js/jquery.dataTables.min.js'},
            {script: '/lib/datatables.net/js/dataTables.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/dataTables.select.min.js'},
            {script: '/lib/datatables.net-buttons/js/dataTables.buttons.min.js'},
            {script: '/lib/datatables.net-buttons/js/buttons.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/select.bootstrap.min.js'},
            {script: '/lib/datatables.net-responsive/js/dataTables.responsive.min.js'},
            {script: '/lib/datatables.net-responsive-dt/js/dataTables.responsive.min.js'},
            {script: '/js/validator.js'},
        ];
        let styles = [
            {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
            {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
        ];
        res.render('validator', {
            title:   "validator",
            user:    req.user,
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            scripts,
            styles
        });
    } else {
        res.redirect('/401');
    }
});

module.exports = router;