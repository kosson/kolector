const Resursa = require('../models/resursa-red');
/** 
 * Această funcție va returna o promisiune 
 * @return {promise} promisiunea aduce un obiect cu reperele 
 * primei resurse educaționale introduse și a ultimei.
*/
module.exports = () => {
    const queryLimInferioara = Resurse.find({})
        .sort({date: 1})
        .limit(1)
        .then((resurse) => {
            return resurse[0].date;
        }); // Caută în toate înregistrările pe care le vei sorta, pe prima, pe care o vei aduce. E posibil să fie mai multe introduse în acelați timp.
    const queryLimSup = Resurse.find({})
        .sort({date: -1})
        .limit(1)
        .then((resurse) => {
            return resurse[0].date;
        });
    return Promise.all([queryLimInferioara, queryLimSup])
        .then((limite) => {
            return {
                inf: limite[0],
                sup: limite[1]
            }
        });
};

/*
În uz ar fi:
AduLimitele().then((limite) => {fă ceva cu obiectul adus})
*/