const Resursa = require('../models/resursa-red');
/** 
 * Caută în colecția de resurse pentru a prepopula landing page-ul sau oricare alte secțiuni ale aplicației.
 * @param {object} criteria, fiind obiectul proiecție pentru căutare în MongoDB. 
 * Este un obiect care definește atributele după care vor fi evaluate înregistrările rând pe rând. 
 * Ne-ar interesa atributele: arieCurriculara, level, grupCompetente și disciplinaPrimara
 * Fiecare dintre criterii poate fi o opțiune dintr-un select a cărei selecție va resorta rezultatele.
 * @param {string} cheie, fiind un key din înregistrare după care se va face sortarea rezultatelor. 
 * Această cheie va fi un string adus dinamic din client.
 * @param {integer} offset, fiind un număr ce indică câte rezultate vor fi omise (skip) în setul rezultatelor. Necesar paginării rezultatelor. Default: 0.
 * @param {integer} limit, fiind numărul de resurse care vor fi returnate. Necesar paginării rezultatelor. Default: 20.
 * @return {promise} promisiunea aduce un obiect
 * Semnătura obiectului este {resurse: [resurse], total: total, offset: offset, limit: limit }
 * Proprietatea total dorim să numere toate obiectele din colecție. Această operațiune este asincronă și ea
*/
module.exports = (criteria, cheie, offset = 0, limit = 10) => {
    // var objSortare = {};
    // objSortare[cheie] = 1; // mai bine folosești interpolated properties din ES6
    // {[cheie]: 1} // montează valoarea lui chei drept proprietate a obiectului de parametrizare a sortării
    const query = Resursa.find(doProjection(criteria))
        .sort({[cheie]: 1})
        .skip(offset)
        .limit(limit);

    return Promise.all([query, doProjection(criteria).countDocuments()]).then((rezultate) => {
        // returnează obiectul respectând semnătura convenită în spec mai sus.
        return {
            resurse: rezultate[0],
            total:   rezultate[1],
            offset:  offset,
            limit:   limit
        }
    });
};
/**
 * Funcția este folosită pentru a parametriza căutarea cu find
 * @param {object} criteria Este un obiect care vine din client și are rolul de a parametriza proiecția de căutare cu find()
 * @return {object} fiind chiar obiectul proiecție necesar MongoBD pentru a constitui un subset.
 */
function doProjection (criteria) {
    let query = {}; // este chiar obiectul care va fi folosit de mongoose pentru a trimite proiecția lui MongoDB

    // fă o căutare după numele unei resurse
    if(criteria.title){
        query.$text = {
            $search: criteria.title
        };
    }

    if(criteria.level){
        // dacă este primită în obiectul criteria valoare pentru level (nivelul de școlarizare)
        query.level = {
            $gte: criteria.level.min,
            $lte: criteria.level.max
        };
    }
    if(criteria.level){
        // dacă este primită în obiectul criteria valoare pentru level (nivelul de școlarizare)
        query.level = {
            $gte: criteria.level.min,
            $lte: criteria.level.max
        };
    }
    return query;
}