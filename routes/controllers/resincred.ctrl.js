const resursaModel = require('../../models/resursa-red'); // adu modelul resursei

// returnează resursele pentru un user identificat prin email
module.exports = (profil) => {
    // console.log(profil.email);
    return resursaModel.find({idContributor: profil._id}).then( (resurse) => {
        // console.log(resurse); //FIXME: Șterge în producție
        return resurse;
    });
};