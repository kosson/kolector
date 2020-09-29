/**
 * Funcția are rolul de a gestiona callback-urile în regim de async pe rutele Express.js
 * @param {Function} fn 
 * @return {Function} -> returnează rezolvarea unei promisiuni pe callback
 */
function asyncHandler (fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
module.exports = asyncHandler;