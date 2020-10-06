require('dotenv').config();
/* === DEPENDINȚE === */
const path        = require('path');
const mongoose    = require('mongoose');
const UserSchema  = require('../../models/user'); // adu schema
const UserModel   = mongoose.model('users', UserSchema); // constituie modelul
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt  = require('passport-jwt').ExtractJwt;
const path2key    = path.join(__dirname, '../..', 'id_rsa_pub.pem');
const PUB_KEY     = fs.readFileSync(path2key, 'utf8');

// Tokenul trebuie să vină ca Authorization: Bearer Token

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY,
    algorithms: ['RS256'],
};

// definirea strategiei
const strategy = new JwtStrategy(options, (payload, done) => {
    // Strategia `JwtStrategy` va lua tokenul primit în header, îl va valida folosind jsonwebtoken și va pasa `payload` în callback
    // nu uita, la momentul în care se creează JWT-ul, va fi inclus în payload id-ul uerului luat din MongoDB
    UserModel.findOne({_id: payload.sub}).then((user) => {
        if (user) {
            return done(null, user); // nu este eroare, returnează user-ul
        } else {
            return done(null, false); // nu există eroare, dar nu ai nici user
        }
    }).catch(err => done(err, null));    
});


module.exports = (passport) => {
    passport.use(strategy);
    
};
