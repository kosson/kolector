const resursaModel = require('../../models/resursa-red');
module.exports = (profil) => {
    // console.log(profil.email);
    return resursaModel.find({idContributor: profil.email}).then( (resurse) => {
        // console.log(resurse);
        return resurse;
    });
};