const assert = require('assert');
const Comp = require('../models/competenta-specifica');

describe('Validarea înregistrărilor', () => {
    // ceri validare pe o anumită proprietate a modelului.
    it('Introducerea numelui competenței este absolut necesară', (done) => {
        const comp = new Comp({
            nume: undefined // am asumat această valoare pentru a putea testa validarea.
        });
        const rezultatValidare = comp.validateSync();   // variabila are toate rezultatele de validare; validate() nu aduce rezultatele direct, de aia folosesc varianta Sync
        // pentru validare asicronă în tandem cu baza
        /*
        comp.validate((rezultatValidare) => {
            // confirmă cu baza de date
        });
        */
        // const mesaj = rezultatValidare.errors.nume.message;
        const {message} = rezultatValidare.errors.nume;
        assert( message === 'Fără numele resursei, nu se poate face înregistrarea');
        done();
    });
    it('Este necesar ca numele resursei să fie mai mare de trei caractere', (done) => {
        const comp = new Comp({
            nume: 'Ie' // am asumat această valoare pentru a putea testa validarea.
        });
        const rezultatValidare = comp.validateSync();
        const {message} = rezultatValidare.errors.nume;
        assert(message === 'Numele resursei trebuie să fie mai mare de trei caractere');
        done(); 
    });
    it('Împiedicarea datelor cu probleme să ajungă în baza de date', (done) => {
        const comp = new Comp({nume: 'Bă'});
        // presupunem că va eșua!
        comp.save().catch((rezultatulValidării) => {
            const {message} = rezultatulValidării.errors.nume;
            assert(message === 'Numele resursei trebuie să fie mai mare de trei caractere');
            done();
        });
    });
});