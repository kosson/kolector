const assert = require('assert');
const Comp = require('../models/competenta-specifica');

describe('Citește competențe din baza de date', () => {
    let comp; // este instanță de competență
    // pasezi referința către metoda `done()` pentru că beforeEach este o operațiune asincronă
    beforeEach((done) => {
        comp = new Comp({
            nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate',
            ids: '1.2',
            token: [
                'identificarea personajelor/ personajului unui text audiat',
                'oferirea unor răspunsuri la întrebări de genul: „Cine? Ce? Când? Unde? Cum? De ce?”',
                'formularea unor întrebări şi răspunsuri referitoare la conţinutul unui mesaj/ text audiat',
                'identificarea enunţurilor adevărate/ false referitoare la textul audiat',
                'completarea orală a unor enunţuri cu elemente din textul audiat',
                'identificarea elementelor dintr-un text audiat care se regăsesc într-o ilustraţie corespunzătoare textului',
                'sesizarea unor elemente omise din ilustraţiile corespunzătoare unor texte audiate',
                'asocierea unor imagini/ enunţuri cu informaţiile desprinse din discuţiile cu colegii',
                'stabilirea de asemănări/ deosebiri între personajele şi/ sau întâmplările prezentate în povestirile audiate',
                'jocuri de tipul: „Recunoaşte povestea şi personajul”, „Ce s-ar fi întâmplat dacă..” etc.'
            ],
            disciplina: 'comunicare în limba română',
            nivel: [
                'clasa I'
            ],
            ref: 'Ordin al ministrului Nr. 3418/19.03.2013',
            din: Date(),
            nrRED: 1
        });
        comp.save().then(() => {
            done();
        });
    });
    it('Caută toate competențele pentru clasa I', (done) => {
        Comp.find({
            nivel: 'clasa I'
        }).then((competente) => {
            assert(competente[0]._id.toString() === comp._id.toString());
            done();
        });
    });
    it('Caută o înregistrare unică  în baza de date', (done) => {
        Comp.findOne({
            _id: comp._id
        }).then((inregistrare) => {
            assert(comp.ids == '1.2');
            done();
        });
    });
});