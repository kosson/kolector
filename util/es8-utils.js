require('dotenv').config();
const Resursa       = require('../models/resursa-red');
const User          = require('../models/user');
const resursaRedES8 = require('../models/resursa-red-es8'); // '-es8' indică faptul că sunt setările și mappingul noului index
const userES8       = require('../models/user-es8');
const logger        = require('./logger');
const {requiredParam} = require('./check-utils');

/*
Această structură are scopul de a oferi informație pentru fiecare index ES8
Cheile obiectului sunt numele de alias. Valoarea este un hash care pune în conexiune mappingul indexului ES8 cu modelul mongoose în baza căruia s-a creat colecția
Structura a fost creată pentru a adresa necesitatea de căutare dinamică în funcție de alias-ul comunicat din browserul clientului.
Această structură evită crearea de hardcodări în funcțiile cu rol de helper în lucrul cu ES8. Este un registru util.
*/
const col2idx = {
    users:      {mapping: userES8,       mongModel: User},
    resursedus: {mapping: resursaRedES8, mongModel: Resursa}
}

/**
 * Funcția are rolul de a verifica dacă indexul și aliasul indexului există.
 * Dacă indexul nu există și în consecință alias-ul, vor fi create.
 * ATENȚIE!! Este rolul apelantului să paseze valori pentru `idx`, cât și pentru `aliasidx`.
 * @param {object} esClient Este instanța clientului de Elasticsearch
 * @param {Object} schema Este schema ES7 în baza căreia creezi index nou în Elasticsearch, dacă acest lucru este necesar!!!
 * @param {String} idx Este un string din Redis cu numele indexului ES pentru care s-a constituit alias-ul
 * @param {String} aliasidx Este un string din .env cu numele indexului alias la care trebuie indexată înregistrarea
 */
exports.searchIdxAndCreateIfNotExists = async function searchIdxAndCreateIfNotExists ({esClient = requiredParam('esClient'), schema = requiredParam('schema'), idx = requiredParam('idx')} = {}) {
    // https://stackoverflow.com/questions/44395313/node-mongoose-how-to-get-a-full-list-of-schemas-documents-and-subdocuments
    // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
    // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/exists_examples.html (verifică dacă un anumit document există)

    try {
        // acest obiect este configurabil fiind folosit mai jos la crearea indexului
        let obi4createIdx = {
            index: `${idx}0`,
            body: {}
        };

        // doar dacă găsești în registrul de mai sus `col2idx` o cheie cu numele indexului pe care dorești să-l creezi
        let foundInRegistry = Object.keys(col2idx).filter((el) => el === idx)[0];
        // dacă acea cheie există, avem și garanția că avem acces la mapping
        if (foundInRegistry !== null) {
            obi4createIdx['body'] = col2idx[foundInRegistry]?.mapping;
            // completează obiectul `obi4createIdx`
        }
        
        // #1 verifică existența indecsului pe care dorești să-l creezi
        // dacă există, API-ul returnează valoarea true
        let idxE = await esClient.indices.exists({
            index: `${idx}*`,
            allow_no_indices: false,
            include_defaults: true,
            ignore_unavailable: false
        });
        
        // #2 dacă indexul nu există, creează-l
        // Tratează ambele cazuri: când se întoarce un obiect de eroare specific sau dacă este returnat un obiect gol (cazul star)
        if (idxE === true) {
            return {
                succeded: false,
                message: `Indexul și alias-ul său există deja`
            };
        } else if (idxE.status === 404 || Object.keys(idxE).length === 0) {
            let r = await esClient.indices.create(obi4createIdx);
            // #3 dacă indexul a fost creat cu succes, creează-i și alias-ul
            if (r.acknowledged) {
                let alias = await esClient.indices.putAlias({index: `${idx}0`, name: idx});
                if (alias.acknowledged) {
                    return {
                        succeded: true,
                        message: `Am creat indexul cu mapping-ul dorit și alias-ul aferent`
                    }
                } else {
                    throw `A apărut o eroare pe lanț și nu a fost creat alias-ul`;
                }
            } else {
                throw `A apărut o eroare la crearea indexului`;
            }
        }
    } catch (error) {
        console.error(JSON.stringify(error.body, null, 2));
        logger.error(error);
    };
};