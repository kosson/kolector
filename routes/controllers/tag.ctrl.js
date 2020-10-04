const resursaModel  = require('../../models/resursa-red');
const moment        = require('moment');

//TODO: ceea ce este nevoie e o căutare în toate colecțiile MongoDB. Este valabil și pentru Elasticsearch.
/*
O posibilă soluție este https://stackoverflow.com/questions/20056903/search-on-multiple-collections-in-mongodb
*/

module.exports = (param) => {
    // fă o căutare pe toate resursele care au
    return resursaModel.find({
        
    });
};