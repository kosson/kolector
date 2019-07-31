const mongoose = require('../mongoose.config');
mongoose.set('useFindAndModify', false);    // va folosi driverul original al MongoDB - vezi https://mongoosejs.com/docs/deprecations.html

// hook necesar pentru execuția fix o singură dată în setul de test mocha
before((done) => {
    // în cazul în care ai nevoie de a executa orice înainte de orice test -> PREQUISITE
    done();
});

// Înainte de a face orice cu baza de date, mai întâi rulează ce este în beforeEach
beforeEach((done) => {
    const {resursedus, etichetas, competentaspecificas, coments} = mongoose.connection.collections;
    // ștergerea bazelor de date cu totul!!! A nu se încărca seturile de date inițiale.
    competentaspecificas.drop(() => {
        resursedus.drop(() => {
            etichetas.drop(() => {
                coments.drop(() => {
                    done();
                });
            });
        });
    });
    // done();
});