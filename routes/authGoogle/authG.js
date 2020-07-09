require('dotenv').config();
/* ==== DEPENDINȚE ==== */
const express = require('express');
const router  = express.Router();
const passport= require('passport');
// Încarcă controlerul necesar tratării rutelor de autentificare
const UserPassport = require('../controllers/user.ctrl')(passport);

// === AUTH ===
router.get('/', UserPassport.auth); // Încarcă template-ul hbs pentru afișarea butonului de autorizare

// AUTH/GOOGLE -> RUTA BUTONULUI CATRE SERVERUL DE AUTORIZARE (trebuie să ai deja ClientID și Secretul)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email']}));

module.exports = router;