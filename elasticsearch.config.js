const es = require('elasticsearch');
const esClient = new es.Client({
    host: process.env.ELASTIC_URL,
    log: 'trace'
});
esClient.ping({
    // ping usually has a 3000ms timeout
        requestTimeout: 1000
    }, function (error) {
        if (error) {
            console.trace('Clusterul de Elasticsearch nu răspunde!');
        } else {
            console.log('Conectare la Elasticsearch cu succes!');
        }
    });

module.exports = esClient;