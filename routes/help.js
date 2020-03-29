require('dotenv').config();
const express = require('express');
const router  = express.Router();
// Încarcă mecanismele de verificare ale rolurilor
let makeSureLoggedIn = require('connect-ensure-login');
let checkRole = require('./controllers/checkRole.helper');

/* === Sistem de asistență - HELP === */
router.get('/', makeSureLoggedIn.ensureLoggedIn(), function clbkHelp (req, res) {
    res.render('help', {
        user:    req.user,
        title:   "Asistență",
        style:   "/lib/fontawesome/css/fontawesome.min.css",
        logoimg: "/img/red-logo-small30.png",
        credlogo: "../img/CREDlogo.jpg"
    });
});

module.exports = router;