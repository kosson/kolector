const mongoose = require('mongoose');
const assert   = require('assert');
const User     = require('../models/user');
const Comp     = require('../models/competenta-specifica');
const Resursa  = require('../models/resursa-red');
const Coment   = require('../models/coment');
const Eticheta = require('../models/eticheta');

describe('Asocieri între colecții', () => {
    let user, comp, coment, eticheta, resursa;   // acestea sunt modelele de lucru
    beforeEach((done) => {
        // sterge doar userul de test. Evită ștergerea accidentală a administratorului.
        User.deleteOne().then(() => {
            User.findOne({email: 'cici@gob.ro'}).then(() => {
                console.log('Am șters utilizatorul de test. Stai liniștit!');
            });
        });
        // generează date în modelele de lucru
        user = new User({
            email: 'cici@gob.ro'
        });
        comp = new Comp({
            nume: 'Identificarea semnificaţiei unui mesaj oral, pe teme accesibile, rostit cu claritate',
            ids: '1.1'
        });
        comp2 = new Comp({
            nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate',
            ids: '1.2'
        });
        coment = new Coment({
            continut: 'Acesta este un comentariu care va fi șters imediat ce va fi fi încheiat testul'
        });
        eticheta = new Eticheta({
            nume: 'Înmulțirea cu 2'
        });
        resursa = new Resursa({
            title: 'Înmulțirea cu 2 pentru noi'
        });

        // STABILIREA RELATIILOR - mongoose, pur si simplu ia ID-urile modelelor, nu întregul model
        coment.user = user;             // în proprietatea 'user' a comentariului injectează 
        resursa.competentaS.push(comp); // injectează id-ul competenței drept
        resursa.competentaS.push(comp2);// injectează id-ul competenței2 drept
        resursa.comentarii.push(coment);// injectează id-ul comentariilor
        resursa.etichete.push(eticheta);
        user.REDuri.push(resursa);
        resursa.creator.push(user);

        // SALVAREA MODELELOR
        Promise.all([user.save(), comp.save(), comp2.save(), coment.save(), eticheta.save(), resursa.save()])
            .then((valori) => {
                return done();
            })
            .catch((err) => {
                if (err) throw new Error('Mesajul de eroare este: ', err.message);
            });
        
    });
    // rularea unui singur test
    // it.only('Constituirea relațiilor dintre seturile de date', (done) => {
    it('Constituirea relațiilor dintre seturile de date', (done) => {
        User.findOne({email: 'cici@gob.ro'})
            .populate('REDuri')
            .then((utilizator) => {
                // console.log(utilizator);
                assert(utilizator.REDuri[0].title === 'Înmulțirea cu 2 pentru noi');
                done();
            });
    });
    it('Aducerea unui graf complet de informație pentru o resursă educaționala', (done) => {
        Resursa.findOne({title: 'Înmulțirea cu 2 pentru noi'})
            .populate({
                path: 'creator',
                populate: {
                    path: 'user',
                    model: 'user',
                    populate: {
                        path: 'REDuri',
                        model: 'resursedu'
                    }
                }
            })
            .then((graf) => {
                // console.log(graf.creator[0].REDuri[0]);
                assert(user.email === 'cici@gob.ro');
                assert(resursa.creator[0].email === 'cici@gob.ro');
                done();
            });
        
    });
});