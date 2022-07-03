require('dotenv').config();
const fs           = require('fs-extra');
var BagIt          = require('bagit-fs');
const express      = require('express');
const router       = express.Router();
var multer         = require('multer');
var crypto         = require('crypto');
var mkdirp         = require('mkdirp');
const {pipeline}   = require('stream');
const logger       = require('../util/logger');
const passport     = require('passport');
const UserPassport = require('./controllers/user.ctrl')(passport); // controlerul necesar tratării rutelor de autentificare

/* === ÎNCĂRCAREA UNUI fișier cu `multer` === */
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
        this.getFilename = opts.filename;
        this.getDestination = (opts.destination || destroyFile);
    }
    /* Your engine is responsible for storing the file and returning information on how to access the file in the future. This is done by the _handleFile function. */
    Multer2Bag.prototype._handleFile = function _handleFile (req, file, cb) {
        // extrage uuid din headers
        if (req.header('uuid')) {
            lastUuid = req.header('uuid');
        } else {
            const errOb = new Error('[upload.js] Nu am primit uuid din header pentru fișierul primit!');
            logger.error(errOb);
            throw errOb;
        }
        // console.log("Valorile din headers sunt: ", req.headers, " și am setat și lastUuid la valoarea ", lastUuid);

        // puntea lexicală necesară
        var that = this;
        
        that.getDestination(req, file, function clbkGetDest (err, destination) {
            // console.log('[routes::upload.js::that.getDestination] #1 Am să scriu fișierul în calea: ', destination);

            if (err) {
                logger.error(err);
                cb(err);
            }

            that.getFilename(req, file, function clbkGetFilename (err, fileName) {
                // console.log("[routes::upload.js::that.getDestination] #2 Am filename: ", fileName);

                if (err) {
                    logger.error(err);
                    cb(err);
                }

                // Extrage informația necesară BAG-ului pentru `Contact-Name`
                let contactName, profile = req.user;
                
                // Tratează cazul în care nu ai `googleProfile` 
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
                pipeline(file.stream, sink, (err) => {
                    if (err) {
                        // console.error("[upload.js::pipeline] #3-erroare Nu s-a reușit scrierea fișierului în Bag cu următoarele detalii: ", error);
                        logger.error(err);
                    }

                    /* === VERIFICĂ DACĂ FIȘIERUL CHIAR A FOST SCRIS === */
                    fs.access(`${destination}/data/${file.originalname}`, fs.F_OK, (err) => {
                        if (err) {
                            // console.log("[upload.js] #3-eroare-acces-file Nu am găsit fișierul tocmai scris: ",err);
                            logger.error(err);
                        }
                        const {size} = fs.statSync(`${destination}/data/${file.originalname}`);
                        /* The information you provide in the callback will be merged with multer's file object, and then presented to the user via req.files */
                        cb(null, {
                            destination: destination,
                            filename:    fileName,
                            path:        destination,
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

    /**
     *Funcția asigură faptul că există directorul în care va fi scris fișierul și spune lui multer că are o destinație
     *Este folosită ca valoare a proprietății `destination` a obiectului de configurare a obiectului `storage`
     * @param {Object} req Obiectul cerere
     * @param {Object} file Obiectul fișier
     * @param {Function} cb Funcție apelată imediat ce destinația a fost setată
     */
    function getDestination (req, file, cb) {
        let calea = `${process.env.REPO_REL_PATH}${req.user.id}/${lastUuid}/`;
        // console.log('[upload.js] calea formată în destination pe care se vor scrie fișierele este ', calea);
        
        /* === VERIFICĂ EXISTENȚA DIRECTORUL USERULUI ȘI CONTINUĂ SCRIEREA ALTOR FIȘIERE DACĂ ACESTA EXISTĂ DEJA === */
        fs.access(calea, function clbkfsAccess (err) {
            /* === DIRECTORUL UUID-ULUI VENIT DIN HEADER NU EXISTĂ === */
            if (err) {
                // console.log("[upload.js] #A La verificarea posibilității de a scrie în directorul userului am dat de eroare: ", error);
                /* === CREEAZĂ DIRECTORUL DACĂ NU EXISTĂ === */
                fs.ensureDir(calea, desiredMode, (err) => {
                    if(err === null){
                        // console.log("[upload.js] #A-dir-creeat Încă nu am directorul în care să scriu fișierul. Urmează!!!");
                        cb(null, calea); // scrie fișierul aici!
                        /* Fii foarte atent la `null` pentru că anunți multer că nu ai erori și este OK să-l stocheze pe disc */             
                    } else {
                        // console.error("[upload.js] #A-eroare-toata-linia Nu am putut scrie fișierul cu următoarele detalii ale erorii", err);
                        logger.error(err);
                    }
                });
            } else {
                /* === SCRIE DEJA ÎN DIRECTORUL EXISTENT === */
                // console.log("[upload.js] #B Directorul există și poți scrie liniștit în el!!!");
                cb(null, calea);
            }
        });
    };

    /**
     *Funcția asigură multer că are un nume de fișier viabil cu care să denumească fișierul scris pe disc
     *Este folosită ca valoare a proprietății `filename` a obiectului de configurare a obiectului `storage`
     * @param {Object} req Obiectul cerere
     * @param {Object} file Obiectul fișier
     * @param {Function} cb Funcție apelată imediat ce destinația a fost setată
     */
    function giveMeFileName (req, file, cb) {
        // păstrează spațiile fișierului original dacă acestea le avea. La întoarcere în client, va fi un path rupt de spații.
        cb(null, file.originalname);
        // REVIEW: Nu este tratat cazul în care cineva încarcă fișiere din diferite surse care poartă același nume...
        // o alternativă ar fi cb(null, new Date().toISOString() + '-' + file.originalname)
    }

    // obiectul care parametrizează obiectul `storage`.
    var objConf = {
        destination: getDestination,
        filename:    giveMeFileName       
    };

    /* === CREEAZĂ STORAGE-ul === */
    var storage = new Multer2Bag(objConf);

    /**
     * Funcție helper pentru filtrarea extensiilor acceptate
     * Este folosită ca valoare în obiectul de configurare a instanței multer()
     * @param {Object} req Obiectul request
     * @param {Object} file conține informații despre fișierul care este încărcat
     * @param {Function} cb o funcție care indică faptul că s-a încheiat filtrarea fișierului după criteriile alese
     */
    let fileFilter = function fileFltr (req, file, cb) {
        //mimetype-uri acceptate pentru fișier
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
            "application/vnd.oasis.opendocument.presentation": ".odp",
            "video/mp4": ".mp4",
            "video/m4v": ".m4v"
        };
        
        // caută dacă există o cheie cu mimetype-ul acceptat
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
