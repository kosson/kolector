require('dotenv').config();
const mongoose = require('mongoose');
const esClient = require('../elasticsearch.config');
const userES7  = require('./user-es7');

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
    contributions: []
},
{ toJSON: {
    virtuals: true
}});

/**
 * Funcția are rolul de a verifica dacă indexul (aliasul) există.
 * Dacă indexul nu există va fi creat și va fi indexat primul document.
 * În cazul în care indexul există, va fi creat document dacă acesta nu există deja.
 * @param {Object} doc Este un obiect tip document de Mongoose
 */
async function searchCreateIdx (doc) {
    try {
        // constituirea unui subset de câmpuri pentru înregistrarea Elasticsearch
        const data = {
            id: doc._id,
            created: doc.created,
            email: doc.email,
            roles: {
                admin:     doc.roles.admin,
                public:    doc.roles.public,
                rolInCRED: doc.roles.rolInCRED,
                unit:      doc.roles.unit
            },
            ecusoane: doc.ecusoane,
            constributions: doc.contributions,
            googleID: doc.googleID,
            googleProfile: {
                name: doc.googleProfile.name,
                family_name: doc.googleProfile.family_name
            }
        };

        // fii foarte atent, testează după alias, nu după indexul pentru care se creează alias-ul.
        await esClient.indices.exists(
            {index: process.env.USR_IDX_ALS}, 
            {errorTrace: true}
        ).then(async function clbkAfterExist (rezultat) {
            //console.log(rezultat);
            try {                    
                if (rezultat.statusCode === 404) {
                    console.log("Indexul și alias-ul nu există. Le creez acum!");
                    
                    // creează indexul
                    await esClient.indices.create({
                        index: process.env.USR_IDX_ES7,
                        body: userES7
                    },{errorTrace: true}).then(r => {
                        console.log('Am creat indexul users cu detaliile: ', r.statusCode);
                    }).catch(e => console.error);

                    // creează alias la index
                    await esClient.indices.putAlias({
                        index: process.env.USR_IDX_ES7,
                        name: process.env.USR_IDX_ALS
                    },{errorTrace: true}).then(r => {
                        console.log('Am creat alias-ul users0 cu detaliile: ', r.statusCode);
                    }).catch(e => console.error);
                    
                    // INDEXEAZĂ DOCUMENT!!!
                    await esClient.create({
                        id: data.id,
                        index: process.env.USR_IDX_ALS,
                        refresh: "true",
                        body: data
                    }); 
                } else {
                    // Verifică dacă nu cumva documentul deja există în index
                    const {body} = await esClient.exists({
                        index: process.env.USR_IDX_ALS,
                        id: data.id
                    });
                    
                    if (body == false) {            
                        // INDEXEAZĂ DOCUMENT!!!
                        await esClient.create({
                            id: data.id,
                            index: process.env.USR_IDX_ALS,
                            refresh: "true",
                            body: data
                        }); 
                        console.log("Am reindexat un singur user!");
                    }
                }
            } catch (error) {
                if (error) console.error;
            }
        });
    } catch (error) {
        console.log(error);  
    }
};

// Adăugarea middleware pe `post` pentru a constitui primul index și alias-ul.
User.post('save', function clbkUsrSave (doc, next) {
    searchCreateIdx(doc);
    next(); 
});

// Adăugare middleware pe `post` pentru toate operațiunile `find`
User.post(/^find/, async function clbkUsrFind (doc, next) {
    // Când se face căutarea unui utilizator folosindu-se metodele`find`, `findOne`, `findOneAndUpdate`, vezi dacă a fost indexat. Dacă nu, indexează-l.

    // cazul `find`
    if (Array.isArray(doc)){
        doc.map(async (user) => {
            const {body} = await esClient.exists({
                index: process.env.USR_IDX_ALS,
                id: user._id
            });
            // console.log("Userul este indexat în ES? ", body);            
            if (body == false) {
                // indexează documentul
                searchCreateIdx(user);
            }
        });
    } else {
        searchCreateIdx(doc);
    }
    next();
});

User.virtual('resurse', {
    ref: 'resursedu', // este numele modelului așa cum a fost exportat
    localField: '_id',  // este conectorul cu id-ul de user care este integrat în înregistrarea de RED.
    foreignField: 'idContributor' // este câmpul cu id-uri de useri. Odată „ajunse” în câmpul virtual `resurse` se vor expanda la întreaga înregistrare pentru acel id
});
//https://mongoosejs.com/docs/populate.html#populate-virtuals

module.exports = User;