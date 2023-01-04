require('dotenv').config();
const mongoose      = require('mongoose');
const jwt           = require('jsonwebtoken');
const RedModel      = require('../../../models/resursa-red');
const passport      = require('passport');
const localStrategy = require('passport-local').Strategy;
const User          = require('../../../models/user');
const {clbkLogin}   = require('../../authLocal/authL');
const logger        = require('../../../util/logger');

// _FIXME: Creează logica pentru refresh token (https://www.youtube.com/watch?v=mbsmsi7l3r4)

// Utilitarele pentru validarea parolei și emiterea JWT-ul!
let {issueJWT, generatePassword, validPassword} = require('../../utils/password');

// @desc   creează un utilizator
// @route  POST /api/v1/user/create
// @access privat
exports.createUser = async function createUser (req, res, next) {
  let salt   = undefined, 
      hash   = undefined, 
      token  = undefined, 
      expires= undefined, 
      result = undefined; // variabilă colectoare de date în urma verificărilor, validărilor și salvării

  // doar dacă ai valoarea fă și evaluarea, dacă nu, lasă mongoose să scoată erorile la validare
  if(req.body.password) {
    let salt_hash = generatePassword(req.body.password);
    salt = salt_hash.salt;
    hash = salt_hash.hash;
  }

  // doar dacă ai valoarea fă și evaluarea, dacă nu, lasă mongoose să scoată erorile la validare
  if (req.body.name) {
    let resultJWT = issueJWT(req.body.name);
    token = resultJWT.token;
    expires = resultJWT.expires;
  }

  let userdoc = new User({
    name: req.body.name,
    email: req.body.email,
    hash,
    salt,
    token
  });

  try {  
    let existing = await User.findOne({email: req.body.email}).exec(); // Evită crearea dublurilor
    if (existing) {
      res.status(409);
      result = {message: 'Emailul deja există!'};
    } else {
      result = await userdoc.save(); // salvează userul
    }
  } catch (error) {
    if (error) {
      res.status(409);
      result = error; // colectează eroarea în result
    } else {
      res.status(201);
    }
  }
    
  res.send(result);
}

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

// @desc Modifică userul
// @route POST /api/v1/user/:id
// @access privat
exports.patchUser = async function patchUser (req, res, next) {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['email', 'name'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({error: 'Nu poți face aceste modificări'});
  }

  try {
    const user = await User.findById(req.params.id);
    
    updates.forEach((update) => {
      user[update] = req.body[update];
    });

    await user.save();

    if(!user) {
      res.status(400).send({error: 'utilizatorul nu există'});
    }
  } catch (error) {
    res.status(400).send();
  }
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
  // const avatarupload = multer({ dest: '/api/v1/user/avatar/' });
  try {
    console.log(req.file, req.body)
    next();
  } catch (error) {
    res.status(500).send(err);
  }
}