module.exports = (app, passport) => {
    /* GESTIONAREA RUTELOR */
    // IMPORTUL CONTROLLERELOR DE RUTE
    var index   = require('./index');
    // var login   = require('./login'); FIXME: elimină toate fișierele de tratare a rutelor
    var admin   = require('./administrator');

    // ========== / ==========
    app.get('/', index);

    // Încarcă controlerul necesar tratării rutelor de autentificare
    const User = require('./controllers/user.ctrl')(passport);

    // ========== LOGIN ==========
    app.get('/login', User.login);
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/resurse', // redirectează userul logat cu succes către resurse
        failureRedirect: '/login'    // dacă a apărut o eroare, reîncarcă userului pagina de login TODO: Fă să apară un mesaj de eroare!!!
    }));

    // ========== AUTH ==========
    app.get('/auth', User.auth); // Încarcă template-ul hbs pentru afișarea butonului de autorizare
    // AUTH/GOOGLE -> RUTA BUTONULUI CATRE SERVERUL DE AUTORIZARE (trebuie să ai deja ClientID și Secretul)
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email']}));
    // RUTA PE CARE VINE RĂSPUNSUL SERVERULUI DE AUTORIZARE
    app.get('/callback', passport.authenticate('google', { failureRedirect: '/auth'}), function(req, res) {
        res.redirect('/resurse');
    });

    // ========== USER ==========
    /* Este ruta care încarcă resursele atribuite utilizatorului, fie proprii, fie asignate */
    app.get('/user/resurse', User.resAtribuite, function(req, res) {
        // console.log('Ce există în headerul de autorizare', req.get('authorization'));
        res.render('red-atribuite', {
            title:    "RED Atribuite",
            logoimg:  "../img/rED-logo192.png",
            credlogo: "../img/CREDlogo.jpg"
        });
    });

    app.get('/user/resurse/cred', User.resAtribuite, function(req, res) {
        res.render('red-in-cred', {
            title:    "RED Atribuite",
            logoimg:  "../img/rED-logo192.png",
            credlogo: "../img/CREDlogo.jpg"
        });
    });

    //  ========== LOGOUT ==========
    app.get('/logout', function(req, res){
        req.logout();
        // req.session.destroy(function (err) {
        //     if (err) throw new Error('A apărut o eroare la logout: ', err);
        //     res.redirect('/');
        // });
        res.redirect('/');
    });
    
    let makeSureLoggedIn = require('connect-ensure-login');
    
    // ========== PROFILUL PROPRIU ==========
    app.get('/profile',
        makeSureLoggedIn.ensureLoggedIn(),
        function(req, res){
            console.dir(req.user);
            res.render('profile', {
                user:    req.user,
                title:   "Profil",
                logoimg: "/img/red-logo-small30.png",
            });
        }
    );
    // ========== ADMINISTRATOR ==========
    app.get('/administrator', User.ensureAuthenticated, admin);
    // TODO: RUTA ADMINISTRATOR:
    // -- verifică daca este autentificat și dacă este administrator.

    // ========== RESURSE ================
    const resurse = require('./resurse');
    app.get('/resursepublice', resurse);
    app.get('/resurse', User.ensureAuthenticated, resurse);
    // ADAUGĂ RESURSA
    app.get('/resurse/adauga', User.ensureAuthenticated, resurse);

    // ========== 401 - NEPERMIS ==========
    app.get('/401', function(req, res){
        res.status(401);
        res.render('nepermis', {
            title:    "401",
            logoimg:  "img/red-logo-small30.png",
            mesaj:    "Încă nu ești autorizat pentru acestă zonă"
        });
    });

    //========== 404 - NEGĂSIT ==========
    app.use('*', function (req, res, next) {
        res.render('negasit', {
            title:    "404",
            logoimg:  "/img/red-logo-small30.png",
            imaginesplash: "/img/theseAreNotTheDroids.jpg",
            mesaj:    "Nu am gasit pagina căutată. Verifică linkul!"
        });
        // next();
    });
};