require('dotenv').config();
/* ==== DEPENDINȚE ==== */
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
// Încarcă mecanismele de verificare ale rolurilor
let makeSureLoggedIn = require('connect-ensure-login');
let checkRole = require('./controllers/checkRole.helper');
const Resursa = require('../models/resursa-red'); // Adu modelul resursei
const esClient= require('../elasticsearch.config');

/* === PROFILUL PROPRIU === */
router.get('/', makeSureLoggedIn.ensureLoggedIn(), function clbkProfile (req, res) {
    res.render('profile', {
        user:    req.user,
        title:   "Profil",
        style:   "/lib/fontawesome/css/fontawesome.min.css",
        logoimg: "/img/red-logo-small30.png",
        credlogo: "../img/CREDlogo.jpg",
        activePrfLnk: true
    });
});

/* === ACCESAREA PROPRIILOR RESURSE === */
router.get('/resurse', makeSureLoggedIn.ensureLoggedIn(), function clbkProfRes (req, res) {
        var count = require('./controllers/resincred.ctrl')(req.user);
        count.then(result => {
            let newResultArr = []; // noul array al obiectelor resursă
            result.map(function clbkMapResult (obi) {
                obi.dataRo = moment(obi.date).locale('ro').format('LLL');
                newResultArr.push(obi);
            });

            let scripts = [       
                {script: '/lib/moment/min/moment.min.js'}
            ];

            res.render('resurse-profil', {
                user:    req.user,
                title:   "Profil",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                logoimg: "/img/red-logo-small30.png",
                credlogo: "../img/CREDlogo.jpg",
                resurse: newResultArr,
                scripts
            });
        }).catch(err => {
            if (err) throw err;
        });
    }
);

/* === VALIDARE / PUBLICARE /ȘTERGERE /EDITARE @ ->resursa -> resursa-admin [redincredadmin.js / res-shown.js] -> resursa-validator === */
router.get('/resurse/:idres', makeSureLoggedIn.ensureLoggedIn(), function clbkProfResID (req, res, next){
    // Adu înregistrarea resursei cu toate câmpurile referință populate deja
    // FIXME: verifică dacă există în Elasticsearch înregistrarea corespondentă, dacă nu folosește .esSynchronize() a lui mongoose-elasticsearch-xp

    // const editorJs2html = require('./controllers/editorJs2HTML');
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
        // {script: '/js/res-shown.js'},
        {script: '/js/redincredadmin.js'} 
    ];
    let roles = ["user", "cred", "validator"];
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    // adu înregistrarea din MongoDB după ce a fost încărcată o nouă resursă
    Resursa.findById(req.params.idres).populate({
        path: 'competenteS'
    }).exec().then(resursa => {
        // console.log(resursa); // asta e moartă: http://localhost:8080/profile/resurse/5e2714c84449b236ce450091
        /* === Resursa încă există în MongoDB === */
        if (resursa._id) {
            const obi = resursa;
        
            let localizat = moment(resursa.date).locale('ro').format('LLL');
            obi.dataRo = `${localizat}`; // formatarea datei pentru limba română.    
    
            // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client de date serializate]
            obi.editorContent = JSON.stringify(resursa);

            // Dacă nu este indexată în Elasticsearch deja de `mongoose-elasticsearch-xp`, indexează aici!
            esClient.exists({
                index: 'resursedus',
                id: req.params.idres
            }).then(resFromIdx => {
                /* DACĂ RESURSA NU ESTE INDEXATĂ, CORECTEAZĂ! */
                if(resFromIdx.body == false && resFromIdx.statusCode === 404){
                    resursa.esIndex(function clbkIdxOnDemand (err, res) {
                        console.log('Am indexat: ', res);
                        rre('mesaje', 'Pentru că nu am găsit înregistrarea în index, am reindexat-o');
                    }); //https://www.npmjs.com/package/mongoose-elasticsearch-xp#indexing-on-demand
                }
                return resFromIdx;
            }).catch(err => {
                console.log(err);
            });
            return obi;
        } else {
            // Caută resursa și în Elasticsearch. Dacă există indexată, dar a fost ștearsă din MongoDB, șterge-o din indexare / va apărea la căutare
            esClient.exists({
                index: 'resursedus',
                id: req.params.idres
            }).then(resFromIdx => {
                // console.log(resFromIdx);
                if(resFromIdx.statusCode !== 404){
                    esClient.delete({
                        id: req.params.idres,
                        index: 'resursedus'
                    }).then(dead => {
                        // console.log(dead);
                        rre('mesaje', `Resursa era încă indexată și am șters-o acum: (${dead.statusCode})`);
                    }).catch(err => {
                        rre('mesaje', `Am încercat să șterg din index, dar: ${err}`);
                    });                        
                }
                return resFromIdx;
            }).catch(err => {
                console.log(err);
            }).finally(function clbkFinalSearchIdx () {
                rre('mesaje', `Resursa nu mai există. Am căutat peste tot!`); // Trimite mesaj în client
            }); // http://localhost:8080/profile/resurse/5dc9602836fc7d626f4a5832
            
            return Promise.reject('Resursa nu mai există!'); // Rejectează promisiunea!
        };
    }).then(resursa => {
        /* === ADMIN === */
        if(req.session.passport.user.roles.admin){
            // Adaugă mecanismul de validare a resursei
            if (resursa.expertCheck) {
                resursa.validate = `<input type="checkbox" id="valid" class="expertCheck" checked>`;
            } else {
                resursa.validate = `<input type="checkbox" id="valid" class="expertCheck">`;
            }
            // Adaugă mecanismul de prezentare la public
            if (resursa.generalPublic) {
                resursa.genPub = `<input type="checkbox" id="public" class="generalPublic" checked>`;
            } else {
                resursa.genPub = `<input type="checkbox" id="public" class="generalPublic">`;
            }

            res.render('resursa-admin', {
                user:    req.user,
                title:   "Administrare RED",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                scripts,
                logoimg: "/img/red-logo-small30.png",
                credlogo: "../img/CREDlogo.jpg",
                resursa,
            });
        /* === VALIDATOR === */
        } else if (confirmedRoles.includes('validator')) {
            // Adaugă mecanismul de validare a resursei
            if (resursa.expertCheck) {
                resursa.validate = `<input type="checkbox" id="valid" class="expertCheck" checked>`;
            } else {
                resursa.validate = `<input type="checkbox" id="valid" class="expertCheck">`;
            }
            res.render('resursa-validator', {
                user:    req.user,
                title:   "Administrare RED",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                scripts,
                logoimg: "/img/red-logo-small30.png",
                credlogo: "../img/CREDlogo.jpg",
                resursa: resursa
            });
        } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
            res.render('resursa', {
                user:    req.user,
                title:   "Afișare RED",
                style:   "/lib/fontawesome/css/fontawesome.min.css",
                logoimg: "/img/red-logo-small30.png",
                credlogo: "../img/CREDlogo.jpg",
                resursa: resursa,
                scripts
            });
        } else {
            res.redirect('/401');
        }
    }).catch(err => {
        if (err) {
            // rre('mesaje', `Nu pot să afișez resursa. Este posibil să nu mai existe! Eroare: ${err}`);
            // next(); // fugi pe următorul middleware / rută
            res.redirect('/administrator/reds');
        }
    });
});

module.exports = router;