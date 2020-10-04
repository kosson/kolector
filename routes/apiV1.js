require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');

// Cere gestionarul pentru versiunea 1
let {getResources, getResource, postResource, putResource, delResource} = require('./api/v1');

router
    .route('/')
    .get(getResources)
    .post(getResource);

router
    .route('/:id')
    .get(getResource)
    .put(putResource)
    .delete(delResource);

module.exports = router;