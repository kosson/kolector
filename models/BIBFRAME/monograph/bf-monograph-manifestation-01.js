const mongoose = require('mongoose');
const { Schema } = mongoose;

const monographManifestation = new Schema({
    administrative: {
        id: "lc:RT:bf2:Monograph:RelatedInstance",
        uri_reference: "http://id.loc.gov/ontologies/bflc/Relationship",
        author: "NDMSO"
    },
    relatedTo: "", // http://id.loc.gov/ontologies/bibframe/relatedTo {mandatory: false, repetable: true}
    other_format: "", // http://id.loc.gov/ontologies/bibframe/hasEquivalent {mandatory: false, repetable: true}
    accompaniedBy: "", // http://id.loc.gov/ontologies/bibframe/accompaniedBy {mandatory: false, repetable: true}
    reprinted: "", // http://id.loc.gov/ontologies/bibframe/hasEquivalent {mandatory: false, repetable: true}
    relation: "", // http://id.loc.gov/ontologies/bflc/relation {mandatory: false, repetable: true}
});

module.exports = monographManifestation;