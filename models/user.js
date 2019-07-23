// Definirea unei scheme necesare verificării existenței utilizatorului.
var Schema = mongoose.Schema;
var User = new Schema({
    created:  Date,
    email:    String,
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
        rolInCRED: [],
        unitate:   [],
        setRED:    []
    },
    ecusoane:      [], // [experimental] Va implementa standardul Open Badges și va fi cuplat cu atingerea Competențelor Specifice. Un badge poate fi emis pentru o competență sau un grup. https://www.imsglobal.org/sites/default/files/Badges/OBv2p0Final/index.html https://openbadges.org/get-started/
    recomandari:   [], // este o listă cu id-uri de recomandări apărute pentru resursele propuse. Fiecare identificator este un link către textul recomandării.
    REDuriPers:    [{
        type: Schema.Types.ObjectId,
        ref: 'resursedu'
    }], // id-urile red-urilor create de utilizator
    REDuriContrib: [{
        type: Schema.Types.ObjectId,
        ref: 'resursedu'
    }], // id-uri ale red-urilor la care utilizatorul a contribuit
    REDuriFolosite:[{
        type: Schema.Types.ObjectId,
        ref: 'resursedu'
    }], // id-uri de red-uri pe baza cărora a creat propriul RED.
    roluri:        [], // este un set de roluri pe care userul îl are în sistem. Rolurile sunt identificatori ale acestora
    unit:          []  // sunt id-uri ale formelor de organizare în care își desfășoară activitatea.
});
module.exports = mongoose.model('user', User);