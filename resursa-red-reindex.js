require('dotenv').config();
const mongoose      = require('./mongoose.config');
const Resursa       = require('./models/resursa-red');
const CompetentaS   = require('./models/competenta-specifica');
const ES7schemaRED  = require('./models/resursa-red-es7');
const editorJs2TXT  = require('./routes/controllers/editorJs2TXT'); 

const { Client } = require('@elastic/elasticsearch');
const esClient = new Client({
    node: process.env.ELASTIC_URL,
    maxRetries: 5,
    requestTimeout: 60000,
    sniffOnStart: true,
    log: 'trace'
});

const resursaRedES7 = {
    settings: {
        index : {
            number_of_shards: 3, 
            number_of_replicas: 2 
        },
        analysis: {
            analyzer: {
                analizor_red: {
                    tokenizer: "standard",
                    filter: [
                        "apostrophe", 
                        "lowercase",
                        "trim",
                        "stemmer_cu_ro"
                    ]
                }
            },
            filter: {
                stemmer_cu_ro: {
                    type: "stemmer",
                    name: "romanian"
                }
            }
        }
    },
    mappings: {
        properties: {
            date:             {type: "date"},
            idContributor:    {type: "keyword"},
            emailContrib:     {type: "keyword"},
            uuid:             {type: "keyword"},
            autori:           {type: "text"},
            langRED:          {type: "keyword"},
            title:            {type: "text"},
            titleI18n:        {type: "text"},
            arieCurriculara:  {type: "text", fields: {keyword: {type: "keyword"}}},
            level:            {type: "text", fields: {keyword: {type: "keyword"}}},
            discipline:       {type: "text", fields: {keyword: {type: "keyword"}}},
            disciplinePropuse:{type: "text", fields: {keyword: {type: "keyword"}}},
            competenteGen:    {type: "text", fields: {keyword: {type: "keyword"}}},
            rol:              {type: "keyword"},
            abilitati:        {type: "keyword"},
            materiale:        {type: "keyword"},
            grupuri:          {type: "text", fields: {keyword: {type: "keyword"}}},
            domeniu:          {type: "text", fields: {keyword: {type: "keyword"}}},
            functii:          {type: "text", fields: {keyword: {type: "keyword"}}},
            demersuri:        {type: "text", fields: {keyword: {type: "keyword"}}},
            spatii:           {type: "text", fields: {keyword: {type: "keyword"}}},
            invatarea:        {type: "text", fields: {keyword: {type: "keyword"}}},
            description:      {type: "text"},
            identifier:       {type: "text", fields: {keyword: {type: "keyword"}}},
            dependinte:       {type: "text"},
            coperta:          {type: "text", fields: {keyword: {type: "keyword"}}},
            content:          {type: "text"},
            bibliografie:     {type: "text"},
            contorAcces:      {type: "long"},
            generalPublic:    {type: "boolean"},
            contorDescarcare: {type: "long"},
            etichete:         {type: "text", fields: {keyword: {type: "keyword"}}},
            utilMie:          {type: "long"},
            expertCheck:      {type: "boolean"}
        }
    },
    aliases: {
        resedus: {}
    }
};

var RES_IDX_ES7 = 'resedus0';
var RES_IDX_ALS = 'resedus';
var procesate = 0;

/* === CREEAZĂ INDEXUL ȘI ALIASUL */

// Verifică dacă nu cumva există aliasul deja. Șterge-l.
// Verifică dacă nu cumva există indexul cu numele alias-ului! Șterge-l
// Creează indexul nou cu mappingul nou.
// promisiune de verificare alias
let valEx = esClient.indices.existsAlias({name: RES_IDX_ALS});
valEx.then(r => {

    console.log("Verificarea existenței alias-ului: ", r.statusCode);
    // verifică dacă aliasul există. Dacă există, setează o variabilă cu numele actualului index.
    if (r.statusCode == 200) {
        // verifică cui index aparține alias-ul. 
        esClient.cat.aliases({
            name: RES_IDX_ALS,
            format: "json"     
        }, (err, r) => {
            if (err) console.log(err);
            console.log("Rezultatul interogării alias-urilor ", r.body[0].index);
            RES_IDX_ES7 = r.body[0].index;
            console.log("Acum RES_IDX_ES7 are valoarea: ", RES_IDX_ES7);
            
            // creează unul nou incrementând cifra din componența numelui
            let baseNameIdx = RES_IDX_ES7.slice(0, -1);
            let increasedV = parseInt(RES_IDX_ES7.slice(-1));
            increasedV++;
            let newBaseName = baseNameIdx + increasedV;
            // Crează nou index. La momentul creării indexului, se va crea și alias-ul, care are același nume precum cel vechi.
            esClient.indices.create({
                index: newBaseName,
                body: resursaRedES7
            }).then(r => {
                console.log("Am creat indexul nou cu următorul detaliu: ", r.body);
                
                //TODO: Aici vei face reindexarea înregistrărilor din baza de date
                const cursor = Resursa.find({}).populate('competenteS').cursor();
                cursor.eachAsync(doc => {
                    let obi = Object.assign({}, doc._doc);
                    // verifică dacă există conținut
                    var content2txt = '';
                    if ('content' in obi) {
                        content2txt = editorJs2TXT(obi.content.blocks); // transformă obiectul în text
                    }
                    // indexează documentul
                    const data = {
                        id:               obi._id,
                        date:             obi.date,
                        idContributor:    obi.idContributor,
                        emailContrib:     obi.emailContrib,
                        uuid:             obi.uuid,
                        autori:           obi.autori,
                        langRED:          obi.langRED,
                        title:            obi.title,
                        titleI18n:        obi.titleI18n,
                        arieCurriculara:  obi.arieCurriculara,
                        level:            obi.level,
                        discipline:       obi.discipline,
                        disciplinePropuse:obi.disciplinePropuse,
                        competenteGen:    obi.competenteGen,
                        rol:              obi.rol,
                        abilitati:        obi.abilitati,
                        materiale:        obi.materiale,
                        grupuri:          obi.grupuri,
                        domeniu:          obi.demersuri,
                        spatii:           obi.spatii,
                        invatarea:        obi.invatarea,
                        description:      obi.description,
                        dependinte:       obi.dependinte,
                        coperta:          obi.coperta,
                        content:          content2txt,
                        bibliografie:     obi.bibliografie,
                        contorAcces:      obi.contorAcces,
                        generalPublic:    obi.generalPublic,
                        contorDescarcare: obi.contorDescarcare,
                        etichete:         obi.etichete,
                        utilMie:          obi.utilMie,
                        expertCheck:      obi.expertCheck
                    };
                    // creează înregistrare nouă pentru fiecare document în parte
                    esClient.create({
                        id:      data.id,
                        index:   RES_IDX_ALS,
                        refresh: true,
                        body:    data
                    });
                    // Ține contul documentelor procesate
                    ++procesate;                   
                }).then((r) => {
                    console.log("Am indexat un număr de ", procesate, " documente");
                    process.exit();               
                }).catch(e => {
                    if (e) {
                        console.error(e, "M-am oprit la ", procesate, " documente");
                    };
                    process.exit();
                });
            }).catch(e => {
                if (e) throw e;
            });

            // Șterge indexul vechi
            esClient.indices.delete({
                index: RES_IDX_ES7
            }, (error, r) => {
                if (error) console.error(error);
                console.log("Am șters indexul ", RES_IDX_ES7, " vechi cu următoarele detalii: ", r.statusCode);
            });
        });
    } else {
        
        // dacă alias-ul nu există, verifică dacă nu cumva există vreun index cu numele alias-ului. Dacă, da, șterge-l!
        esClient.indices.exists({index: RES_IDX_ALS}).then(r => {
            if (r.statusCode == 200){
                console.log("În schimb există indexul cu numele alias-ului!");
                esClient.indices.delete({
                    index: RES_IDX_ALS
                }).then(r => {
                    console.log("Rezultatul ștergerii indexului care avea numele alias-ului", r.statusCode);
                    // are ca efect ștergerea indexului, cât și a alias-urilor acestuia.
                });
            }
        }).catch(e => console.error);
        
        // Verifică dacă nu cumva există deja indexul pe care vrei să-l creezi. 
        // Dacă există, creează index nou cu versiune incrementată
        // Reindexează înregistrările din baza de date și abia când totul este OK, șterge-l!
        esClient.indices.exists({
            index: RES_IDX_ES7
        }).then(r => {
            if(r.statusCode == 200){
                console.log("Indexul deja există și se procedează la crearea unuia nou.");
                
                // creează-l din nou incrementând cifra din componența numelui
                let baseNameIdx = RES_IDX_ES7.slice(0, -1);
                let increasedV = parseInt(RES_IDX_ES7.slice(-1));
                increasedV++;
                let newBaseName = baseNameIdx + increasedV;
                console.log("Noul nume al indexului este: ", newBaseName);

                // Crează nou index. La momentul creării indexului, se va crea și alias-ul, care are același nume precum cel vechi.
                esClient.indices.create({
                    index: newBaseName,
                    body: resursaRedES7
                }).then(r => {
                    console.log("Am creat indexul nou cu următorul detaliu: ", r.body);
                    
                    //TODO: Aici vei face reindexarea înregistrărilor din baza de date
                    const cursor = Resursa.find({}).populate('competenteS').cursor();
                    cursor.eachAsync(doc => {
                        let obi = Object.assign({}, doc._doc);
                        // verifică dacă există conținut
                        var content2txt = '';
                        if ('content' in obi) {
                            content2txt = editorJs2TXT(obi.content.blocks); // transformă obiectul în text
                        }
                        // indexează documentul
                        const data = {
                            id:               obi._id,
                            date:             obi.date,
                            idContributor:    obi.idContributor,
                            emailContrib:     obi.emailContrib,
                            uuid:             obi.uuid,
                            autori:           obi.autori,
                            langRED:          obi.langRED,
                            title:            obi.title,
                            titleI18n:        obi.titleI18n,
                            arieCurriculara:  obi.arieCurriculara,
                            level:            obi.level,
                            discipline:       obi.discipline,
                            disciplinePropuse:obi.disciplinePropuse,
                            competenteGen:    obi.competenteGen,
                            rol:              obi.rol,
                            abilitati:        obi.abilitati,
                            materiale:        obi.materiale,
                            grupuri:          obi.grupuri,
                            domeniu:          obi.demersuri,
                            spatii:           obi.spatii,
                            invatarea:        obi.invatarea,
                            description:      obi.description,
                            dependinte:       obi.dependinte,
                            coperta:          obi.coperta,
                            content:          content2txt,
                            bibliografie:     obi.bibliografie,
                            contorAcces:      obi.contorAcces,
                            generalPublic:    obi.generalPublic,
                            contorDescarcare: obi.contorDescarcare,
                            etichete:         obi.etichete,
                            utilMie:          obi.utilMie,
                            expertCheck:      obi.expertCheck
                        };
                        esClient.create({
                            id:      data.id,
                            index:   RES_IDX_ALS,
                            refresh: true,
                            body:    data
                        });
                        // Îne contul celor procesate
                        ++procesate;                        
                    }).then((r) => {
                        console.log("Am indexat un număr de ", procesate, " documente");                       
                    }).catch(e => {
                        if (e) {
                            console.error(e, "M-am oprit la ", procesate, " documente");
                        };
                        process.exit();
                    });
                }).catch(e => {
                    if (e) {
                        console.error(e)
                    };
                });

                // Șterge indexul vechi
                esClient.indices.delete({
                    index: RES_IDX_ES7
                }, (error, r) => {
                    if (error) console.error(error);
                    console.log("Am șters indexul vechi cu următoarele detalii: ", r);
                });
            }
        })
        // Creează indexul nou
        esClient.indices.create({
            index: RES_IDX_ES7,
            body: resursaRedES7
        }).then((result) => {
            console.log("Am creat nou index cu următorul rezultat: ", result.body);
            const cursor = Resursa.find({}).populate('competenteS').cursor();
            cursor.eachAsync(doc => {
                let obi = Object.assign({}, doc._doc);
                // verifică dacă există conținut
                var content2txt = '';
                if ('content' in obi) {
                    content2txt = editorJs2TXT(obi.content.blocks); // transformă obiectul în text
                }
                // indexează documentul
                const data = {
                    id:               obi._id,
                    date:             obi.date,
                    idContributor:    obi.idContributor,
                    emailContrib:     obi.emailContrib,
                    uuid:             obi.uuid,
                    autori:           obi.autori,
                    langRED:          obi.langRED,
                    title:            obi.title,
                    titleI18n:        obi.titleI18n,
                    arieCurriculara:  obi.arieCurriculara,
                    level:            obi.level,
                    discipline:       obi.discipline,
                    disciplinePropuse:obi.disciplinePropuse,
                    competenteGen:    obi.competenteGen,
                    rol:              obi.rol,
                    abilitati:        obi.abilitati,
                    materiale:        obi.materiale,
                    grupuri:          obi.grupuri,
                    domeniu:          obi.demersuri,
                    spatii:           obi.spatii,
                    invatarea:        obi.invatarea,
                    description:      obi.description,
                    dependinte:       obi.dependinte,
                    coperta:          obi.coperta,
                    content:          content2txt,
                    bibliografie:     obi.bibliografie,
                    contorAcces:      obi.contorAcces,
                    generalPublic:    obi.generalPublic,
                    contorDescarcare: obi.contorDescarcare,
                    etichete:         obi.etichete,
                    utilMie:          obi.utilMie,
                    expertCheck:      obi.expertCheck
                };
                // creează înregistrare nouă pentru fiecare document
                esClient.create({
                    id:      data.id,
                    index:   RES_IDX_ALS,
                    refresh: true,
                    body:    data
                });
                // Ține contul celor procesate
                ++procesate;
            }).then((r) => {
                console.log("Am indexat un număr de ", procesate, " documente");
                process.exit();                       
            }).catch(e => {
                if (e) {
                    console.error(e, "M-am oprit la ", procesate, " documente");
                };
                process.exit();
            });
        }).catch(e => console.error);
    }
}).catch(e => console.error);