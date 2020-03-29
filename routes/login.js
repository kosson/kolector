require('dotenv').config();
/* ==== DEPENDINȚE ==== */
const express = require('express');
const router  = express.Router();
const passport= require('passport');
// Încarcă controlerul necesar tratării rutelor de autentificare
const UserPassport = require('./controllers/user.ctrl')(passport);

// ========== LOGIN ==========
router.get('/', UserPassport.login);
router.post('/', passport.authenticate('local-login', {
    successRedirect: '/', // redirectează userul logat cu succes către pagina de landing
    failureRedirect: '/login'    // dacă a apărut o eroare, reîncarcă userului pagina de login TODO: Fă să apară un mesaj de eroare!!!
}));

module.exports = router;