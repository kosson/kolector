const resursaModel = require('../../models/resursa-red'); // adu modelul resursei

// returnează resursele pentru un user identificat prin email
module.exports = (profil) => {
    // console.log(profil.email);

    // returnează promisiune
    return resursaModel.find({idContributor: profil._id}).then((resurse) => {
        // console.log("Numărul resurselor aduse cu `resincred.ctrl.js` este ", resurse.length);
        return resurse;
    });
};