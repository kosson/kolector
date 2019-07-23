const assert = require('assert');
const Comp = require('../models/competenta-specifica');

describe('Calcularea dinamică', () => {
    it('Socotește câte RED-uri au trecut prezenta competență specifică', (done) => {
        const comp = new Comp({
            nume: 'Identificarea semnificaţiei unui mesaj oral, pe teme accesibile, rostit cu claritate',
            REDuri: ['003rasf','sdaa022']
        });
        assert(comp.nrREDuri === 2);
        done();
    });
});