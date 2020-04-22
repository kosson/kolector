require('dotenv').config();
const esClient = require('../../elasticsearch.config');
/**
 * Funcția are rolul de a verifica dacă indexul (aliasul) există.
 * Dacă indexul nu există va fi creat și va fi indexat primul document.
 * În cazul în care indexul există, va fi indexat documentul dacă acesta nu există deja în index.
 * @param {Object} data Este un obiect care mapează documentul Mongoose și constituie un POJO nou remodelat dacă e nevoie
 * @param {String} idx Este un string din .env cu numele indexului ES pentru care s-a constituit alias-ul
 * @param {String} aliasidx Este un string din .env cu numele indexului alias la care trebuie indexată înregistrarea
 */
exports.searchIdxAlCreateDoc = async function searchCreateIdx (schema, data, idx, aliasidx) {
    // console.log(data, idx, aliasidx);
    try {
        // fii foarte atent, testează după alias, nu după indexul pentru care se creează alias-ul.
        await esClient.indices.exists(
            {index: aliasidx}, 
            {errorTrace: true}
        ).then(async function clbkAfterExist (rezultat) {
            //console.log(rezultat);
            try {                    
                if (rezultat.statusCode === 404) {
                    console.log("Indexul și alias-ul nu există. Le creez acum!");
                    
                    // creează indexul
                    await esClient.indices.create({
                        index: idx,
                        body:  schema
                    },{errorTrace: true});

                    // creează alias la index
                    await esClient.indices.putAlias({
                        index: idx,
                        name:  aliasidx
                    },{errorTrace: true});
                    
                    // INDEXEAZĂ DOCUMENT!!!
                    await esClient.create({
                        id:      data.id,
                        index:   aliasidx,
                        refresh: true,
                        body:    data
                    });
                } else {
                    // Verifică dacă nu cumva documentul deja există în index
                    const {body} = await esClient.exists({
                        index: aliasidx,
                        id:    data.id
                    });
                    
                    if (body == false) {            
                        // INDEXEAZĂ DOCUMENT!!!
                        await esClient.create({
                            id:      data.id,
                            index:   aliasidx,
                            refresh: true,
                            body:    data
                        });
                    }
                }
            } catch (error) {
                if (error) {
                    console.error(JSON.stringify(error.body, null, 2));
                }
            }
        });
    } catch (error) {
        console.error(JSON.stringify(error.body, null, 2));  
    }
};

exports.recExists = async function recExists (id, idx) {
    try {
        const {body} = await esClient.exists({
            index: idx,
            id: id
        });
        return body;
    } catch (error) {
        console.error(JSON.stringify(error.body, null, 2));
    }
};

exports.deleteIndex = function (idx) {
    console.log('Deleting old index ...');

    return client.indices.delete({
        index: idx,
        ignore: [404]
    }).then(function clbkDelIdx (body) {
        if (!body.error) {
            console.log('\x1b[32m' + 'Am șters indexul fără probleme' + '\x1b[37m');
        } else {                        
            console.log('\x1b[33m' + 'Nu am reușit să șerg indexul' + '\x1b[37m');
        }
    });
}