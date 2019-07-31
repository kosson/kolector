module.exports = (app, passport) => {
    /* GESTIONAREA RUTELOR */
    // IMPORTUL CONTROLLERELOR DE RUTE
    var index   = require('./index');
    // var login   = require('./login');
    var resurse = require('./resurse');
    var admin   = require('./administrator');

    // LANDING
    app.get('/', index);

    const User = require('./controllers/user.ctrl')(passport);
    // LOGIN
    app.get('/login', User.login);
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/resurse', // redirectează userul logat cu succes către resurse
        failureRedirect: '/login' // dacă a apărut o eroare, reîncarcă userului pagina de login TODO: Fă să apară un mesaj de eroare!!!
    }));
    // AUTH
    app.get('/auth', User.auth);
    // RUTA BUTONULUI CATRE SERVERUL DE AUTORIZARE (trebuie să ai deja ClientID și Secretul)
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email']}));
    // RUTA PE CARE VINE RĂSPUNSUL SERVERULUI DE AUTORIZARE
    app.get('/callback', passport.authenticate('google', { failureRedirect: '/auth'}), function(req, res) {
        res.redirect('/resurse');
    });

    // RUTA LOGOUT
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });
    // RUTA PROFILULUI PROPRIU
    app.get('/profile',
        require('connect-ensure-login').ensureLoggedIn(),
        function(req, res){
            res.render('profile', { user: req.user });
        }
    );
    // RUTA ADMINISTRATIVĂ A APLICAȚIEI
    app.get('/administrator', User.ensureAuthenticated, admin);
    // TODO: RUTA ADMINISTRATOR:
    // -- verifică daca este autentificat și dacă este administrator.

    // RESURSELE
    app.get('/resurse', User.ensureAuthenticated, resurse);
    // ADAUGĂ RESURSA
    app.get('/resurse/adauga', User.ensureAuthenticated, resurse);
};