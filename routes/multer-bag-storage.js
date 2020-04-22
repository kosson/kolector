var fs       = require('fs-extra');
var path     = require('path');
var BagIt    = require('bagit-fs');

function getDestination (req, file, cb) {
    cb(null, '/dev/null');
}

// Creează clasa Multer2Bag
function Multer2Bag (opts) {
    this.getDestination = (opts.destination || getDestination);
}

Multer2Bag.prototype._handleFile = function _handleFile (req, file, cb) {
    this.getDestination(req, file, function (err, path) {
        if (err) return cb(err);

        var bag = BagIt(path, 'sha256', {'Contact-Name': `${req.user.googleProfile.name}`});
        var fileName = file.originalname;

        // asigură originalitatea fișierelor.
        if (file.originalname === 'image.png') {
            fileName = file.originalname + `${Date.now()}`;
        }
        
        file.stream.pipe(bag.createWriteStream(fileName).on('finish', function () {
            cb(null, {
                path: path
            });
        }));

    });
};

Multer2Bag.prototype._removeFile = function _removeFile (req, file, cb) {
    fs.unlink(file.path, cb);
};

module.exports = function (opts) {
    return new Multer2Bag(opts);
};