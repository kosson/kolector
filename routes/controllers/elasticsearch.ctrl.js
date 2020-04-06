const esClient = require('../../elasticsearch.config');

exports.findInIdx = async function findInIdx (idxname, queryString) {
    try {

        let tks = queryString.split(' '); 
        console.log(queryString, "în ", idxname);
        
        const body = {
            "query": {
                "query_string": {
                    "query": queryString,
                    "fuzziness": "auto",
                    "fields": ["title", "description", "etichete", "discipline"]
                }
            }
        };
        
        const rezultate = await esClient.search({
            index: idxname,
            body: JSON.stringify(body)
        });
        return rezultate;
    } catch (error) {
        console.log(error);
    }
}