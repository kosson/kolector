/**
 * Pentru câmpurile `arieCurriculara`, `level`, `discipline`, `disciplinePropuse`, `competenteGen`
 * se aplică trucul care permite căutarea full-text dar și sortarea. Pentru sortare, 
 * am creat un câmp nou `raw` care nu este analyzed și păstrează o copie completă a șirului de caractere
 */

const resursaRedES7 = {
    settings: {
        index : {
            number_of_shards:   3, 
            number_of_replicas: 2 
        },
        analysis: {
            analyzer: {
                romanianlong: {
                    type: "custom",
                    tokenizer: "standard",
                    char_filter: [
                        "html_strip"
                    ],
                    filter: [
                        "apostrophe", 
                        "lowercase",
                        "trim",
                        "stemmer_cu_ro"
                    ]
                },
                autocomplete: {
                    type: "custom",
                    tokenizer: "standard",
                    char_filter: [
                        "html_strip"
                    ],
                    filter: [
                        "apostrophe", 
                        "lowercase",
                        "trim",
                        "autocomplete_filter"
                    ]
                }
            },
            filter: {
                stemmer_cu_ro: {
                    type: "stemmer",
                    name: "romanian"
                },
                autocomplete_filter: {
                    type: "edge_ngram",
                    min_gram: 1,
                    max_gram: 20
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
            title:            {
                type: "text", 
                analyzer: "autocomplete"
            },
            titleI18n:        [],
            arieCurriculara:  {
                type: "text",
                fields: {
                    keyword: {
                      type: "keyword"
                    }
                }
            },
            level:            {
                type: "text",
                fields: {
                    keyword: {
                      type: "keyword"
                    }
                }
            },
            discipline:       {
                type: "text",
                fields: {
                    keyword: {
                      type: "keyword"
                    }
                }
            },
            disciplinePropuse:{
                type: "text",
                fields: {
                    keyword: {
                      type: "keyword"
                    }
                }
            },
            competenteGen:    {
                type: "text",
                fields: {
                    keyword: {
                      type: "keyword"
                    }
                }
            },
            description:      {
                type: "text",
                analyzer: "romanianlong"
            },
            identifier:       {type: "text", store: true},
            dependinte:       {type: "text"},
            content:          {type: "text"},
            bibliografie:     {type: "text"},
            contorAcces:      {type: "long"},
            generalPublic:    {type: "boolean"},
            contorDescarcare: {type: "long"},
            etichete:         {type: "text", store: true},
            expertCheck:      {type: "boolean"}
        }
    }
};

module.exports = resursaRedES7;