require('dotenv').config();
const mongoose = require('mongoose');

exports.statsmgdb = () => {
    mongoose.connection.db.listCollections().toArray(function(err, names) {
        if (err) {
            console.error(err);
        }
        else {
            console.log(this);
            // pubComm.emit('statsmgdb', names);
            // console.log(names);
            names.forEach(function(e,i,a) {
                console.log("Nume colecție: ", e.name);
            });
        }
    });
}