require('dotenv').config();
const fs           = require('fs-extra');
var BagIt          = require('bagit-fs');
const express      = require('express');
const router       = express.Router();
const {v4: uuidv4} = require('uuid'); 
// pentru a accesa variabilele setate de socket-ul care creează bag-ul.
// const sockets      = require('./sockets');

const passport     = require('passport');
// Încarcă controlerul necesar tratării rutelor de autentificare
const UserPassport = require('./controllers/user.ctrl')(passport);

/* === ÎNCĂRCAREA UNUI fișier cu `multer` === */
var multer = require('multer');

module.exports = function uploader (pubComm) {
    /* === FUNCȚII HELPER PENTRU LUCRUL CU SOCKET-URI */
    // EMIT
    function rre (nameEvt, payload) {
        pubComm.on('connect', socket => {
            // socket.handshake.headers
            // console.log(`socket.io connected: ${socket.id}`);
            // save socket.io socket in the session
            // console.log("session at socket.io connection:\n", socket.request.session);
            socket.request.session.socketio = socket.id;
            socket.request.session.save();
            return socket.emit(nameEvt, payload);
        });
    }

    // ON
    function rro (nameEvt, cb) {
        pubComm.on('connect', socket => {
            // socket.handshake.headers
            // console.log(`socket.io connected: ${socket.id}`);
            // save socket.io socket in the session
            // console.log("session at socket.io connection:\n", socket.request.session);
            socket.request.session.socketio = socket.id;
            socket.request.session.save();
            return socket.on(nameEvt, cb);
        });
    }

    // distruge fișierul dacă obiectul `destination` nu este primit
    function destroyFile(req, file, cb) {
        cb(null, '/dev/null');
    }
    // Creează clasa Multer2Bag
    function Multer2Bag (opts) {
        this.getDestination = (opts.destination || destroyFile);
    }
    
    Multer2Bag.prototype._handleFile = function _handleFile (req, file, cb) {
        this.getDestination(req, file, function clbkGetDest (err, path) {
            // console.log('[upload.js] Am să scriu fișierul în calea: ', path);
            
            // Afișează posibile erori
            if (err) return cb(err);
    
            let contactName;
            req.user.googleProfile ? contactName = req.user.googleProfile.name : contactName = req.user.username;
            var bag = BagIt(path, 'sha256', {'Contact-Name': `${contactName}`});
            var fileName = file.originalname;
    
            // asigură originalitatea fișierelor dacă fișierele au numele și extensia generice `image.png`
            if (file.originalname === 'image.png') {
                fileName = file.originalname + `${Date.now()}`;
            }
            
            let destination = bag.createWriteStream(fileName);
            file.stream.pipe(destination);
            // https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
            destination.on('finish', function () {
                // trimite clientului uuid-ul creat pentru fișierul încărcat ca PRIMA RESURSĂ
                if (!lastUuid) {
                    // dacă nu ai lastUuid, nu declanșa `uuid`
                    pubComm.emit('uuid', lastUuid);
                }
                cb(null, {
                    path: path
                });
            })

            destination.on('close', () => {
                file.stream.destroy();
            })

            destination.on('error', () => {
                file.stream.destroy();
            });

            file.stream.on('error', () => {
                destination.destroy();
            });

            file.stream.on('end', () => {
                destination.destroy();
            });
        });
    };
    
    Multer2Bag.prototype._removeFile = function _removeFile (req, file, cb) {
        fs.unlink(file.path, cb);
    };

    var lastUuid = '';

    /*
    * Funcția are rolul de callback pentru rro()
    */
    function clbkOnUUID (token) {
        // console.log("TOKENUL primit este ", token);
        lastUuid = token;
        if (lastUuid) {
            rre('uuid', lastUuid);
        }
    }

    // rre('uuid', {requested: true});
    rro('uuid', clbkOnUUID);

    // setează destinația fișierului
    function destination (req, file, cb) {
        // console.log("Valoarea lui lastUuid este ", lastUuid);
        
        pubComm.emit('uuid', {requested: true});

        // dacă nu ai lastUuid, înseamnă că ai de-a face cu prima resursă. Generează de aici uuid-ul
        if (lastUuid == '') {
            lastUuid = uuidv4();
            // imediat ce l-ai creat, actualizează-l și în client
            pubComm.emit('uuid', lastUuid);
        }

        let calea = `${process.env.REPO_REL_PATH}${req.user.id}/${lastUuid}/`;
        // console.log('[upload.js] calea formată în destination pe care se vor scrie fișierele este ', calea);

        /* === Directorul utilizatorului nu există. Trebuie creat !!!! === */
        if (!fs.existsSync(calea)) {
            cb(null, calea);// introdu primul fișier aici.
        } else if(fs.existsSync(calea)) {
            // păstrează spațiile fișierului original dacă acestea le avea. La întoarcere în client, va fi un path rupt de spații.
            cb(null, calea);
        }
    }

    var objConf = {
        destination: destination,
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }        
    }

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
            "application/octet-stream": ".zip",
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
        limits: {
            // fileSize: 1024 * 1024 * 5 // limitarea dimensiunii fișierelor la 5MB
            fileSize: process.env.FILE_LIMIT_UPL_RES
        },
        fileFilter
    }); // multer() inițializează pachetul

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
}