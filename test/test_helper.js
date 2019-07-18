const mongoose = require('mongoose');

// hook necesar pentru execuția fix o singură dată în setul de test mocha
before((done) => {
    // MONGOOSE - Conectare la MongoDB
    mongoose.set('useCreateIndex', true); // Deprecation warning
    mongoose.connect('mongodb://localhost/redcolector', {useNewUrlParser: true});
    mongoose.connection.on('error', function () {
        console.warn('Database connection failure');
        process.exit();
    });
    mongoose.connection.once('open', function () {
        console.log('Database connection succeded');
        done(); // este specific doar pentru testare cu mocha
    });
});

// Înainte de a face orice cu baza de date, mai întâi rulează ce este în beforeEach
beforeEach((done) => {
    mongoose.connection.collections.competentaspecificas.drop(() => {
      done();
    });
});