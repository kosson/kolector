require('dotenv').config();
const express = require('express');
const router  = express.Router();
let makeSureLoggedIn = require('connect-ensure-login');
let checkRole = require('./controllers/checkRole.helper');

router.get('/', makeSureLoggedIn.ensureLoggedIn(), function clbkInTools (req, res) {

});

module.exports = router;