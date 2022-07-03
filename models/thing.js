const mongoose = require('mongoose');
const { Schema } = mongoose;

// https://omeka.org/classic/docs/Content/Working_with_Dublin_Core/
// https://www.digitalnc.org/partners/describing-your-materials/
// https://www.dublincore.org/specifications/dublin-core/dcmi-terms/
// https://www.dublincore.org/specifications/dublin-core/dces/
// https://github.com/structureddynamics/Bibliographic-Ontology-BIBO

let Thing = new mongoose.Schema({
    res: {
        type: String // http://purl.org/dc/elements/1.1/title Numele elementului așa cum apare în ontologie sau în vocabular
    },
    arca: [], // toți identificatorii pentru această entitate specifică, pot fi termenii unei ontologii sau id-urile și CID-urile altor lucruri (cuvinte alte altui vocabulat...)
    nota: String, // descrierea entității
    cid: [] // pot exista mai multe CID-uri în funcție de codec
});

module.exports = Thing;