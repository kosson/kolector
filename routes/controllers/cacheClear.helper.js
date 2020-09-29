// helper de caching
const {clear4Id, clearHash} = require('./cache.helper');

module.exports = async function chHelper(req, res, next) {
    await next();
    // clearHash(req.user.id);
}