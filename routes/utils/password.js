/* === DEPENDINȚE === */
const crypto = require('crypto');

function generatePassword (password) {
    let salt = crypto.randomBytes(32).toString('hex');
    let hash = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex');
    return {
        salt: salt,
        hash: hash
    }
}

function validPassword (password, hash, salt) {
    let hashVerify = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex');
    return hash === hashVerify;
}

module.exports.validPassword = validPassword; 
module.exports.generatePassword = generatePassword; 