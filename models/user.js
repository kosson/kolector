const mongoose = require('../mongoose.config');
const mexp     = require('mongoose-elasticsearch-xp');
// const resursedu = require('./resursa-red');
// Definirea unei scheme necesare verificării existenței utilizatorului.
var Schema = mongoose.Schema;
var User = new Schema({
    _id: Schema.Types.ObjectId,
    created:  Date,
    email: {
        type: String,
        index: true
    },
    googleID: String,
    googleProfile: {
        name:          String,
        given_name:    String,
        family_name:   String,
        picture:       String,
        token:         String,
        refresh_token: String,
        token_type:    String,
        expires_in:    String
    },
    roles: {
        admin:     Boolean,
        rolInCRED: [],  // este un set de roluri pe care userul îl are în sistem. Rolurile pot fi: "user", "educred", "validator"
        unit:      []   // sunt id-uri ale formelor de organizare în care își desfășoară activitatea.
    },
    ecusoane:      [], // [experimental] Va implementa standardul Open Badges și va fi cuplat cu atingerea Competențelor Specifice. Un badge poate fi emis pentru o competență sau un grup. https://www.imsglobal.org/sites/default/files/Badges/OBv2p0Final/index.html https://openbadges.org/get-started/
    recomandari:   [], // este o listă cu id-uri de recomandări apărute pentru resursele propuse. Fiecare identificator este un link către textul recomandării.
    REDuri:    [{      // lista id-urilor RED-urilor care au fost create de acest user
        type: mongoose.Schema.Types.ObjectId,
        ref: 'resursedu'
    }]
});

User.plugin(mexp);

module.exports = mongoose.model('user', User);