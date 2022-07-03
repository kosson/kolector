const client = require('../elasticsearch.config');
/**
 * Funcția are rolul de a genera o agregare
 * @param {Object} params sunt parametrii care configurează restul query-ului 
 */
module.exports = async function (params) {
    const q = {
        index: "resursedu",
        body: {
            "size": 0,
            "aggs": {
                "arieCurriculara": {
                    "terms": {
                        "field": "arieCurriculara.raw"
                    },
                    "aggs": {
                        "discipline": {
                            "terms": {
                                "field": "discipline.raw",
                                "missing": "neprecizat",
                                "min_doc_count": 0,
                                "order": {
                                    "_key": "asc"
                                }
                            }
                        },
                        "cadenta": {
                            "date_histogram": {
                                "field": "date",
                                "interval": "week"
                            }
                        }
                    }
                }      
            }
        }
    }

    const {body} = await client.search(q);

    if (body) {
        return body;    
    }
}