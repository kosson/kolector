const assert = require('assert');
const Comp = require('../models/competenta-specifica');

describe('Actualizarea unei înregistrări din baza de date', () => {
    let comp; // este instanță de competență
    beforeEach((done) => {
        comp = new Comp({
            nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate',
            nrRED: 0
        });
        comp.save().then(() => {
            done();
        });
    });
    it('Setează și salvează instanța', (done) => {
        comp.set({nume: 'Test'}); // nu se face update, doar în memorie!
        comp.save().then(() => {
            Comp.find({}).then((competentele) => {
                assert(competentele.length === 1);
                assert(competentele[0].nume === 'Test');
                done();
            });  // pasarea unui obiect gol, aduce toate înregistrările.
        });
    });
    it('Actualizarea unui model instanțiat deja', (done) => {
        // poți face bulk updates
        comp.update({
            nume: 'Acesta este titlul în variantă actualizată'
        });
        done();
    });
    it('Un update folosind clasa', (done) => {
        // caută toate înregistrările având un câmp cu valoarea specificată, înlocuindu-le cu cel nou.
        Comp.update({nume:'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate'}, {nume: 'Teste diverse 01'}).then(() => {
            Comp.find({}).then((competentele) => {
                assert(competentele.length === 1);
                assert(competentele[0].nume === 'Teste diverse 01');
                done();
            }); 
        });
    });
    it('Actualizarea unei singure înregistrări folosind clasa modelului', (done) => {
        Comp.findOneAndUpdate({nume:'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate'}, {nume: 'Teste diverse 02'}).then(() => {
            Comp.find({}).then((competentele) => {
                assert(competentele.length === 1);
                assert(competentele[0].nume === 'Teste diverse 02');
                done();
            }); 
        });
    });
    it('Caută o înregistrare cu un anumit id și actualizeaz-o', (done) => {
        Comp.findByIdAndUpdate(comp._id, {nume: 'Ceva care să înlocuiască numele'}).then(() => {
            Comp.find({}).then((competentele) => {
                assert(competentele.length === 1);
                assert(competentele[0].nume === 'Ceva care să înlocuiască numele');
                done();
            }); 
        });
    });
    it('Găsește o anumită competență pe care să o incrementezi atunci când unui RED i se atașează tag-ul specific', (done) => {
        Comp.update({nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate'}, {$inc: {nrRED: 1}}).then(() => {
            Comp.findOne({nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate'}).then((competenta) => {
                assert(competenta.nrRED === 1);
                done();
            });
        });
    });
});