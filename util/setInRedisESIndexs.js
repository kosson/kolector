require('dotenv').config();

/**
 * Funcția setează datele privind indecșii disponibili în Elasticsearch în Redis
 * Este cerută din `elasticsearch.config`
 * @param {object} es7client Este obiectul client de conexiune la Elasticsearch
 * @param {object} redisClient Este clientul neinițializat pentru Redis
 */
module.exports = async function setInRedisESIndexes (es8client, redisClient) {
    try {
        /**
        * Funcția încarcă în REDIS numele indecșilor și ale alias-urilor
        * Funcția investighează ce indecși există deja, dacă aceștia au o formă *canonică*, iar dacă nu (motive istorice)
        * corectează prin constituirea unui index nou după forma canonică (`numeindex0`), 
        * pentru care creează și alias, după care reindexează
        * @param {object} r Obiectul cu informație aferent fiecărui index
        * @returns {object} Obiect de confirmare a reușitei către elasticsearch.config.js
        * 
        */
        async function pushInRedis (r) {
            // console.log("[util/setInRedisEsIndexs::pushInRedis()] Datele despre indici sunt ", JSON.stringify(r));
            // console.log(`[util/setInRedisEsIndexs] Verifică conexiune la  Redis: ${await redisClient.ping()}`);
            
            let idxsMemberArr = Object.keys(r); // extrage un array cu numele indecșilor

            // Există indecși în ES8?
            if (idxsMemberArr.length > 0) {

                // pentru fiecare obiect ce reprezintă câte un index (`d` «descriptor»)
                for (d in r) {
                    let alsr = ''; // alias-ul

                    // Am un nume de index care este format din nume plus versiune, precum în `resedus1` [CANONIC VERSION!]
                    // Extrage alias-ul!!!
                    if ((/(\d{1,})+/g).test(d)) {
                        // taie fragmentul de nume până la cifra care indica versiunea
                        // console.log("[elasticsearch.config.js::clbkIndices()] Pot taia", d.slice(0, d.search(/(\d{1,})+/g)));
                        alsr = d.slice(0, d.search(/(\d{1,})+/g)); // extrage numele alias-ului pentru index
                    }

                    if (redisClient == null) {
                        throw `[util/setInRedisEsIndexs] Clientul Redis nu există. Am primit: ${redisClient}`;
                    }

                    //FIXME: Verifică dacă nu cumva, de la un alt container sau un proces întrerupt abrupt, ai deja date în Redis

                    // setează valorile în Redis
                    switch (alsr) {
                        case "users":
                            console.log(`[util/searchInRedisESIndexs] Am creat `, process.env.APP_NAME + ":es", "USR_IDX_ES7", d);
                            await redisClient.hset( process.env.APP_NAME + ":es", "USR_IDX_ES7", d); // se creează o cheie redcolector:es:USR_IDX_ES7 cu valoarea numele indexului
                            await redisClient.hset( process.env.APP_NAME + ":es", "USR_IDX_ALS", alsr);
                            break;
                        case "resursedus":
                            await redisClient.hset( process.env.APP_NAME + ":es", "RES_IDX_ES7", d);
                            await redisClient.hset( process.env.APP_NAME + ":es", "RES_IDX_ALS", alsr);
                            break;
                    }
                }
            }
        };
        // obține obiectele descriptive aferente fiecărui index
        let es8clientResponse = await es8client.indices.stats({
            index: "*,-.*",
            level: "indices"
        });

        let aliasesArr = [], obiOfIdxs = es8clientResponse["indices"], arrOfIdxsNames = Object.keys(obiOfIdxs);
        for (let idx of arrOfIdxsNames) {
            aliasesArr.push(await es8client.indices.getAlias({
                index: idx
            }));
            await pushInRedis(obiOfIdxs[idx]);
        }
        return {
            succeded: true,
            message: `Redis-ul a fost populat cu date`
        }
        // console.log(`[util/setInRedisESIndexs.js] Alias-urile sunt ${JSON.stringify(aliasesArr)}`);
        // console.log(`[util/setInRedisESIndexs.js] es8clientResponse are datele ${JSON.stringify(es8clientResponse["indices"])}`);
    } catch (error) {
        throw new Error(`[util/setInRedisESIndexs.js] La introducerea numelor indecșilor din ES8 în Redis a apărut eroarea: ${error}`);
    }
}
