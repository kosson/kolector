/**
 * Funcția returnează un array cu rolurile care s-au potrivit cu cele definite pe rută. 
 * În fiecare rută sunt hardcodate roluri. TODO: Acestea vor fi separate ca management într-o altă zonă a programului
 * @param {*} reqRols este array-ul cu rolurile care sunt primite via req.session.passport.user.roles.rolInCRED
 * @param {*} roles este array-ul care este definit pentru fiecare rută în parte în interiorul rutei (este posibil să construiesc mecanism separat de gestiune!!!)
 * @return {Array} returnează un array cu toate rolurile
 */
function checkRoles (reqRols, roles) {
    return reqRols.filter((rol) => roles.includes(rol));
}
module.exports = checkRoles;