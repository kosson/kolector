// helper de caching
const {clear4Id, clearHash} = require('./cacheClear.helper');

module.exports = async function chHelper(req, res, next) {
    await next();
    clearHash(req.user.id);
}