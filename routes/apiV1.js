require('dotenv').config();
/* === DEPENDINȚE === */
const express = require('express');
const router  = express.Router();
const passport= require('passport');
require('./controllers/user.ctrl')(passport); // încarcă strategiile
const multer  = require('multer');


const avatarstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(`[api] BAU`);

    let calea = `${process.env.REPO_REL_PATH}${req.user.id}/util`;

    console.log(`[apiV1::avatarstorage] calea formată este `, calea);
    let desiredMode = 0o2775;

    /* === VERIFICĂ EXISTENȚA DIRECTORUL USERULUI ȘI CONTINUĂ SCRIEREA ALTOR FIȘIERE DACĂ ACESTA EXISTĂ DEJA === */
    fs.access(calea, function clbkfsAccess (err) {
      /* === DIRECTORUL `util` NU EXISTĂ === */
      if (err) {
          console.log("[api/user/postAvatar] #A La verificarea posibilității de a scrie în directorul userului am dat de eroare: ", error);
          /* === CREEAZĂ DIRECTORUL DACĂ NU EXISTĂ === */
          fs.ensureDir(calea, desiredMode, (err) => {
              if(err === null){
                  // console.log("[api/user/postAvatar] #A-dir-creeat Încă nu am directorul în care să scriu fișierul. Urmează!!!");
                  cb(null, calea); // scrie fișierul aici!
                  /* Fii foarte atent la `null` pentru că anunți multer că nu ai erori și este OK să-l stocheze pe disc */             
              } else {
                  console.error("[api/user/postAvatar] #Eroare-pe-toata-linia Nu am putut scrie fișierul cu următoarele detalii ale erorii", err);
                  logger.error(err);
              }
          });
      } else {
          /* === SCRIE DEJA ÎN DIRECTORUL EXISTENT === */
          // console.log("[api/user/postAvatar] #B Directorul există și poți scrie liniștit în el!!!");
          cb(null, calea);
      }
    });
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
});
const uploadavatar = multer({storage: avatarstorage});

// Cere gestionarul pentru versiunea 1
let {currentUser, createUser, loginUser, patchUser, userLogout, postAvatar} = require('./api/v1/users');
let {getREDs, getRED, postRED, putRED, delRED} = require('./api/v1/reds');

// USER
router
    .post('/user/login', passport.authenticate('local'), loginUser)
    .patch('/user/:id', patchUser)
    .post('/user/create', createUser)
    .get('/user/current', passport.authenticate('jwt', {session: false}), currentUser)
    .post('/user/avatar', uploadavatar.any(), postAvatar)
    .post('/user/logout', userLogout);

// REDS
router
    .route('/red')
    .get(getREDs)
    .post(postRED);

router
    .route('/red/:id', passport.authenticate('jwt', {session: false}))
    .get(getRED)
    .post(postRED)
    .put(putRED)
    .delete(delRED);

module.exports = router;