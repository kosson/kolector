require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();

/* === LOGOUT === */
router.get('/', function clbkLogout (req, res) {
    req.logout(); // metoda este pusă la dispoziție de Passport. Distruge res.session.passport.user
    req.session.destroy(function clbkDestr (err) {
        if (err) throw new Error('A apărut o eroare la logout: ', err);
        res.redirect('/');
    });
});

module.exports = router;