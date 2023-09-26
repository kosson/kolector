/**
 * Funcția are rolul de a verifica dacă se primește parametrul solicitat
 * @param {string} param 
 */
exports.requiredParam = function requiredParam (param) {
    const requiredParamError = new Error (`Parametrul solicitat (${param}) nu a fost primit`);
    // conservă stack traceul
    if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(requiredParamError, requiredParam);
    }
    throw requiredParamError;
}