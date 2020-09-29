require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();

// Cere gestionarul pentru versiunea 1
let {getREDs, getRED, postRED, putRED, delRED} = require('./api/v1');

router
    .route('/')
    .get(getREDs)
    .post(postRED);

router
    .route('/:id')
    .get(getRED)
    .put(putRED)
    .delete(delRED);

module.exports = router;