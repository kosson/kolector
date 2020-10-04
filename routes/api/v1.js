require('dotenv').config();
const RedModel = require('../../models/resursa-red');

// Cere helperul `checkRole` cu care verifică dacă există rolurile necesare accesului
let checkRole = require('../controllers/checkRole.helper');
// Cere wrapper-ul de tratare a funcțiilor async
let asyncHandler = require('../utils/async_helper');

// @desc   adu-mi toate RED-urile
// @route  GET /api/v1/getREDs
// @acces  privat
exports.getResources = asyncHandler(async function getREDs (req, res, next) {
        // ACL
        let roles = ["user", "validator", "cred"];

        // poți pune în parametrii query criterii de rafinare a rezultatelor, 
        // de ex: /resurse?accesari[lte]=100 sau ?accesari[gt]=10 sau ?accesari[gt]=10& sau ?accesari[gt]=10&util=true
        // sau poți introduce câmpurile necesare unui select, precum în ?accesari[gt]=10&util=true&select=nume,varsta
        let query;
        const reqQuery = {...req.query}; // contituie o copie a obiectului pentru a putea prelucrări cereri de filtrare complexe
        // câmpuri pentru excluderea din rezultat -> sunt părți din query string care sunt folosite pentru rafinarea interogării
        const removeFields = ['select', 'sort', 'page', 'limit']; // uneori este necesara să pasezi parametri care să nu intre în rezultatul de căutare, dar necesari pentru filtrare folosind mongoose (query.select).
        // Ia rând pe rând din array-ul câmpurilor pentru excludere și șterge-le din obiectul req.params
        removeFields.forEach(param => delete reqQuery[param]);

        let queryStr = JSON.stringify(reqQuery); // transformă obiectul în text.
        // crearea operatorilor de lucru pentru MongoDB.

        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`); // întoarce operatorul cu un $ în față necesar query-urilor MongoDB.
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
        let page       = parseInt(req.query.page, 10) || 1;    // preia pagina iar dacă aceasta nu este menționată, din oficiu va fi 1
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
exports.getResource = asyncHandler(async function getRED (req, res, next) {
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
exports.postResource = asyncHandler(async function postRED (req, res, next) {
        // ACL
        let roles = ["user", "validator", "cred"];

        // pe cerere vom avea id-ul utilizatorui -> req.user.id
        const red = await RedModel.create(req.body);

        res.status(201).send({
                success: true,
                data: red
        });
});

// @desc   actualizează un RED
// @route  POST /api/v1/putRED/:idRed
// @access privat
exports.putResource = asyncHandler(async function putRED (req, res, next) {
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
exports.delResource = function delResource (req, res, next) {
        // ACL
        let roles = ["user", "validator", "cred"];
        res.status(201).send({creat: true});
};