require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();
const passport= require('passport');
// Încarcă controlerul necesar tratării rutelor de autentificare
const GAuth = require('./google-oauth20.ctrl')(passport);

// === /auth ===
router.get('/', GAuth.auth);

// === /auth/google ===
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email']}));

module.exports = router;