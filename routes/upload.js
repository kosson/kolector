require('dotenv').config();
const fs           = require('fs-extra');
var BagIt          = require('bagit-fs');
const express      = require('express');
const router       = express.Router();
var crypto         = require('crypto');
var mkdirp         = require('mkdirp');
const {pipeline}   = require('stream');

// pentru a accesa variabilele setate de socket-ul care creează bag-ul.
// const sockets      = require('./sockets');

const passport     = require('passport');
// Încarcă controlerul necesar tratării rutelor de autentificare
const UserPassport = require('./authGoogle/google-oauth20.ctrl')(passport);

/* === ÎNCĂRCAREA UNUI fișier cu `multer` === */
var multer = require('multer');

module.exports = function uploader (io) {
    var pubComm = io.of('/redcol'),
        lastUuid = '';

    // distruge fișierul dacă obiectul `destination` nu este primit
    function destroyFile(req, file, cb) {
        cb(null, '/dev/null');
    }

    // OBȚINE UN NUME DE FIȘIER ÎN CAZUL ÎN CARE CEVA S-A PETRECUT ȘI FIȘIERUL E FĂRĂ (poate o folosesc mai târziu în vreun scenariu)
    function getFilename (req, file, cb) {
        crypto.randomBytes(16, function (err, raw) {
            cb(err, err ? undefined : raw.toString('hex'));
        });
    }

    // Creează clasa Multer2Bag :: https://github.com/expressjs/multer/blob/master/StorageEngine.md
    // https://github.com/expressjs/multer/blob/6b5fff5feaf740f249b1b2858e5d06009cbd245c/storage/disk.js#L13
    function Multer2Bag (opts) {
        // console.log("Obiectul opts care intră în custom engine este ", opts);
        // this.getFilename = (opts.filename || getFilename);
        this.getFilename = opts.filename;
        this.getDestination = (opts.destination || destroyFile);
    }
    /* Your engine is responsible for storing the file and returning information on how to access the file in the future. This is done by the _handleFile function. */
    Multer2Bag.prototype._handleFile = function _handleFile (req, file, cb) {
        // extrage uuid din headers
        if (req.header('uuid')) {
            lastUuid = req.header('uuid');
        } else {
            console.error("Nu am primit uuid din header: ", req.header('uuid'));
        }
        // console.log("Valorile din headers sunt: ", req.headers, " și am setat și lastUuid la valoarea ", lastUuid);

        // puntea lexicală necesară
        var that = this;
        
        that.getDestination(req, file, function clbkGetDest (err, destination) {
            // console.log('[routes::upload.js::that.getDestination] #1 Am să scriu fișierul în calea: ', destination);

            if (err) {
                cb(err);
                return next(err);
            }

            that.getFilename(req, file, function clbkGetFilename (err, fileName) {
                // console.log("[routes::upload.js::that.getDestination] #2 Am filename: ", fileName);

                if (err) {
                    cb(err);
                    return next(err);
                }

                // Extrage informația necesară BAG-ului pentru `Contact-Name`
                let contactName, profile = req.user;
                if (profile.hasOwnProperty('googleProfile')) {
                    contactName = profile.googleProfile.name;
                } else {
                    contactName = profile.username;
                }

                var bag = BagIt(destination, 'sha256', {'Contact-Name': `${contactName}`});
                // var fileName = file.originalname;
        
                // asigură originalitatea fișierelor dacă fișierele au numele și extensia generice `image.png`
                if (file.originalname === 'image.png') {
                    fileName = file.originalname + `${Date.now()}`;
                }
                
                /* The file data will be given to you as a stream (file.stream). You should pipe this data somewhere, and when you are done, call cb with some information on the file. */
                let sink = bag.createWriteStream(fileName);
                // file.stream.pipe(sink);

                // https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
                pipeline(file.stream, sink, (error) => {
                    if (error) {
                        // console.error("[upload.js::pipeline] #3-erroare Nu s-a reușit scrierea fișierului în Bag cu următoarele detalii: ", error);
                        return next(error);
                    }

                    /* === VERIFICĂ DACĂ FIȘIERUL CHIAR A FOST SCRIS === */
                    fs.access(`${destination}/data/${file.originalname}`, fs.F_OK, (err) => {
                        if (err) {
                            // console.log("[upload.js] #3-eroare-acces-file Nu am găsit fișierul tocmai scris: ",err);
                            return next(err);
                        }
                        const {size} = fs.statSync(`${destination}/data/${file.originalname}`);
                        /* The information you provide in the callback will be merged with multer's file object, and then presented to the user via req.files */
                        cb(null, {
                            destination: destination,
                            filename: fileName,
                            path: destination,
                            size: size
                        });
                        // console.log("[upload.js] #4 Am scris pe disc ", size," bytes la: ", destination);
                    });
                });                
            });
        });
    };
    
    /*
    Your engine is also responsible for removing files if an error is encountered later on. 
    Multer will decide which files to delete and when. 
    Your storage class must implement the _removeFile function. 
    It will receive the same arguments as _handleFile. 
    Invoke the callback once the file has been removed. 
    */
    Multer2Bag.prototype._removeFile = function _removeFile (req, file, cb) {
        var path = file.path;

        delete file.destination;
        delete file.filename;
        delete file.path;

        fs.unlink(file.path, cb);
    };

    let desiredMode = 0o2775;
    // setează destinația fișierului
    function getDestination (req, file, cb) {
        let calea = `${process.env.REPO_REL_PATH}${req.user.id}/${lastUuid}/`;
        // console.log('[upload.js] calea formată în destination pe care se vor scrie fișierele este ', calea);
        
        /* === VERIFICĂ DIRECTORUL USERULUI === */
        fs.access(calea, function clbkfsAccess (error) {
            /* === DIRECTORUL UUID-ULUI VENIT DIN HEADER NU EXISTĂ === */
            if (error) {
                // console.log("[upload.js] #A La verificarea posibilității de a scrie în directorul userului am dat de eroare: ", error);
                /* === CREEAZĂ DIRECTORUL DACĂ NU EXISTĂ === */
                fs.ensureDir(calea, desiredMode, err => {
                    if(err === null){
                        // console.log("[upload.js] #A-dir-creeat Încă nu am directorul în care să scriu fișierul. Urmează!!!");
                        cb(null, calea); // scrie fișierul aici!                   
                    } else {
                        // console.error("[upload.js] #A-eroare-toata-linia Nu am putut scrie fișierul cu următoarele detalii ale erorii", err);
                        return next(err);
                    }
                });
            } else {
                /* === SCRIE DEJA ÎN DIRECTORUL EXISTENT === */
                // console.log("[upload.js] #B Directorul există și poți scrie liniștit în el!!!");
                // păstrează spațiile fișierului original dacă acestea le avea. La întoarcere în client, va fi un path rupt de spații.
                cb(null, calea);
            }
        });
    }

    var objConf = {
        destination: getDestination,
        filename: function giveMeFileName (req, file, cb) {
            cb(null, file.originalname);
        }        
    };

    /* === CREEAZĂ STORAGE-ul === */
    var storage = new Multer2Bag(objConf);

    // Funcție helper pentru filtrarea extensiilor acceptate
    let fileFilter = function fileFltr (req, file, cb) {
        var fileObj = {
            "image/png": ".png",
            "image/jpeg": ".jpeg",
            "image/jpg": ".jpg",
            "application/pdf": ".pdf",
            "application/msword": ".doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
            "application/vnd.ms-powerpoint": ".ppt",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
            "application/zip": ".zip",
            "application/x-zip-compressed": ".zip",
            "multipart/x-zip": ".zip",
            "application/vnd.oasis.opendocument.text": ".odt",
            "application/vnd.oasis.opendocument.presentation": ".odp"
        };

        if (fileObj[file.mimetype] == undefined) {
            cb(new Error("Formatul de fișier nu este acceptat"), false); // nu stoca fișierul și trimite eroarea
            pubComm.emit('message', 'Formatul de fișier nu este acceptat');
        } else {
            cb(null, true); // acceptă fișierul pentru a fi stocat
        }
    };

    // crearea mecanismului de stocare pentru ca multer să știe unde să trimită
    var upload = multer({
        storage,
        fileFilter,
        limits: {
            files: 5, // permite încărcarea doar a 5 fișiere odată
            fieldSize: 50 * 1024 * 1024,
            // fileSize: 50 * 1024 * 1024  // limitarea dimensiunii fișierelor la 50MB
            fileSize: process.env.FILE_LIMIT_UPL_RES
        }        
    });
    /* === GESTIONAREA rutei /upload === */
    router.post('/',  UserPassport.ensureAuthenticated, upload.any(), function (req, res) {        
        // console.log('Detaliile lui files: ', req.files);
        var fileP = req.files[0].path;
        var parts = fileP.split('/');
        parts.shift(); // necesar pentru a șterge punctul din start-ul căii
        var cleanPath = parts.join('/'); // reasamblează calea curată

        // var fileName = querystring.escape(req.files[0].originalname);
        var fileName = req.files[0].originalname;
        var filePath = `${process.env.BASE_URL}/${cleanPath}data/${fileName}`;
        // console.log('Calea formată înainte de a trimite înapoi: ', filePath);
        
        var resObj = {
            "success": 1,
            "file": {
                "url": `${filePath}`,
                "name": `${fileName}`
            },
            uuid: lastUuid
        };
        res.send(JSON.stringify(resObj));
    });

    return router;
};
