const fs           = require('fs-extra');
const express      = require('express');
const router       = express.Router();
const {v4: uuidv4} = require('uuid'); 
// pentru a accesa variabilele setate de socket-ul care creează bag-ul.
const sockets      = require('./sockets');
const passport     = require('passport');
// Încarcă controlerul necesar tratării rutelor de autentificare
const UserPassport = require('./controllers/user.ctrl')(passport);

/* === ÎNCĂRCAREA UNUI fișier cu `multer` === */
var multer = require('multer');
var multer2bag = require('./multer-bag-storage'); // încarcă mecanismul de storage special construit să gestioneze bag-uri!

module.exports = function (pubComm) {

    var storage = multer2bag({
        destination: function (req, file, cb) {
            // verifică dacă nu cumva mai întâi utilizatorul a ales să încarce o imagine. 
            // În acest caz, lastUuid poartă valoarea setată anterior. Valoarea este setată în variabila `lastUuid` din `sockets.js`
            console.log("Ultimul uuid care ar trebui să fie actualizat în sockets.js are valoarea: ", sockets.lastUuid);
            
            if (!sockets.lastUuid) {
                sockets.lastUuid = uuidv4(); // userul încarcă mai întâi de toate un  fișier tip document. Setezi uuid-ul pentru prima dată.
                console.log("Pentru că nu a fost creat niciun director, acesta va avea uuid-ul setat din multer cu val: ", sockets.lastUuid);
                
                pubComm.emit('uuid', sockets.lastUuid); // trimite clientului numele directorului pe care a fost salvată prima resursă încărcată
            }

            // Aceasta este cale pentru cazul în care nu există un director al resursei deja
            let firstDataPath = `${process.env.REPO_REL_PATH}${req.user.id}/${sockets.lastUuid}`;
            // Aceasta este calea pentru cazul în care deja există creat directorul resursei pentru că a fost încărcat deja un fișier.
            let existingDataPath = `${process.env.REPO_REL_PATH}${req.user.id}/${sockets.lastUuid}`;

            /* === Directorul utilizatorului nu există. Trebuie creat !!!! === */
            if (!fs.existsSync(firstDataPath)) {
                cb(null, firstDataPath);    // introdu primul fișier aici.
            } else if(fs.existsSync(existingDataPath)) {
                // cb(null, existingDataPath); // păstrează spațiile fișierului original dacă acestea le avea. La întoarcere în client, va fi un path rupt de spații.
                cb(null, existingDataPath);
            }
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }        
    });

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
            cb(new Error("file format not valid"), false); // nu stoca fișierul și trimite eroarea
        } else {
            cb(null, true); // acceptă fișierul pentru a fi stocat
        }
    };

    // crearea mecanismului de stocare pentru ca multer să știe unde să trimită
    var upload = multer({
        storage: storage,
        limits: {
            // fileSize: 1024 * 1024 * 5 // limitarea dimensiunii fișierelor la 5MB
            fileSize: process.env.FILE_LIMIT_UPL_RES
        },
        fileFilter: fileFilter
    }); // multer() inițializează pachetul

    
    router.post('/', UserPassport.ensureAuthenticated, upload.any(), function(req, res){        
        // console.log('Detaliile lui files: ', req.files);
        var fileP = req.files[0].path;
        var parts = fileP.split('/');
        parts.shift(); // necesar pentru a șterge punctul din start-ul căii
        var cleanPath = parts.join('/'); // reasamblează calea curată

        // var fileName = querystring.escape(req.files[0].originalname);
        var fileName = req.files[0].originalname;
        var filePath = `${process.env.BASE_URL}/${cleanPath}/data/${fileName}`;
        // console.log('Calea formată înainte de a trimite înapoi: ', filePath);
        
        var resObj = {
            "success": 1,
            "file": {
                "url": `${filePath}`,
                "name": `${fileName}`
            }
        };
        // FIXME: În momentul în care utilizatorul decide să șteargă resursa din fișier, acest lucru ar trebui să se reflecte și pe hard disk.
        // Creează logica de ștergere a resursei care nu mai există în Frontend. Altfel, te vei trezi cu hardul plin de fișiere orfane.
        res.send(JSON.stringify(resObj));
    });

    return router;
}