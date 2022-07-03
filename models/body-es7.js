const bodyES7 = {
    settings: {
        index : {
            number_of_shards: 3, 
            number_of_replicas: 2 
        },
        analysis: {
            analyzer: {
                analizor_user: {
                    tokenizer: "standard",
                    filter: [
                        "apostrophe", 
                        "lowercase",
                        "trim"
                    ]
                }
            }
        }
    },
    mappings: {
        properties: {
            created:    {type: "date"},
            email:      {type: "text", fields: {keyword: {type: "keyword"}}},
            name:       {type: "text", store: true},
            identifier: {type: "text", store: true},
        }
    },
    aliases: {
        bodies: {}
    }
};

module.exports = userES7;