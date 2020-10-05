module.exports.isAuth = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/401');
    }
};

module.exports.isAdmin = (req, res, next) => {

};