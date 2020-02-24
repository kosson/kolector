// Pentru a prelucra cererile pe rute, este necesarea încărcarea controlerului
const resurseCtrl = require('./controllers/resurse.ctrl');

module.exports = function incarcResurseleInIntern (router) {
    /* GET::/resurse */
    // console.log(typeof(resurseCtrl.loadRootResources));
    router.get('/', resurseCtrl.loadRootResources);

    /* GET::/resurse/adauga - Pe această rută se obține formularul de adăugare a resurselor doar dacă ești logat, având rolurile menționate */
    router.get('/adauga', resurseCtrl.describeResource);

    /* GET::/resurse/:id */
    router.get('/:id', resurseCtrl.loadOneResource);

    /* POST RUTĂ DE ÎNCĂRCARE FIȘIERE */
    // router.post('/upload', resurseCtrl.uploadResource);

    return router;
};