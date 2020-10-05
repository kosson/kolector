require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();

/* === LOGOUT === */
router.get('/', function clbkLogout (req, res) {
    req.logout(); // în momentul acesta `passport` șterge datele din proprietatea `passport` a obiectului `req.session`; de ex: passport: {user: dso8fs89afds998fsda} va fi passport:{}.
    req.session.destroy(function clbkDestr (err) {
        if (err) throw new Error('A apărut o eroare la logout: ', err);
        res.redirect('/');
    });
});

module.exports = router;