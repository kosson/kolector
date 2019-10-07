const resursaModel = require('../../models/resursa-red');
module.exports = (params) => {
    // console.log(profil.email);
    return resursaModel.find({_id: params.idres}).then( (resursa) => {
        console.log(resursa);
        return resursa;
    });
};