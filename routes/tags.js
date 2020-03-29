require('dotenv').config();
const express = require('express');
const router  = express.Router();

// ========== TAGS ===================
router.get('/:tag', (req, res) => {
    let params = req.params.trim();
    var records = require('./controllers/tag.ctrl')(params); // aduce toate resursele care au tagul asociat
});
    
module.exports = router;