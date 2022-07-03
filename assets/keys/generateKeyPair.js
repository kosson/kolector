const crypto = require('crypto');
const fs     = require('fs');

/*
 * Cheile sunt necesare criptării și decriptării fragmentului semnat din JWT.
*/

/**
 * Funcția generează o cheie privată și una publică în directorul din care se execută scriptul
 */
function genKeyPair() {
    
    // Generează obiectul a cărui proprietăți `privateKey` și `publicKey` țin cheile
    const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096, // bits - este standard pentru cheile RSA
        publicKeyEncoding: {
            type: 'pkcs1', // "Public Key Cryptography Standards 1" 
            format: 'pem'  // Formatul cel mai des întâlnit
        },
        privateKeyEncoding: {
            type: 'pkcs1', // "Public Key Cryptography Standards 1"
            format: 'pem'  // Formatul cel mai des întâlnit
        }
    });

    // Creează fișierul cheii publice
    fs.writeFileSync(__dirname + '/id_rsa_pub.pem', keyPair.publicKey); 
    
    // Creează fișierul cheii private
    fs.writeFileSync(__dirname + '/id_rsa_priv.pem', keyPair.privateKey);

};

// creează cheile!!!
genKeyPair();