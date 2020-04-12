require('dotenv').config();

//FIXME: Clientul de Elasticsearch se va schimba (vezi `npm install @elastic/elasticsearch` 
// https://www.elastic.co/blog/announcing-the-new-elasticsearch-javascript-client-rc1 și https://www.elastic.co/blog/new-elasticsearch-javascript-client-released)
// Încep readaptarea clientului și în aplicație
const { Client } = require('@elastic/elasticsearch');
const client = new Client({
    node: process.env.ELASTIC_URL,
    maxRetries: 5,
    requestTimeout: 60000,
    sniffOnStart: true,
    log: 'trace'
});

client.info((err, info) => {
    if (err) {
        console.log(err);
    } else if (info.statusCode === 200) {
        console.log("Conectare reușită la Elasticsearch pe clusterul cu numele: ", info.body.cluster_name);
    }
});
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html
// module.exports = esClient;
module.exports = client;