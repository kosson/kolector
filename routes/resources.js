require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();
const logger  = require('../util/logger');
let archiveRED   = require('./controllers/archiveRED');

// Pentru a prelucra cererile pe rute, este necesară încărcarea controlerului
const resurseCtrl = require('./controllers/resurse.ctrl');
// helper de caching
const cleanCache = require('./controllers/cacheClear.helper');

/* GET::/resources/exposed */
router.get('/exposed', (req, res, next) => {
    resurseCtrl.exposed(req, res, next).catch((error) => {
        logger.error(error);
        next(error);
    });
    // res.status(200).json({"message": "OK"});
});

/* GET::/resurse/adauga - Pe această rută se obține formularul de adăugare a resurselor doar dacă ești logat, având rolurile menționate */
// router.get('/adauga', cleanCache, resurseCtrl.describeResource);
router.get('/adauga', (req, res, next) => {
    resurseCtrl.resourcesPool(req, res, next).catch((error) => {
        console.log(error);
        logger.error(error);
        next(error);
    });
});

/* GET::/resurse/adauga/monografie - Adaugă o monografie */
router.get('/adauga/monografie', (req, res, next) => {
    resurseCtrl.describeBFMonograph(req, res, next).catch((error) => {
        console.log(error);
        logger.error(error);
        next(error);
    });
});

/* GET::/resources/adauga/red - Adaugă resurse educaționale deschise */
router.get('/adauga/red', (req, res, next) => {
    resurseCtrl.describeRED(req, res, next).catch((error) => {
        logger.error(error);
        next(error);
    });
});

/* ÎNCARCĂ O SINGURĂ RESURSĂ GET::/resources/:id */
router.get('/:id', (req, res, next) => {
    resurseCtrl.loadOneResource(req, res, next).catch((error) => {
        console.log(error);
        logger.error(error);
        next(error);
    });
});

/* === DESCĂRCARE ZIP === */
router.get('/:id/zip', (req, res, next) => {
    archiveRED(req, res, next);
});

module.exports = router;