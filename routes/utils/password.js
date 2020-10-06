/* === DEPENDINȚE === */
const fs           = require('fs');
const crypto       = require('crypto');
const path         = require('path');
const jsonwebtoken = require('jsonwebtoken');
const path2key     = path.join(__dirname, '../..', 'id_rsa_priv.pem');
const PRIV_KEY     = fs.readFileSync(path2key, 'utf8');

/**
 * Funcția are rolul de a genera un hash pe textul parolei
 * @param {String} password Este parola care vine în clar de la client
 */
function generatePassword (password) {
    let salt = crypto.randomBytes(32).toString('hex');
    let hash = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex');
    return {
        salt: salt,
        hash: hash
    };
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

/**
 * Funcția generează un JWT pentru a fi trimis userului ca răspuns la autentificarea cu succes
 * @param {Object} user Este obiectul `user` din `req.user` pe care-l creează `passport`
 */
function issueJWT (user) {
    const _id       = user._id;
    const expiresIn = '1d';

    // În viitor ai putea introduce în JWT mai multe detalii despre user
    const payload   = {
        sub: _id,
        iat: Date.now()
    };

    // creează JWT-ul semnat folosind cheia privată
    const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { expiresIn: expiresIn, algorithm: 'RS256' });

    return {
        token:   "Bearer " + signedToken,
        expires: expiresIn
    };
}

module.exports.validPassword    = validPassword; 
module.exports.generatePassword = generatePassword;
module.exports.issueJWT         = issueJWT;