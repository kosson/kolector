require('dotenv').config();
const mongoose              = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt                = require('bcrypt');
const jwt                   = require('jsonwebtoken');
const esClient              = require('../elasticsearch.config');
const schema                = require('./user-es7');
// const ES7Helper             = require('./model-helpers/es7-helper');
const logger                = require('../util/logger');

/* INDECȘII ES7 */
let {getStructure} = require('../util/es7');
let RES_IDX_ES7 = '';
let RES_IDX_ALS = '';
let USR_IDX_ES7 = ''; 
let USR_IDX_ALS = '';

// console.log("AVEM", getStructure());
getStructure().then((val) => {
    // creează valori default pentru nume   le indecșilor ES7 necesari în cazul în care indexul și alias-ul său nu au fost create încă
    USR_IDX_ALS = val.USR_IDX_ALS ?? 'users';
    USR_IDX_ES7 = val.USR_IDX_ES7 ?? 'users0';
    RES_IDX_ALS = val.RES_IDX_ALS ?? 'resursedus';
    RES_IDX_ES7 = val.RES_IDX_ES7 ?? 'resursedus0';
}).catch((error) => {
    console.log(`Schema mongoose pentru resurse`, error);
    logger.error(error);
});

// Definirea unei scheme necesare verificării existenței utilizatorului.
let User = new mongoose.Schema({
    created:  Date,
    avatar: String,
    name: String,
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true,
        validate(value){
            if (!validator.isEmail(value)) {
                throw new Error('Email nevalid');
            }
        }
    },
    googleID: String,
    googleProfile: {
        name:          {type: String},
        given_name:    {type: String},
        family_name:   {type: String},
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
    contributions: [],
    comments: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment'
    },
    token: String,
    salt: String,
    hash: String
},{
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

// Adăugarea middleware pe `post` pentru a constitui primul index și alias-ul.
User.post('save', function clbkUsrSave (doc, next) {
    // constituirea unui subset de câmpuri pentru înregistrarea Elasticsearch
    const data = {
        id:              doc._id,
        created:         doc.created,
        avatar:          doc.avatar,
        name:            doc.name,
        email:           doc.email,
        roles: {
            admin:       doc.roles.admin,
            public:      doc.roles.public,
            rolInCRED:   doc.roles.rolInCRED,
            unit:        doc.roles.unit
        },
        ecusoane:        doc.ecusoane,
        constributions:  doc.contributions,
        googleID:        doc.googleID,
        googleProfile: {
            name:        doc.googleProfile.name,
            family_name: doc.googleProfile.family_name
        }
    };
    // ES7Helper.searchIdxAndCreateDoc(schema, data, process.env.USR_IDX_ES7, process.env.USR_IDX_ALS);
    next(); 
});

// Adăugare middleware pe `post` pentru toate operațiunile `find`
// User.post(/^find/, async function clbkUsrFind (doc, next) {
//     // Când se face căutarea unui utilizator folosindu-se metodele`find`, `findOne`, `findOneAndUpdate`, vezi dacă a fost indexat. Dacă nu, indexează-l!
//     try {
//         // cazul `find` când rezultatele sunt multiple.
//         if (Array.isArray(doc)){
//             doc.map(async function mapperClbkUsr (user) {
//                 const {body} = await esClient.exists({
//                     index: USR_IDX_ALS,
//                     id: user._id
//                 });
//                 // console.log("Userul este indexat în ES? ", body);            
//                 if (body == false) {
//                     // indexează documentul
//                     const data = {
//                         id:              user._id,
//                         created:         user.created,
//                         email:           user.email,
//                         roles: {
//                             admin:       user.roles.admin,
//                             public:      user.roles.public,
//                             rolInCRED:   user.roles.rolInCRED,
//                             unit:        user.roles.unit
//                         },
//                         ecusoane:        user.ecusoane,
//                         constributions:  user.contributions,
//                         googleID:        user.googleID,
//                         googleProfile: {
//                             name:        user.googleProfile.name,
//                             family_name: user.googleProfile.family_name
//                         }
//                     };
//                     ES7Helper.searchIdxAlCreateDoc(schema, data, USR_IDX_ES7, USR_IDX_ALS);
//                 }
//             });
//         } else {
//             const data = {
//                 id:              doc._id,
//                 created:         doc.created,
//                 email:           doc.email,
//                 roles: {
//                     admin:       doc.roles.admin,
//                     public:      doc.roles.public,
//                     rolInCRED:   doc.roles.rolInCRED,
//                     unit:        doc.roles.unit
//                 },
//                 ecusoane:        doc.ecusoane,
//                 constributions:  doc.contributions,
//                 googleID:        doc.googleID,
//                 googleProfile: {
//                     name:        doc.googleProfile.name,
//                     family_name: doc.googleProfile.family_name
//                 }
//             };
//             ES7Helper.searchIdxAlCreateDoc(schema, data, USR_IDX_ES7, USR_IDX_ALS);
//         }
//     } catch (error) {
//         console.error(JSON.stringify(error, null, 2));
//         logger.error('[models::user::POST-find-hook]', error.message);
//     }
//     next();
// });

// _TODO: Atunci când ștergi un utilizator, generează o mare arhivă cu propriile conținuturi
// Înainte să ștergi un utilizator, șterge-i toate comentariile dacă există vreunul.
User.pre('remove', async function (next) {
    // în cazul în care vrem să-i ștergem comentariile
    await this.model('Comment').deleteMany({
        user: this._id // toate înregistrările care vor avea la `user` id-ul prezentului user, vor fi șterse.
    });
    // NOTE: Verifică ca în punctul în care faci ștergerea să faci căutarea cu `findById` și pe ce găsești aplici `remove()`. Este necesar pentru a declanșa acest middleware
    next();
});

// Câmpul virtual pe care-l creăm se va numi `resurse`. În momentul în care faci căutarea după useri, nu uita că `populate('resurse')` face hidratarea după `find`!!!
User.virtual('resurse', {
    ref: 'resursedu', // este numele modelului așa cum a fost exportat
    localField: '_id',  // este conectorul cu id-ul de user care este integrat în înregistrarea de RED.
    foreignField: 'idContributor' // este câmpul cu id-uri de useri. Odată „ajunse” în câmpul virtual `resurse` se vor expanda la întreaga înregistrare pentru acel id
});
//https://mongoosejs.com/docs/populate.html#populate-virtuals

// Verificarea credențialelor în cazul folosirii jsontoken
// Metoda statică poate fi accesată din model (static -> metodele modelului creat)
User.static.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    if (!user) {
        throw new Error('Logare eșuată!');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Logare eșuată!');
    }
    return user;
};

// module.exports = User;
/**
 * Modelul mongoose pentru un User
 */
module.exports = new mongoose.model('user', User);