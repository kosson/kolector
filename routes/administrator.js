const express        = require('express');
const router         = express.Router();

router.get('/administrator', function (req, res) {
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        res.render('administrator', {
            title:   "administrator",
            user:    req.user,
            logoimg: "img/rED-logo192.png",
            credlogo: "img/CREDlogo.jpg"
        });
    } else {
        res.redirect('/401');
    }
});

router.get('/administrator/admins', function (req, res) {
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){

        // TODO: Adu toți utilizatorii care au rangul de admin
        res.render('administrator', {
            title:   "administrator",
            user:    req.user,
            logoimg: "img/rED-logo192.png",
            credlogo: "img/CREDlogo.jpg"
        });
    } else {
        res.redirect('/401');
    }
});

module.exports = router;