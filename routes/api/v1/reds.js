require('dotenv').config();
const mongoose      = require('mongoose');
const jwt           = require('jsonwebtoken');
const RedModel      = require('../../../models/resursa-red');
const passport      = require('passport');
const localStrategy = require('passport-local').Strategy;
const User          = require('../../../models/user');
const {clbkLogin}   = require('../../authLocal/authL');
const logger        = require('../../../util/logger');

// Cere helperul `checkRole` cu care verifică dacă există rolurile necesare accesului
let checkRole = require('../../controllers/checkRole.helper');
// Cere wrapper-ul de tratare a funcțiilor async
let asyncHandler = require('../../utils/async_helper');

// @desc   adu-mi toate RED-urile
// @route  GET /api/v1/getREDs
// @acces  privat
exports.getREDs = asyncHandler(async function getREDs (req, res, next) {
        // ACL
        let roles = ["user", "validator", "cred"];

        // poți pune în parametrii query criterii de rafinare a rezultatelor,
        // de ex: /resurse?accesari[lte]=100 sau ?accesari[gt]=10 sau ?accesari[gt]=10& sau ?accesari[gt]=10&util=true
        // sau poți introduce câmpurile necesare unui select, precum în ?accesari[gt]=10&util=true&select=nume,varsta
        let query;
        const reqQuery = {...req.query}; // constituie o copie a obiectului pentru a putea face prelucrări / cereri de filtrare complexe
        // câmpuri pentru excluderea din rezultat -> sunt părți din query string care sunt folosite pentru rafinarea interogării
        const removeFields = ['select', 'sort', 'page', 'limit']; // uneori este necesara să pasezi parametri care să nu intre în rezultatul de căutare, dar necesari pentru filtrare folosind mongoose (query.select).
        // Ia rând pe rând din array-ul câmpurilor pentru excludere și șterge-le din obiectul req.params
        removeFields.forEach(param => delete reqQuery[param]);

        let queryStr = JSON.stringify(reqQuery); // transformă obiectul în text.
        // crearea operatorilor de lucru pentru MongoDB.

        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`); //întoarce operatorul cu un $ în față necesar query-urilor MongoDB.
        // căutarea resurselor
        query = RedModel.find(JSON.parse(queryStr)); // trasformă înapoi în obiect

        // selectează câmpurile pe care le dorești în înregistrări [`select` pe query]
        if (req.query.select) {
                // extragi un array din ceva similar cu select=nume,varsta
                const fields = req.query.select.split(',').join(' '); // formează baza metodei `select` a lui Mongoose
                query = query.select(fields); // precizează câmpurile pe care le dorești din întreaga înregistrare
        }

        // selectează câmpurile după care dorești să faci sortarea rezultatelor [`sort` pe query]. Dacă vrei rezultatul inversat, pune un minus la formarea query string-ului din client
        if (req.query.sort) {
                // pentru că dorim sortarea după mai multe câmpuri, în sort, la momentul interogării, se pot preciza aceste cu virgule
                const sortBy = req.query.sort.split(',').join(' ');
                query.sort(sortBy);
        } else {
                // în cazul în care nu ai un criteriu de sortare, este util să faci sortarea după o valoare implicită.
                query = query.sort('-unCriteriuArbitrarStabilit');
        }

        // Paginarea rezultatelor
        let page       = parseInt(req.query.page, 10)  || 1;   // preia pagina iar dacă aceasta nu este menționată, din oficiu va fi 1
        let limit      = parseInt(req.query.limit, 10) || 100; // numărul de înregistrăru din setul de date, dar nu mai mult de 100
        let startIndex = (page - 1) * limit;
        let endIndex   = page * limit;
        let total      = RedModel.count();
        // aplicarea lui skip și a limitării
        query = query.skip(startIndex).limit(limit);

        // execută query-ul
        const reds = await query;

        // Rezultatele paginării
        const pagination = {};

        // dacă nu avem o pagină anterioară, suntem chiar la început, nu vreau să existe o direcție către aceasta, iar următoarea pagină va fi 2
        if (endIndex < total) {
                pagination.next = {
                        page: page + 1,
                        limit
                };
        }

        if (startIndex > 0) {
                pagination.prev = {
                        page: page - 1,
                        limit
                };
        }

        res.status(200).send({
                success: true,
                count: reds.length,
                pagination: pagination,
                data: reds
        });
});

// @desc   adu-mi un singur RED
// @route  GET /api/v1/getRED/:id
// @acces  privat
exports.getRED = asyncHandler(async function getRED (req, res, next) {
        // ACL
        let roles = ["user", "validator", "cred"];

        let resource = await RedModel.findById(req.params.id).populate({
                path: 'comentarii',
                select: 'title content user'
        });

        if (!resource) {
                return next(new ErrorRespose(`Nu există resursa cu id-ul ${req.params.id}`), 404);
        }

        res.status(200).send({
                success: true,
                data: resource
        });
});

// @desc   creează un RED
// @route  POST /api/v1/postRED/:idUser
// @access privat
exports.postRED = asyncHandler(async function postRED (req, res, next) {
        console.log("Dacă primesc userul, ar trebui să am", req.user);

        // ACL
        let roles = ["admin", "user", "validator", "cred"];

        // dacă este admin, să poată încărca în subdirectorul oricărui utilizator.
        // dacă nu este admin, să poată încărca doar în propriul user

        // pe cerere vom avea id-ul utilizatorui -> req.user.id
        // const red = await RedModel.create(req.body);

        next();
});

// @desc   actualizează un RED
// @route  POST /api/v1/putRED/:idRed
// @access privat
exports.putRED = asyncHandler(async function putRED (req, res, next) {
        // ACL
        let roles = ["user", "validator", "cred"];

        const red = await RedModel.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
        });

        res.status(201).send({
                success: true,
                data: red
        });
        res.status(201).send({creat: true});
});

// @desc   șterge un RED
// @route  DELETE /api/v1/delRED/:id
// @access privat
exports.delRED = function delRED (req, res, next) {
        // ACL
        let roles = ["user", "validator", "cred"];
        res.status(201).send({creat: true});
};

// @desc   creează un utilizator
// @route  POST /api/v1/user/create
// @access privat
exports.createUser = function createUser (req, res, next) {
        // Crearea contului!!!
        // metoda este atașată de pluginul `passport-local-mongoose` astfel: schema.statics.register
        User.register(
                new User({
                        _id: mongoose.Types.ObjectId(),
                        username: req.body.email,  // _NOTE: Verifică dacă username și email chiar vin din body
                        email: req.body.email,
                        roles: {
                                admin: false,
                                public: false,
                                rolInCRED: ['general']
                        }
                }),
                req.body.password,
                function clbkAuthLocal (err, user) {
                        if (err) {
                                logger.error(err);
                                console.log('[signup::post]', err);
                        };
                        // dacă nu este nicio eroare, testează dacă s-a creat corect contul, făcând o autentificare
                        var authenticate = User.authenticate();
                                authenticate(req.body.email, req.body.password, function clbkAuthTest (err, result) {
                                if (err) {
                                        logger.error(err);
                                        console.error('[signup::post::authenticate]', err);
                                        return next(err);
                                }
                                // în cazul în care autentificarea a reușit, trimite userul să se logheze.
                                if (result) {
                                        res.status(201).send({user: result});
                                }
                        });
                }
        );
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