const mongoose = require('mongoose');
const assert = require('assert');
const Resursa = require('../models/resursa-red');
const Coment = require('../models/coment');

describe('Teste de middleware cu hook-uri', () => {
    let resursa, coment;
    beforeEach((done) => {
        resursa = new Resursa({
            title: 'Orașul București',
            description: 'Este o resursă pentru Geografie.',
            dependinte: [{
                nume:     'Leaflet',
                versiune: '1.5.1',
                homepage: 'https://leafletjs.com/',
                logoUri:  'https://leafletjs.com/docs/images/logo.png'
            }]
        });
        coment = new Coment({
            continut: 'Acesta este un comentariu care va fi șters imediat ce va fi fi încheiat testul'
        });
        Promise.all([resursa, coment]).then(() => {
            done();
        });
    });
    it('testează ștergerea unei resurse cu toate comentariile asociate', (done) => {
        resursa.remove().then(() => {
            return Coment.countDocuments(); // numără câte documente se află într-o colecție - este o operațiune asincronă. Foloseste `countDocuments` pentru eliminare deprecations
        }).then((numardocumente) => {
            assert(numardocumente === 0);
            done();
        });
    });
});