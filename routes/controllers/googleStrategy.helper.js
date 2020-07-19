const User = require('../../models/user');
const mongoose  = require('mongoose');

/**
 * Funcția `googleStrategy` are rolul de a crea înregistrările de utilizatori în MongoDB și de a trimite spre indexare lui Elasticsearch obiectul document creat.
 * @param {String} request Este chiar `process.env.GOOGLE_CLIENT_ID`
 * @param {String} accessToken Este chiar `process.env.GOOGLE_CLIENT_SECRET`
 * @param {String} refreshToken Este calea: `process.env.BASE_URL + "/callback"`
 * @param {String} params Este valoarea `'select_account'`
 * @param {Boolean} profile Are valoarea `true`
 * @param {Function} done Callback
 */
function googleStrategy (request, accessToken, refreshToken, params, profile, done) {
    if (profile.googleProfile) {
        avatar = profile.googleProfile.picture;
    } else {
        avatar = '';
    }
    // constituirea obiectului cu date pentru a popula modelul
    const record = {
        _id: new mongoose.Types.ObjectId(),
        avatar,
        email: profile._json.email,
        googleID: profile.id,
        googleProfile: {
            name:          profile._json.name,
            given_name:    profile._json.given_name,
            family_name:   profile._json.family_name,
            picture:       profile._json.picture,
            token:         accessToken,
            refresh_token: refreshToken,
            token_type:    params.token_type,
            expires_in:    params.expires_in
        },
        roles: {
            admin:     false,
            public:    false,
            rolInCRED: [],
            unit:      []
        },
        created: Date.now()
    };

    /* === Crearea primului utilizator [admin] === */
    const userModel = mongoose.model('user', User);

    // numără câte înregistrări sunt în colecție.
    userModel.find().estimatedDocumentCount( async function (err, count) {
        if (err) console.error;
        
        // DACĂ nu găsește nicio înregistrare, creează direct pe prima care va fi și administratorul aplicației
        if (count == 0) {
            record.roles.rolInCRED.push('admin'); // introdu rolul de administrator în array-ul rolurilor
            // FIXME: [ROLURI] Ieși din hardocadarea rolurilor. Constituie un mecanism separat de acordare ale acestora. Primul admin ca trebuie să aibă un mecanism de creare de roluri noi și acordare ale acestora.
            record.roles.rolInCRED.push('cred');  // introdu rolul de user cred în array-ul rolurilor
            record.roles.unit.push('global');     // unitatea este necesară pentru a face segregări ulterioare în funcție de apartenența la o unitate orice ar însemna aceasta
            record.roles.admin = true;

            // Constituie documentul Mongoose pentru modelul `UserModel`.
            const userObj = new userModel(record);
            try {
                // Salvează documentul în bază! 
                // FIXME: Indexează în Elasticsearch!!!.
                await userObj.save(function clbkSaveFromGStrat (err, user) {                
                    if (err) throw new Error('Eroarea la salvarea userului este: ', err.message);
                    console.log("Salvez user în bază!");
                    // console.log(user);
                    done(null, user.toObject({ virtuals: true }));
                });
            } catch (error) {
                console.log(error);
            }
        // DACĂ sunt înregistrări în colecție, caută după email dacă deja există
        } else {
            userModel.findOne({ email: profile._json.email }, (err, user) => {
                if (err) throw new Error('A apărut următoarea eroare la căutarea utilizatorului: ', err.message);    
                // Dacă userul există deja, treci pe următorul middleware.
                if(user) {
                    // console.log(user.roles);
                    // este prelucrat de hook-ul `.post(/^find/` ceea ce implică o indexare în Elasticsearch, dacă nu există deja (vezi schema user).
                    done(null, user); 
                } else {
                    // FIXME: Aici se restricționează accesul la platformă doar celor care au email la domeniul educred.
                    if (profile._json.email.endsWith('@educred.ro')) {
                        record.roles.rolInCRED.push("cred"); // în afară de admin, toți cei care se vor loga ulterior vor porni ca useri simpli
                    } else {
                        // dacă cineva din exteriorul proiectului se înscrie, contul va fi asimilat publicului, fără niciun rol în EDUCRED. Acesta va putea da calificări, pot comenta, etc.
                        record.roles.public = true;
                    }
                    // Dacă NU există acest user în bază, va fi adăugat fără a fi admin. Valabil și pentru EDUCRED și pentru PUBLIC
                    record.roles.admin = false;
                    // TODO: Elaborează pe conceptul de grupuri, subgrupe, relație formatori-curs-formabili
                    record.roles.unit.push('global'); // unitatea este necesară pentru a face segregări ulterioare în funcție de apartenența la o unitate orice ar însemna aceasta
                    
                    // constituie documentul în baza modelului `UserModel` și salvează-l în bază. Atenție, va fi indexat și în Elasticsearch (vezi middleware `save` pe `post`).
                    const newUserObj = new userModel(record);
                    newUserObj.save(function (err, user) {
                        if (err) throw err;
                        // console.log("Salvez user în bază!");
                        done(null, user);
                    });
                }
            });
        }
    });
}

module.exports = googleStrategy;