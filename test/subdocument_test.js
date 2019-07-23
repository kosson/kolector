const assert = require('assert');
const Resursa = require('../models/resursa-red');

// CAND FACI TESTUL, SCOATE VALIDĂRILE DIN SCHEMĂ PENTRU TITLU!!!
describe('Lucrul cu subdocumente', (done) => {
    it('posibilitatea de a crea un subdocument', (done) => {
        const resursa = new Resursa({
            title: 'Orașul București',
            description: 'Este o resursă pentru Geografie.',
            dependinte: [{
                nume:     'Leaflet',
                versiune: '1.5.1',
                homepage: 'https://leafletjs.com/',
                logoUri:  'https://leafletjs.com/docs/images/logo.png'
            }]
        });
        resursa.save().then(() => {
            Resursa.findOne({title: 'Orașul București'}).then((res) => {
                assert(res.dependinte[0].nume === 'Leaflet');
                done();
            });
        });
    });
    it('adăugarea de subdocumente la unui existent', (done) => {
        const resursa = new Resursa({
            title: 'Teorema lui Pitagora',
            description: 'Este o resursă pentru Matematică.'
        });

        // INTRODUCEREA UNUI NOU SUBDOCUMENT
        resursa.save()
                .then(() => Resursa.findOne({title: 'Teorema lui Pitagora'}))
                .then((res) => {
                    res.dependinte.push({
                        nume:     'GeoGebra',
                        versiune: '6',
                        homepage: 'https://www.geogebra.org',
                        logoUri:  'https://www.geogebra.org/user/5743822/l7VDZjRWVSdno5Nf/avatar.png'
                    });
                    return res.save();
                })
                .then(() => Resursa.findOne({title: 'Teorema lui Pitagora'}))
                .then((doc) => {
                    assert(doc.dependinte[0].nume == 'GeoGebra');
                    done();
                });

        // VARIANTA COMBINATA CU CALLBACK-URI
        // // salvezi resursa
        // resursa.save().then(() => {
        //     // aduci întreaga înregistrare din bază. Nu merge să aduci doar subdocumentele!
        //     Resursa.findOne({'title.value': 'Teorema lui Pitagora'}, function existaRed (err, record) {
        //         if (err) throw err;
        //         // introduci o nouă înregistrare în subdocument
        //         record.dependinte.push({
        //             nume:     'GeoGebra',
        //             versiune: '6',
        //             homepage: 'https://www.geogebra.org',
        //             logoUri:  'https://www.geogebra.org/user/5743822/l7VDZjRWVSdno5Nf/avatar.png'
        //         });
        //         // savezi înregistrarea
        //         record.save(function saveNewDoc (err, doc) {
        //             if (err) throw err;
        //             // console.log('Am salvat!');
        //         });
        //     }).then(() => {
        //         Resursa.findOne({'title.value': 'Teorema lui Pitagora'}, function gasescRED (err, record) {
        //             if (err) throw err;
        //             assert(record.dependinte[0].nume == 'GeoGebra');
        //             done();
        //         });
        //     });
        // });    
    });
    it('stergerea unui subdocument', (done) => {
        const resursa = new Resursa({
            title: 'Teorema lui Pitagora',
            description: 'Este o resursă pentru Matematică.',
            dependinte: [
                {
                    nume:     'GeoGebra',
                    versiune: '6',
                    homepage: 'https://www.geogebra.org',
                    logoUri:  'https://www.geogebra.org/user/5743822/l7VDZjRWVSdno5Nf/avatar.png'
                }
            ]
        });
        resursa.save()
                .then(() => Resursa.findOne({title: 'Teorema lui Pitagora'}))
                .then((res) => {
                    res.dependinte[0].remove();
                    return res.save();
                })
                .then(() => Resursa.findOne({title: 'Teorema lui Pitagora'}))
                .then((res) => {
                    assert(res.dependinte.length === 0);
                    done();
                });
    });
});