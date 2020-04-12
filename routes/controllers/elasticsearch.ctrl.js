const esClient = require('../../elasticsearch.config');

const RESULTS_PER_PAGE = 8;
let page = 1;
let frompg = (page - 1) * RESULTS_PER_PAGE;
let topg = page * RESULTS_PER_PAGE;

exports.findInIdx = async function findInIdx (idxname, queryString) {
    try {

        let parts = queryString.split(' '); // array părți sintagmă
        let typedocl = idxname.length - 1; // limita superioară de tăiere
        let typedoc = idxname.substr(0, typedocl); // taie numele indexului pentru a putea completa tipul documentelor.

        console.log(queryString, "în ", idxname);
        
        const body = {
            "query": {
                "query_string": {
                    "query": queryString,
                    "fuzziness": "auto",
                    "fields": ["title", "description", "autori"]
                }
            }
        };

        const must_match_all = {
            query: {
                bool: {
                    must: []
                }
            }
        }

        for (let fragment of parts) {
            let obi_must = {
                multi_match: {
                    query: fragment,
                    fuzziness: "auto",
                    fields: ["title", "description"]
                }
            };
            must_match_all.query.bool.must.push(obi_must);
        }
        
        const rezultate = await esClient.search({
            index: idxname,
            type: typedoc,
            body: JSON.stringify(must_match_all)
            // body: JSON.stringify(body)
        });
        return rezultate;
    } catch (error) {
        console.log(error);
    }
}