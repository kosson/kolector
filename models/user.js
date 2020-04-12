const mongoose     = require('mongoose');
const Resursa      = require('./resursa-red');
const esClient     = require('../elasticsearch.config');
const userES7      = require('./user-es7');
const editorJs2TXT = require('../routes/controllers/editorJs2TXT'); 
const {renameKeys} = require('./rename-properties-helper');

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

User.post('save', async function clbkUsrSave (doc, next) {
    // console.log(doc);
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

    // const data = renameKeys({_id: "id"}, doc._doc);

    try {
        await esClient.indices.exists(
            {index: 'users'}, 
            {errorTrace: true}
        ).then(async function clbkAfterExist (rezultat) {
            //console.log(rezultat);
            try {
                if (rezultat.statusCode === 404) {
                    console.log("Indexul și alias-ul nu există. Le creez acum!s");
                    
                    // creează indexul
                    await esClient.indices.create({
                        index: "users",
                        body: userES7
                    },{errorTrace: true}).then(r => {
                        console.log('Am creat indexul users cu detaliile: ', r.statusCode);
                    }).catch(e => console.error);

                    // creează alias la index
                    await esClient.indices.putAlias({
                        index: "users",
                        name: "users0"
                    },{errorTrace: true}).then(r => {
                        console.log('Am creat alias-ul users0 cu detaliile: ', r.statusCode);
                    }).catch(e => console.error);
                }                
            } catch (error) {
                if (error) console.error;
            }
        });

        // TRIMITE primul document
        await esClient.create({
            id: data.id,
            index: "users0",
            refresh: "true",
            body: data
        });
        

        // Let's search!
        const { body } = await esClient.search({
            index: 'users0',
            body: {
                query: {
                    match_all: {}
                }
            }
        })
        
        console.log("Am găsit înregistrarea: ", body.hits.hits)
    } catch (error) {
        console.log(error);
        return next();    
    }
    // Indexează-l în Elasticsearch!
    // #1 Mai întâi, vezi dacă indexul există. Dacă nu, creează-l cu mapping dedicat.
    // next();
    // return next();
});

User.virtual('resurse', {
    ref: 'resursedu', // este numele modelului așa cum a fost exportat
    localField: '_id',  // este conectorul cu id-ul de user care este integrat în înregistrarea de RED.
    foreignField: 'idContributor' // este câmpul cu id-uri de useri. Odată „ajunse” în câmpul virtual `resurse` se vor expanda la întreaga înregistrare pentru acel id
});
//https://mongoosejs.com/docs/populate.html#populate-virtuals

module.exports = User;