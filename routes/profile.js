require('dotenv').config();
/* ==== DEPENDINȚE ==== */
const util     = require('util');
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const moment   = require('moment');
const redisClient= require('../redis.config');
// Încarcă mecanismele de verificare ale rolurilor
let makeSureLoggedIn = require('connect-ensure-login');
let checkRole = require('./controllers/checkRole.helper');
// MODELE
const Resursa = require('../models/resursa-red'); // Adu modelul resursei
// CONFIGURARI ACCES SERVICII
const esClient= require('../elasticsearch.config');
// HELPERI
const ES7Helper= require('../models/model-helpers/es7-helper');
let content2html  = require('./controllers/editorJs2HTML');


/* === PROFILUL PROPRIU === */
router.get('/', makeSureLoggedIn.ensureLoggedIn(), function clbkProfile (req, res) {
    res.render('profile', {
        user:         req.user,
        title:        "Profil",
        style:        "/lib/fontawesome/css/fontawesome.min.css",
        logoimg:      "/img/red-logo-small30.png",
        credlogo:     "../img/CREDlogo.jpg",
        csfrToken:    req.csrfToken(),
        activePrfLnk: true
    });
});

/* === ACCESAREA PROPRIILOR RESURSE === */
router.get('/resurse', makeSureLoggedIn.ensureLoggedIn(), function clbkProfRes (req, res) {
        // var count = require('./controllers/resincred.ctrl')(req.user);
        var count = Resursa.find({idContributor: req.user._id}).sort({"date": -1}).limit(8).then((resurse) => {
            // console.log("[profile::/resurse] Numărul resurselor aduse cu `resincred.ctrl.js` este ", resurse.length);
            return resurse;
        });
        
        // Promisiunea returnată (`find`). 
        count.then((result) => {

            // transformă documentele Mongoose în POJOs
            let newResultArr = result.map(function clbkMapResult (obi) {
                const newObi = Object.assign({}, obi._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
                // https://github.com/wycats/handlebars.js/blob/master/release-notes.md#v460---january-8th-2020
                newObi.dataRo = moment(obi.date).locale('ro').format('LLL');
                // newResultArr.push(newObi);
                return newObi;
            });

            /* === RANDEAZĂ RESURSELE ÎN PROFIL === */
            let scripts = [       
                {script: '/lib/moment/min/moment.min.js'},
                {script: '/lib/moment/locale/ro.js'},    
                {script: '/lib/datatables.net/js/jquery.dataTables.min.js'},
                {script: '/lib/datatables.net/js/dataTables.bootstrap.min.js'},
                {script: '/lib/datatables.net-select/js/dataTables.select.min.js'},
                {script: '/lib/datatables.net-buttons/js/dataTables.buttons.min.js'},
                {script: '/lib/datatables.net-buttons/js/buttons.bootstrap.min.js'},
                {script: '/lib/datatables.net-select/js/select.bootstrap.min.js'},
                {script: '/lib/datatables.net-responsive/js/dataTables.responsive.min.js'},
                {script: '/lib/datatables.net-responsive-dt/js/dataTables.responsive.min.js'},
                {script: '/js/res-visuals-user.js'}
            ];

            let styles = [
                {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
                {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
            ];

            res.render('resurse-profil', {
                user:      req.user,
                title:     "Profil",
                style:     "/lib/fontawesome/css/fontawesome.min.css",
                logoimg:   "/img/red-logo-small30.png",
                credlogo:  "../img/CREDlogo.jpg",
                csfrToken: req.csrfToken(),
                resurse:   newResultArr,
                scripts,
                styles,
                activeAdmLnk: true
            });
        }).catch((error) => {
            console.error(error);
        });
    }
);

/* === VALIDARE / PUBLICARE /ȘTERGERE /EDITARE @ ->resursa -> resursa-admin [redincredadmin.js / res-shown.js] -> resursa-validator === */
router.get('/:idres', makeSureLoggedIn.ensureLoggedIn(), async function clbkProfResID (req, res, next){
    // Adu înregistrarea resursei cu toate câmpurile referință populate deja
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
        // UPLOADER
        {script: '/js/uploader.js'},
        {script: '/js/personal-res.js'}
    ];
    let roles = ["user", "cred", "validator"];
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    // caută resursa în bază
    const query = Resursa.findById(req.params.idres).populate({path: 'competenteS'});    
    // reformatare obiect resursă și căutarea corespondentului în Elasticsearch cu reindexare, dacă nu există în bază, șterge ghost-ul din ES
    query.then(resursa => {        
        /* === Resursa încă există în MongoDB === */
        if (resursa.id) {
            // transformă obiectul document de Mongoose într-un obiect normal.
            const obi = Object.assign({}, resursa._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is

            // obiectul competenței specifice cu toate datele sale trebuie curățat.
            obi.competenteS = obi.competenteS.map(obi => {
                return Object.assign({}, obi._doc);
            });

            // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client a întregii înregistrări serializate]
            obi.editorContent = JSON.stringify(resursa);

            // resursa._doc.content = editorJs2html(resursa.content);
            let localizat = moment(obi.date).locale('ro').format('LLL');
            // resursa._doc.dataRo  = `${localizat}`; // formatarea datei pentru limba română.
            obi.dataRo  = `${localizat}`; // formatarea datei pentru limba română.

            console.log(obi.activitati);
            

            // Array-ul activităților modificat
            let activitatiRehashed = obi.activitati.map((elem) => {
                let sablon = /^([aA-zZ])+\d/g;
                let cssClass = elem[0].match(sablon);
                let composed = '<span class="' + cssClass[0] + 'data-code="' + elem[0] + '">' + elem[1] + '</span>';
                return composed;
            });
            
            obi.activitati = activitatiRehashed;

            // Dacă nu este indexată în Elasticsearch deja, indexează aici!
            esClient.exists({
                index: process.env.RES_IDX_ALS,
                id: req.params.idres
            }).then(resFromIdx => {
                /* DACĂ RESURSA NU ESTE INDEXATĂ, introdu-o în indexul Elasticsearch */
                if(resFromIdx.body == false && resFromIdx.statusCode === 404){
                    // verifică dacă există conținut
                    var content2txt = '';
                    if ('content' in newObi) {
                        content2txt = editorJs2TXT(newObi.content.blocks); // transformă obiectul în text
                    }
                    // indexează documentul
                    const data = {
                        id:               obi._id,
                        date:             obi.date,
                        idContributor:    obi.idContributor,
                        emailContrib:     obi.emailContrib,
                        uuid:             obi.uuid,
                        autori:           obi.autori,
                        langRED:          obi.langRED,
                        title:            obi.title,
                        titleI18n:        obi.titleI18n,
                        arieCurriculara:  obi.arieCurriculara,
                        level:            obi.level,
                        discipline:       obi.discipline,
                        disciplinePropuse:obi.disciplinePropuse,
                        competenteGen:    obi.competenteGen,
                        rol:              obi.rol,
                        abilitati:        obi.abilitati,
                        materiale:        obi.materiale,
                        grupuri:          obi.grupuri,
                        domeniu:          obi.demersuri,
                        spatii:           obi.spatii,
                        invatarea:        obi.invatarea,
                        description:      obi.description,
                        dependinte:       obi.dependinte,
                        coperta:          obi.coperta,
                        content:          content2txt,
                        bibliografie:     obi.bibliografie,
                        contorAcces:      obi.contorAcces,
                        generalPublic:    obi.generalPublic,
                        contorDescarcare: obi.contorDescarcare,
                        etichete:         obi.etichete,
                        utilMie:          obi.utilMie,
                        expertCheck:      obi.expertCheck
                    };

                    ES7Helper.searchIdxAlCreateDoc(schema, data, process.env.RES_IDX_ES7, process.env.RES_IDX_ALS);
                }
                return resFromIdx;
            }).catch(err => {
                console.error(err);
            });
            return obi;
        } else {
            // Caută resursa și în Elasticsearch. Dacă există indexată, dar a fost ștearsă din MongoDB, șterge-o din indexare, altfel va apărea la căutare
            esClient.exists({
                index: process.env.RES_IDX_ALS,
                id: req.params.idres
            }).then(resFromIdx => {
                // console.log(resFromIdx);
                if(resFromIdx.statusCode !== 404){
                    esClient.delete({
                        id: req.params.idres,
                        index: process.env.RES_IDX_ALS
                    }).then(dead => {
                        // console.log(dead);
                        // rre('mesaje', `Resursa era încă indexată și am șters-o acum.`);
                    }).catch(err => {
                        // rre('mesaje', `Am încercat să șterg din index, dar: ${err}`);
                    });                        
                }
                return resFromIdx;
            }).catch(err => {
                console.error(err);
            });
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
                user:      req.user,
                title:     "Administrare RED",
                style:     "/lib/fontawesome/css/fontawesome.min.css",                
                logoimg:   "/img/red-logo-small30.png",
                credlogo:  "../img/CREDlogo.jpg",
                csfrToken: req.csrfToken(),
                resursa,
                scripts
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
                user:      req.user,
                title:     "Administrare RED",
                style:     "/lib/fontawesome/css/fontawesome.min.css",                
                logoimg:   "/img/red-logo-small30.png",
                credlogo:  "../img/CREDlogo.jpg",
                csfrToken: req.csrfToken(),
                resursa,
                scripts
            });
        /* === ROLURI ÎN CRED === */
        } else if (confirmedRoles.length > 0) { 
            // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
            res.render('resursa', {
                user:      req.user,
                title:     "Afișare RED",
                style:     "/lib/fontawesome/css/fontawesome.min.css",
                logoimg:   "/img/red-logo-small30.png",
                credlogo:  "../img/CREDlogo.jpg",
                csfrToken: req.csrfToken(),
                resursa,
                scripts
            });
        /* === NU FACI PARTE DIN CRED === */
        } else {
            res.redirect('/401');
        }
    }).catch(err => {
        if (err) {
            console.error(err);
            // rre('mesaje', `Nu pot să afișez resursa. Este posibil să nu mai existe! Eroare: ${err}`);
            // next(); // fugi pe următorul middleware / rută
            res.redirect('/administrator/reds');
        }
    });
});

module.exports = router;