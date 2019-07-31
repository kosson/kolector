const assert  = require('assert');
const request = require('supertest'); // necesar pentru a face fake request pentru analiză
const app     = require('../app');

describe('Testează serverul realizat cu app', () => {
    it.only('gestionarea rutei pe rădăcină', (done) => {
        request(app).get('/').end((err, response) => {
            assert(response.status === 200);
            done();
        });
    });
});