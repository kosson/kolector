const mongoose = require('mongoose');
const { Schema } = mongoose;

const monographItem = new Schema({
    administrative: {
        id: "", // din oficiu trebuie lc:RT:bf2:Monograph:Item
        uri_reference: "", // http://id.loc.gov/ontologies/bibframe/Item
        author: "", // NDMSO
    },
    title: {
        title_name: "", // https://id.loc.gov/ontologies/bibframe.html#c_Title
        variante: [{
            titlu_serial: "", // https://id.loc.gov/ontologies/bibframe.html#c_KeyTitle
        }], // https://id.loc.gov/ontologies/bibframe.html#c_VariantTitle
    }, // http://id.loc.gov/ontologies/bibframe/title {mandatory: true, repetable: true}
    heldBy: "", // http://id.loc.gov/ontologies/bibframe/heldBy {mandatory: false, repetable: false}
    shelfMark: "", // http://id.loc.gov/ontologies/bibframe/shelfMark {mandatory: false, repetable: true}
    sublocation: "", // http://id.loc.gov/ontologies/bibframe/sublocation {mandatory: false, repetable: true}
    identifiedBy: "", // http://id.loc.gov/ontologies/bibframe/identifiedBy {mandatory: false, repetable: true}
    electronicLocator: "", // http://id.loc.gov/ontologies/bibframe/electronicLocator {mandatory: false, repetable: true}
    note: "", // http://id.loc.gov/ontologies/bibframe/note {mandatory: false, repetable: true}
    usageAndAccessPolicy: "", // http://id.loc.gov/ontologies/bibframe/usageAndAccessPolicy {mandatory: false, repetable: true}
    enumerationAndChronology: "", // http://id.loc.gov/ontologies/bibframe/enumerationAndChronology {mandatory: false, repetable: true}
    custodialHistory: "", // http://id.loc.gov/ontologies/bibframe/custodialHistory {mandatory: false, repetable: true}
    immediateAcquisition: "", // http://id.loc.gov/ontologies/bibframe/immediateAcquisition {mandatory: false, repetable: true}
});

module.exports = monographItem;