const resursaModel  = require('../../models/resursa-red');
const moment        = require('moment');
const editorJs2html = require('./editorJs2HTML');

module.exports = (params) => {
    return resursaModel.find({_id: params.idres}).populate({
        path: 'competenteS'
    }).exec().then( (resursa) => {
        if (resursa[0].content) {
            resursa[0].content = editorJs2html(resursa[0].content);
            let localizat = moment(resursa[0].date).locale('ro').format('LLL');
            resursa[0].dataRo = `${localizat}`; // formatarea datei pentru limba română.
        } else {
            console.log(typeof(resursa[0].content));
        }
        return resursa;
    });
};