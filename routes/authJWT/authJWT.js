/* === DEPENDINȚE === */
const path        = require('path');
const fs          = require('fs');
const mongoose    = require('mongoose');
const User        = require('../../models/user');
const passport    = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt  = require('passport-jwt').ExtractJwt;

// citește cheia publică
const publicKey   = path.join(__dirname, '../../assets/keys/', 'id_rsa_pub.pem');
const PUB_KEY     = fs.readFileSync(publicKey, 'utf8');

// Tokenul trebuie să vină ca Authorization: Bearer Token_alfanumeric
/* Opțiunile controlează cum este extras tokenul din request și cum este verificat */
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey:    PUB_KEY,
    issuer:         process.env.APP_NAME,
    audience:       process.env.FQDN,
    algorithms:     ['RS256'],
    ignoreExpiration: false
};

// definirea strategiei
const JWTstrategy = new JwtStrategy(options, (payload, done) => {
    // acesta este callback-ul de verificare
    // Strategia `JwtStrategy` va lua tokenul primit în header, îl va valida folosind jsonwebtoken și va pasa `payload` în callback
    // `payload` este un obiect literal care conține JWT-ul decodat din request
    // `done` este un callback error first care primește argumentele: `error`, `user`, `info`.
    
    // nu uita, la momentul în care se creează JWT-ul, va fi inclus în payload id-ul user-ului luat din MongoDB
    return User.findOne({_id: payload.sub}).lean().then((user) => {
        // console.log('[authJWT] userul este', user);
        if (user) {
            return done(null, user); // nu este eroare, returnează user-ul
        } else {
            return done(null, false); // nu există eroare, dar nu ai nici user
            // _NOTE: Dacă nu ai user, aici ai putea introduce logica de creare a unuia?!
        }
    }).catch((err) => done(err, null));    
});

// pentru toate rutele protejate, va trebui să imporți strategia și să pui drept middleware de verificare: 
// router.get('/protejata', passport('jwt', {session: false}), (req, res, next) => {});

passport.use(JWTstrategy); // folosit în /routes/controllers/user.ctrl.js