const mongoose = require('mongoose');

const I18n = new mongoose.Schema({
    nume: String,   // 'română'
    codISO: String, // 'ro'
    lang: {
        type: Map,
        of: String
    }
});

// cheile obiectului Map 'lang' vor fi valorile atributelor 'name' și ale id-urilor elementelor din frontend.
// valorile obiectului 'lang' vor fi chiar textele afișate în 'label'-uri

module.exports = new mongoose.model('i18n', I18n);