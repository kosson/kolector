const mongoose = require('mongoose');
const { Schema } = mongoose;

const monographWork = new Schema({
    administrative: {
        id: "", // modelul trebuie preîncărcat cu următoarea valoare: lc:RT:bf2:Monograph:Work
        uri_reference: "", // http://id.loc.gov/ontologies/bibframe/Work
        author: "" // NDMSO
    },
    creator: [], // http://id.loc.gov/ontologies/bibframe/contribution {mandatory: false, repetable: true}
    genreForm: [], // http://id.loc.gov/ontologies/bibframe/genreForm {mandatory: false, repetable: true}
    originDate: [], // http://id.loc.gov/ontologies/bibframe/originDate {mandatory: false, repetable: true}
    originPlace: {
        place: ""
    },  // http://id.loc.gov/ontologies/bibframe/originPlace {mandatory: false, repetable: true}
    geographicCoverage: "", // http://id.loc.gov/ontologies/bibframe/geographicCoverage {mandatory: false, repetable: true}
    temporalCoverage: "", // http://id.loc.gov/ontologies/bibframe/temporalCoverage {mandatory: false, repetable: true}
    intendedAudience: "", // http://id.loc.gov/ontologies/bibframe/intendedAudience {mandatory: false, repetable: true}
    contribution: "", // http://id.loc.gov/ontologies/bibframe/contribution {mandatory: false, repetable: true}
    note: "", // http://id.loc.gov/ontologies/bibframe/note {mandatory: false, repetable: true}
    dissertation: new Schema({
        type: Boolean,
        degree: String, // http://id.loc.gov/ontologies/bibframe/degree {mandatory: false, repetable: true}
        grantingInstitution: String, // http://id.loc.gov/ontologies/bibframe/grantingInstitution {mandatory: false, repetable: true}
        date: Date, // http://id.loc.gov/ontologies/bibframe/date {mandatory: false, repetable: true}
        note: String, // http://id.loc.gov/ontologies/bibframe/note {mandatory: false, repetable: true}
    }), // http://id.loc.gov/ontologies/bibframe/dissertation {mandatory: false, repetable: true}
    tableOfContents: "", // http://id.loc.gov/ontologies/bibframe/tableOfContents {mandatory: false, repetable: true}
    summary: "", // http://id.loc.gov/ontologies/bibframe/summary {mandatory: false, repetable: true}
    subject: "", // http://id.loc.gov/ontologies/bibframe/subject {mandatory: false, repetable: true}
    classification: "", // http://id.loc.gov/ontologies/bibframe/classification {mandatory: false, repetable: true}
    content: "", // http://id.loc.gov/ontologies/bibframe/content {mandatory: true, repetable: true}
    language: "", // http://id.loc.gov/ontologies/bibframe/language {mandatory: false, repetable: true}
    illustrativeContent: "", // http://id.loc.gov/ontologies/bibframe/illustrativeContent {mandatory: false, repetable: true}
    colorContent: "", // http://id.loc.gov/ontologies/bibframe/colorContent {mandatory: false, repetable: true}
    supplementaryContent: "", // http://id.loc.gov/ontologies/bibframe/supplementaryContent {mandatory: false, repetable: true}
    relationship: "", // http://id.loc.gov/ontologies/bflc/relationship {mandatory: false, repetable: true}
    expressionOf: "", // http://id.loc.gov/ontologies/bibframe/expressionOf {mandatory: false, repetable: true}
    hasInstance: {type: Boolean}, // http://id.loc.gov/ontologies/bibframe/hasInstance {mandatory: false, repetable: true}
    identifies: [], // http://id.loc.gov/ontologies/bibframe/identifies {mandatory: false, repetable: true}
});

module.exports = monographWork;