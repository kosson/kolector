const Resursa = require('../models/resursa-red');

/** 
 * Funcția are rolul de a seta resurse educaționale ca fiind publice după ce au fost validate
 * @param {array} _ids Este un set de identificatori ale RED-urilor. Poate fi unu sau mai multe.
 * @return {promise} Este returnată o promisiune imediat ce s-a făcut actualizarea stării RED-urilor vizate.
*/
module.exports = (_ids) => {
    return Resursa.update(
        {_id: {$in: _ids}},
        {generalPublic: true},
        {multi: true}
    );
};