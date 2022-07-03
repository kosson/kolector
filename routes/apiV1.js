require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();
const passport= require('passport');
require('./controllers/user.ctrl')(passport); // încarcă strategiile

// Cere gestionarul pentru versiunea 1
let {getREDs, getRED, postRED, putRED, delRED, currentUser, loginUser} = require('./api/v1');

router
    .get('/user/current', passport.authenticate('jwt', {session: false}), currentUser)
    .post('/user/login', passport.authenticate('local'), loginUser);

router
    .route('/')
    .get(getREDs)
    .post(postRED);

router
    .route('/:id', passport.authenticate('jwt', {session: false}))
    .get(getRED)
    .post(postRED)
    .put(putRED)
    .delete(delRED);

module.exports = router;