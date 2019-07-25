// ATENTIE! NU EXECUTA ACEST TEST CAND AI DATE ÎN BAZA!!! VA STERGE TOT CE ESTE ÎN COMPETENTESPECIFICE
const assert = require('assert');
const Comp = require('../models/competenta-specifica');

describe('Creează competență specifică - test', () => {
    it('Creează o competență', (done) => {
        const comp = new Comp({
            nume: 'Identificarea semnificaţiei unui mesaj oral, pe teme accesibile, rostit cu claritate',
            ids: '1.1',
            token: [
                'utilizarea imaginilor pentru indicarea semnificaţiei unui mesaj audiat',
                'realizarea unui desen care corespunde subiectului textului audiat',
                'oferirea de răspunsuri la întrebarea: „Despre ce este vorba... (în acest fragment de poveste/ în acest text) ?”',
                'selectarea unor enunţuri simple, scrise, care exprimă mesajul textului audiat, dintr-o pereche de enunţuri date',
                'formularea unor titluri potrivite textului audiat',
                'executarea unor comenzi/ instrucţiuni/ reguli de joc prezentate de adulţi sau copii',
                'jocuri de tipul: „Basme şi culoare”, „Scrisori desenate”, „Ce nu se potriveşte?” etc.',
                'audierea unor poveşti, descrieri, instrucţiuni şi indicaţii şi manifestarea unor reacţii corespunzătoare',
                'decodificarea mesajului încifrat în ghicitori',
                'audierea unor povestiri simple, ilustrate, despre istoria scrisului'
            ],
            disciplina: 'Comunicare în limba română',
            nivel: [
                'clasa I'
            ],
            ref: 'Ordin al ministrului Nr. 3418/19.03.2013',
            parteA: 'Receptarea de mesaje orale în contexte de comunicare cunoscute',
            din: Date.now(),
            nrRED: 1
        });
        comp.save().then(() => {
            assert(!comp.isNew); // dacă a fost salvat în bază valoarea pasată lui assert va fi false. Pentru a trece testul o facem truthy
            done();
        });
    });
});