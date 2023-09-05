require('dotenv').config();
const config = require('config');

// DEPENDINȚE
const express     = require('express');
const router      = express.Router();

// HELPERE
const logger      = require('../util/logger');

// CONTROLLERS
let index = require('./controllers/index.ctrl');

/* === LANDING :: / === */
router.get('/', (req, res, next) => {
    index.renderPublic(req, res, next).catch((error) => {
        console.log(error);
        logger.error(error);
        next(error);
    });
});

router.get('/:id', (req, res, next) => {
    index.renderOnePublic(req, res, next).catch((error) => {
        console.log(error);
        logger.error(error);
        next(error);
    });
});

module.exports = router;