/* === DEPENDINȚE === */
require('dotenv').config();
const fs     = require('fs');
const crypto = require('crypto');
const path   = require('path');
const jwt    = require('jsonwebtoken');

/**
 * Funcția are rolul de a genera un hash pe textul parolei
 * @param {String} password Este parola care vine în clar de la client
 */
function generatePassword (password) {
    let salt = crypto.randomBytes(32).toString('hex');
    let hash = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex');
    return { salt, hash };
}

/**
 * Funcția are rolul de a valida o parolă care vine de la userul care este la etapa de logare
 * @param {String} password Este parola în clar care vine de la clientul care face logarea
 * @param {String} hash Este hashul parolei din baza de date - user rec
 * @param {String} salt Este hash-ul salt-ului care este tot din baza de date - user rec
 */
function validPassword (password, hash, salt) {
    let hashVerify = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex');
    return hash === hashVerify;
}

// Citește cheia privată
const path2key = path.join(__dirname, '../../assets/keys/', 'id_rsa_priv.pem');
const PRIV_KEY = fs.readFileSync(path2key, 'utf8');

/**
 * Funcția generează un JWT pentru a fi trimis userului ca răspuns la autentificarea cu succes
 * @param {*} user Este obiectul `user` din `req.user` pe care-l creează `passport` sau un string: res.body.name
 */
function issueJWT (user, res) {
    const _id       = user._id;
    const expiresIn = new Date().setDate(new Date().getDate() + 1);
    const payload   = {
        sub: _id,
        iss: process.env.APP_NAME,
        aud: process.env.FQDN,
        iat: new Date().getTime(),
        exp: expiresIn
    };

    // creează JWT-ul semnat folosind cheia privată
    const token = jwt.sign(payload, PRIV_KEY, { algorithm: 'RS256' });

    // Obiectul care ajunge în client
    return {
        token:   token,
        expires: expiresIn
    };
}

function authenticateJWT (req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

module.exports.validPassword    = validPassword; 
module.exports.generatePassword = generatePassword;
module.exports.issueJWT         = issueJWT;