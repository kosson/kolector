require('dotenv').config();
/* ==== DEPENDINȚE ==== */
const express = require('express');
const router  = express.Router();

// Pentru a prelucra cererile pe rute, este necesară încărcarea controlerului
const resurseCtrl = require('./controllers/resurse.ctrl');
// helper de caching
const cleanCache = require('./controllers/cacheClear.helper');

/* GET::/resurse */
// console.log(typeof(resurseCtrl.loadRootResources));
router.get('/', resurseCtrl.loadRootResources);

/* GET::/resurse/adauga - Pe această rută se obține formularul de adăugare a resurselor doar dacă ești logat, având rolurile menționate */
router.get('/adauga', cleanCache, resurseCtrl.describeResource);

/* GET::/resurse/:id */
router.get('/:id', resurseCtrl.loadOneResource);

module.exports = router;