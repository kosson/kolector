const mongoose = require('mongoose');
const mexp     = require('mongoose-elasticsearch-xp');

const I18nRed = new mongoose.Schema({
    nume: String,   // 'română'
    codISO: String, // 'ro'
    lang: {
        type: Map,
        of: String
    }
});

// cheile obiectului Map 'lang' vor fi valorile atributelor 'name' și ale id-urilor elementelor din frontend.
// valorile obiectului 'lang' vor fi chiar textele afișate în 'label'-uri

I18nRed.plugin(mexp);

module.exports = new mongoose.model('i18n', I18nRed);