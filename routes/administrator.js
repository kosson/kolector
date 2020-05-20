const esClient= require('../elasticsearch.config');
const moment  = require('moment');
const router  = require('express').Router();
const Resursa = require('../models/resursa-red');
const pubComm = require('./sockets');

// HELPERI
const ES7Helper= require('../models/model-helpers/es7-helper');
let content2html  = require('./controllers/editorJs2HTML');

// === VERIFICAREA ROLURILOR ===
let checkRole = require('./controllers/checkRole.helper');

/* === /administrator @->administrator === */
router.get('/', function clbkAdmRoot (req, res) {
    // ACL
    let roles = ["admin", "validator"];
    
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    /* === VERIFICAREA CREDENȚIALELOR === */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
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
            {script: '/js/admin.js'}
        ];
        let styles = [
            {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
            {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
        ];
        res.render('administrator', {
            title:   "administrator",
            user:    req.user,
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            csfrToken: req.csrfToken(),
            scripts,
            styles,
            activeAdmLnk: true
        });
    // Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public
    } else if (confirmedRoles.includes('validator')) {
        let scripts = [
            {script: '/js/validator.js'},       
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/timeline3/js/timeline.js'}
        ];
        res.render('validator', {
            title:   "validator",
            user:    req.user,
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            csfrToken: req.csrfToken(),
            scripts,
            styles,
            activeAdmLnk: true
        });
    } else {
        res.redirect('/401');
    }
});

/* === /administrator/reds === */
router.get('/reds', function clbkAdmReds (req, res) {
    // ACL
    let roles = ["admin", "validator"];
    
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
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
            {script: '/js/res-visuals.js'}
        ];
        let styles = [
            {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
            {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
        ];
        res.render('reds-data-visuals', {
            title:     "REDs data visuals",
            user:      req.user,
            style:     "/lib/fontawesome/css/fontawesome.min.css",
            logoimg:   "/img/red-logo-small30.png",
            credlogo:  "../img/CREDlogo.jpg",
            csfrToken: req.csrfToken(),
            scripts,
            styles,
            activeAdmLnk: true
        });
    // Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public
    } else {
        res.redirect('/401');
    }
});

router.get('/reds/:id', function clbkAdmOneRes (req, res) {
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
        let roles = ["admin"];
        let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
        
        // adu înregistrarea din MongoDB după ce a fost încărcată o nouă resursă
        Resursa.findById(req.params.id).populate({
            path: 'competenteS'
        }).exec().then(resursa => {
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

                console.log("Acestea sunt activitățile", obi.activitati);
                
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
                    id: req.params.id
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
            }
        }).then(resursa => {
            /* === ADMIN === */
            if(req.session.passport.user.roles.admin){

                // Adaugă mecanismul de validare al resursei
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
                    csfrToken: req.csrfToken(),
                    resursa,
                });
            } else if (confirmedRoles.length > 0) { // când ai cel puțin unul din rolurile menționate în roles, ai acces la formularul de trimitere a resursei.
                res.render('resursa', {
                    user:    req.user,
                    title:   "Afișare RED",
                    style:   "/lib/fontawesome/css/fontawesome.min.css",
                    logoimg: "/img/red-logo-small30.png",
                    credlogo: "../img/CREDlogo.jpg",
                    csfrToken: req.csrfToken(),
                    resursa: resursa,
                    scripts
                });
            } else {
                res.redirect('/401');
            }
        }).catch(err => {
            if (err) {
                console.log(err);
                // next(); // fugi pe următorul middleware / rută
                res.redirect('/administrator/reds');
            }
        });
});

router.get('/users', function clbkAdmUsr (req, res) {
    // ACL
    let roles = ["admin", "validator"];
    
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    
    /* ====== VERIFICAREA CREDENȚIALELOR ====== */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        let scripts = [
            {script: '/lib/fontawesome/js/all.js'},
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/moment/locale/ro.js'},            
            // DATATABLES
            {script: '/lib/datatables.net/js/jquery.dataTables.min.js'},
            {script: '/lib/datatables.net/js/dataTables.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/dataTables.select.min.js'},
            {script: '/lib/datatables.net-buttons/js/dataTables.buttons.min.js'},
            {script: '/lib/datatables.net-buttons/js/buttons.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/select.bootstrap.min.js'},
            {script: '/lib/datatables.net-responsive/js/dataTables.responsive.min.js'},
            {script: '/lib/datatables.net-responsive-dt/js/dataTables.responsive.min.js'},

            {script: '/js/users-visuals.js'}
        ];
        let styles = [
            {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
            {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
        ];
        res.render('users-data-visuals', {
            title:   "User data visuals",
            user:    req.user,
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            csfrToken: req.csrfToken(),
            scripts,
            styles,
            activeAdmLnk: true
        });
    // Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public
    } else {
        res.redirect('/401');
    }
});

router.get('/users/:id', function clbkAdmRoot (req, res) {
    // ACL
    let roles = ["admin", "validator"];
    
    // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
    let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);

    /* === VERIFICAREA CREDENȚIALELOR === */
    // Dacă avem un admin, atunci oferă acces neîngrădit
    if(req.session.passport.user.roles.admin){
        let scripts = [       
            {script: '/lib/fontawesome/js/all.js'},
            {script: '/lib/timeline3/js/timeline.js'},
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/moment/locale/ro.js'},            
            // DATATABLES
            {script: '/lib/datatables.net/js/jquery.dataTables.min.js'},
            {script: '/lib/datatables.net/js/dataTables.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/dataTables.select.min.js'},
            {script: '/lib/datatables.net-buttons/js/dataTables.buttons.min.js'},
            {script: '/lib/datatables.net-buttons/js/buttons.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/select.bootstrap.min.js'},
            {script: '/lib/datatables.net-responsive/js/dataTables.responsive.min.js'},
            {script: '/lib/datatables.net-responsive-dt/js/dataTables.responsive.min.js'},
            {script: '/js/user.js'}
        ];
        let styles = [
            {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
            {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
        ];
        res.render('user-admin', {
            title:   "fișa user",
            user:    req.user,
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            csfrToken: req.csrfToken(),
            scripts,
            styles,
            activeAdmLnk: true
        });
    // Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public
    } else if (confirmedRoles.includes('validator')) {
        let scripts = [
            {script: '/lib/fontawesome/js/all.js'},
            {script: '/lib/timeline3/js/timeline.js'},
            {script: '/lib/moment/min/moment.min.js'},
            {script: '/lib/moment/locale/ro.js'},            
            // DATATABLES
            {script: '/lib/datatables.net/js/jquery.dataTables.min.js'},
            {script: '/lib/datatables.net/js/dataTables.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/dataTables.select.min.js'},
            {script: '/lib/datatables.net-buttons/js/dataTables.buttons.min.js'},
            {script: '/lib/datatables.net-buttons/js/buttons.bootstrap.min.js'},
            {script: '/lib/datatables.net-select/js/select.bootstrap.min.js'},
            {script: '/lib/datatables.net-responsive/js/dataTables.responsive.min.js'},
            {script: '/lib/datatables.net-responsive-dt/js/dataTables.responsive.min.js'},
            {script: '/js/validator.js'},
        ];
        let styles = [
            {style: '/lib/datatables.net-dt/css/jquery.dataTables.min.css'},
            {style: '/lib/datatables.net-responsive-dt/css/responsive.dataTables.min.css'}
        ];
        res.render('validator', {
            title:   "validator",
            user:    req.user,
            style:   "/lib/fontawesome/css/fontawesome.min.css",
            logoimg: "/img/red-logo-small30.png",
            credlogo: "../img/CREDlogo.jpg",
            csfrToken: req.csrfToken(),
            scripts,
            styles
        });
    } else {
        res.redirect('/401');
    }
});

module.exports = router;