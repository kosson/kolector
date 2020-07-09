require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();
const passport= require('passport');
    
// RUTA PE CARE VINE RĂSPUNSUL SERVERULUI DE AUTORIZARE
router.get('/', passport.authenticate('google', { failureRedirect: '/auth'}), function(req, res) {
    res.redirect('/');
});

module.exports = router;