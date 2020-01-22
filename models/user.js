const mongoose = require('mongoose');
const mexp     = require('mongoose-elasticsearch-xp');

// Definirea unei scheme necesare verificării existenței utilizatorului.
var Schema = mongoose.Schema;
var User = new Schema({
    _id: Schema.Types.ObjectId,
    created:  Date,
    email: {
        type: String,
        index: true,
        es_indexed: true
    },
    googleID: String,
    googleProfile: {
        name:          {type: String, es_indexed: true},
        given_name:    {type: String, es_indexed: true},
        family_name:   {type: String, es_indexed: true},
        picture:       String,
        token:         String,
        refresh_token: String,
        token_type:    String,
        expires_in:    String
    },
    roles: {
        admin:     Boolean,
        public:    Boolean, // atunci când o persoană face parte din publicul larg, această proprietate va fi true
        rolInCRED: [],  // este un set de roluri pe care userul îl are în sistem. Rolurile pot fi: "user", "validator"
        unit:      []   // sunt id-uri ale formelor de organizare în care își desfășoară activitatea.
    },
    ecusoane:      [], // [experimental] Va implementa standardul Open Badges și va fi cuplat cu atingerea Competențelor Specifice. Un badge poate fi emis pentru o competență sau un grup. https://www.imsglobal.org/sites/default/files/Badges/OBv2p0Final/index.html https://openbadges.org/get-started/
    recomandari:   [], // este o listă cu id-uri de recomandări apărute pentru resursele propuse. Fiecare identificator este un link către textul recomandării.
    REDuri:        String
},
{ toJSON: {
    virtuals: true
} });

User.plugin(mexp); // indexarea în Elasticsearch

const Resursa = require('./resursa-red');
User.virtual('resurse', {
    ref: 'resursedu', // este numele modelului așa cum a fost exportat
    localField: '_id',  // este conectorul cu id-ul de user care este integrat în înregistrarea de RED.
    foreignField: 'idContributor' // este câmpul cu id-uri de useri. Odată „ajunse” în câmpul virtual `resurse` se vor expanda la întreaga înregistrare pentru acel id
});
//https://mongoosejs.com/docs/populate.html#populate-virtuals

module.exports = mongoose.model('user', User);