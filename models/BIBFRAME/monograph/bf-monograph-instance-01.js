const mongoose = require('mongoose');
const { Schema } = mongoose;

const monographInstance = new Schema({
    administrative: {
        id: "lc:RT:bf2:Monograph:Instance",
        uri_reference: "http://id.loc.gov/ontologies/bibframe/Instance",
        author: "NDMSO"
    },
    instanceOf: "", // http://id.loc.gov/ontologies/bibframe/instanceOf {mandatory: false, repetable: false}
    title: "", // http://id.loc.gov/ontologies/bibframe/title {mandatory: true, repetable: true}
    responsibilityStatement: "", // http://id.loc.gov/ontologies/bibframe/responsibilityStatement {mandatory: false, repetable: true}
    editionStatement: "", // http://id.loc.gov/ontologies/bibframe/editionStatement {mandatory: false, repetable: true}
    provisionActivity: "", // http://id.loc.gov/ontologies/bibframe/provisionActivity {mandatory: false, repetable: true}
    provisionActivityStatement: "", // http://id.loc.gov/ontologies/bibframe/provisionActivityStatement {mandatory: true, repetable: true}
    copyrightDate: "", // http://id.loc.gov/ontologies/bibframe/copyrightDate {mandatory: false, repetable: true}
    seriesStatement: "", // http://id.loc.gov/ontologies/bibframe/seriesStatement {mandatory: false, repetable: true}
    seriesEnumeration: "", // http://id.loc.gov/ontologies/bibframe/seriesEnumeration {mandatory: false, repetable: true}
    contribution: "", // http://id.loc.gov/ontologies/bibframe/contribution {mandatory: false, repetable: true}
    issuance: "", // http://id.loc.gov/ontologies/bibframe/issuance {mandatory: true, repetable: true}
    identifiedBy: "", // http://id.loc.gov/ontologies/bibframe/identifiedBy {mandatory: false, repetable: true}
    note: "", // http://id.loc.gov/ontologies/bibframe/note {mandatory: false, repetable: true}
    media: "", // http://id.loc.gov/ontologies/bibframe/media {mandatory: true, repetable: true}
    extent: "", // http://id.loc.gov/ontologies/bibframe/extent {mandatory: false, repetable: true}
    dimensions: "", // http://id.loc.gov/ontologies/bibframe/dimensions {mandatory: false, repetable: true}
    carrier: "", // http://id.loc.gov/ontologies/bibframe/carrier {mandatory: true, repetable: true}
    hasItem: "", // http://id.loc.gov/ontologies/bibframe/hasItem {mandatory: false, repetable: true}
    electronicLocator: "", // http://id.loc.gov/ontologies/bibframe/electronicLocator {mandatory: false, repetable: true}
    projectedProvisionDate: "", // http://id.loc.gov/ontologies/bflc/projectedProvisionDate {mandatory: false, repetable: true}
});

module.exports = monographInstance;