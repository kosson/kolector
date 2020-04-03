/* ==== DEPENDINȚE ==== */
const moment  = require('moment');
const express = require('express');
const router  = express.Router();
/* ==== MODELE ==== */
const Resursa = require('../models/resursa-red'); // Adu modelul resursei

/* ==== HELPERE  ==== */
// Cere helperul `checkRole` cu care verifică dacă există rolurile necesare accesului
let editorJs2html = require('./controllers/editorJs2HTML');

/* GET::/tertium/:id - Pe această rută se obține formularul de adăugare a resurselor doar dacă ești logat, având rolurile menționate */
router.get('/:id', function tertiumResource (req, res, next) {
    let scripts = [
        {script: '/lib/moment/min/moment.min.js'},
        {script: '/lib/editorjs/editor.js'},
        {script: '/lib/editorjs/header.js'},
        {script: '/lib/editorjs/paragraph.js'},
        {script: '/lib/editorjs/list.js'},
        {script: '/lib/editorjs/image.js'},
        {script: '/lib/editorjs/table.js'},
        {script: '/lib/editorjs/attaches.js'},
        {script: '/lib/editorjs/embed.js'},
        {script: '/lib/editorjs/code.js'},
        {script: '/lib/editorjs/quote.js'},
        {script: '/lib/editorjs/inlinecode.js'},
        {script: '/js/tertium.js'} 
    ];
    Resursa.findById(req.params.id).populate({
        path: 'competenteS'
    }).exec().then(resursa => {
        /* === Resursa încă există în MongoDB === */
        const obi = resursa;
        
        let localizat = moment(resursa.date).locale('ro').format('LLL');
        obi.dataRo = `${localizat}`; // formatarea datei pentru limba română.    

        // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client de date serializate]
        obi.editorContent = JSON.stringify(resursa);
        return obi;
    }).then(resursa => {
        if (resursa) {
            // Adaugă mecanismul de validare a resursei
            if (resursa.expertCheck) {
                resursa.validate = `<input type="checkbox" id="valid" class="expertCheck" checked>`;
            } else {
                resursa.validate = `<input type="checkbox" id="valid" class="expertCheck">`;
            }
            res.render('resursa-tertium', {
                user:    req.user,
                title:   "Administrare RED",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                scripts,
                logoimg: "/img/red-logo-small30.png",
                credlogo: "../img/CREDlogo.jpg",
                csfrToken: req.csrfToken(),
                resursa: resursa
            });
        } else {
            res.redirect('/401');
        };
    }).catch(err => {
        if (err) {
            res.redirect('/');
        }
    });
});

module.exports = router;