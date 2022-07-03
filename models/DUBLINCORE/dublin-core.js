const mongoose = require('mongoose');
const { Schema } = mongoose;

// https://omeka.org/classic/docs/Content/Working_with_Dublin_Core/
// https://www.digitalnc.org/partners/describing-your-materials/
// https://www.dublincore.org/specifications/dublin-core/dcmi-terms/
// https://www.dublincore.org/specifications/dublin-core/dces/
// https://github.com/structureddynamics/Bibliographic-Ontology-BIBO

let DC = new mongoose.Schema({
    title: {
        type: String // http://purl.org/dc/elements/1.1/title
    },
    subject: String, // http://purl.org/dc/elements/1.1/subject
    description: String, // http://purl.org/dc/elements/1.1/description
    creator: String,
    source: String,
    publisher: String,
    date: String,
    contributor: String,
    rights: String,
    relation: String,
    format: String,
    language: String,
    type: String,
    identifier: [
        {idname: String, idvalue: String}
    ],
    coverage: String
});

module.exports = DC;