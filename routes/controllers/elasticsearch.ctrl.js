const esClient = require('../../elasticsearch.config');

const RESULTS_PER_PAGE = 8;
let page = 1;
let frompg = (page - 1) * RESULTS_PER_PAGE;
let topg = page * RESULTS_PER_PAGE;


/** 
 * Funcția `findInIdx` are rolul de a face căutarea în indexul pe care îl primește
 * @param {String} `idxname` este numele indexului în care se face căutarea
 * @param {String} `queryString` este fragmentul de text după care se face căutarea
 * @param {Array} `TrFaFields` este un array de array-uri cu semnătura [[nume_camp, true], [nume_camp, false]] al câmpurilor boolean care trebuie să filtreze căutarea
*/

exports.findInIdx = async function findInIdx (idxname, queryString, TrFaFields) {
    try {
        let parts = queryString.split(' '); // array părți sintagmă
        console.log(parts);        
        // constituirea array-ului 
        const must_match_all = {
            query: {
                bool: {
                    must: [],
                    filter: []
                }
            },
            size: RESULTS_PER_PAGE,
            // from: frompg,
            // to: topg
        }
        // introdu termenii de căutare la nivel individual în `must` din `must_match_all`
        for (let fragment of parts) {
            let obi_must = {
                multi_match: {
                    query: fragment,
                    fuzziness: "auto",
                    fields: ["title", "description", "autori", "content", "etichete"]
                }
            };
            must_match_all.query.bool.must.push(obi_must);
        }
        // INTRODU CÂMPURILE DUPĂ CARE TREBUIE FĂCUTĂ FILTRAREA
        if (TrFaFields.length >= 1) {
            for (let tfts of TrFaFields) {
                let filter_must = {
                    term: {
                        [tfts[0]]: tfts[1]
                    }
                }
                must_match_all.query.bool.filter.push(filter_must);
            }
        }
        
        const rezultate = await esClient.search({
            index: idxname,
            body: JSON.stringify(must_match_all)
        });
        return rezultate;
    } catch (error) {
        console.log(error);
    }
}

exports.aggFromIdx = async function aggFromIdx (idxname, queryString) {
    try {
        let parts = queryString.split(' '); // array părți sintagmă
        console.log(parts);        
        // constituirea array-ului 
        const must_match_all = {
            size: 0,       
            aggs: {
                docs_per_terms: {
                    terms: {
                        field: "title"
                    }
                }
            }
        }

        console.log(JSON.stringify(must_match_all));
        
        const rezultate = await esClient.search({
            index: idxname,
            body: JSON.stringify(must_match_all)
        });
        return rezultate;
    } catch (error) {
        console.log(error);
    }

    /*
    GET /resedus0/_search
    {
        "size": 0,
        "aggs": {
            "stats_clase": {
                "terms": {
                "field": "level.keyword",
                "missing": "Care nu au bucket",
                "min_doc_count": 0,
                "order": {
                    "_key": "asc"
                }
                },
                "aggs": {
                "discipline_stats": {
                    "terms": {
                    "field": "discipline.keyword",
                    "missing": "neprecizat",
                    "min_doc_count": 0
                    }
                }
                }
            }
        }
    }
    */
}