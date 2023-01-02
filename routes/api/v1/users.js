// @desc Returnează userul curent
// @route GET /api/v1/user/current
// @access privat
exports.currentUser = function currentUser (req, res, next) {
    res.json({user: {
      id:            req.user._id,
      roles:         req.user.roles,
      ecusoane:      req.user.ecusoane,
      recomandari:   req.user.recomandari,
      username:      req.user.username,
      email:         req.user.email,
      contributions: req.user.contributions
    }});
    // next();
  };
  // _FIXME: Creează logica pentru refresh token (https://www.youtube.com/watch?v=mbsmsi7l3r4)
  
  // Utilitarele pentru validarea parolei și emiterea JWT-ul!
  let {issueJWT, validPassword} = require('../../utils/password');
  
  // @desc Loghează userul
  // @route POST /api/v1/user/login
  // @access privat
  exports.loginUser = async function loginUser (req, res, next) {
    // Read username and password from request body
    const { username, password } = req.body;
    // Caută userul
    User.findOne({email: username}).lean().then(user => {
      // verifică dacă există utilizatorul
      if (!user) {
        return res.status(404).json({success: false, message: 'user not found'});
      }
  
      // Verifică parola
      if (validPassword(password, user.hash, user.salt)) {
        // Dacă parola este ok, creează payload-ul JWT-ului
        const {token} = issueJWT(user);
        res.json({success: true, token});
      } else {
        return res.status(401).json({success:false, message: 'password incorrect'}); // Unauthorized
      }
    }).catch(error => {
      // return res.status(500).json(error.toString());
      next(error);
    });
  }
  
  
// @desc   logout
// @route  POST /api/v1/user/logout
// @access privat
exports.userLogout = function userLogout (req, res, next) {
  // ACL
  let roles = ["user", "validator", "cred"];
  res.status(200).send({logout: true});
}

// @desc   avatar
// @route  POST /api/v1/user/avatar
// @access privat
exports.postAvatar = function postAvatar (req, res, next) {
  // ACL
  let roles = ["user", "validator", "cred"];
  res.status(200).send({logout: true});
}