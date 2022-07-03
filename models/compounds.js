const mongoose = require('mongoose');

let Compound = new mongoose.Schema({
    _id:  mongoose.Types.ObjectId,
    res: String, // nume/termen ori sintagmă. În cazul unui set/colecție/unitate va fi numele acelei colecții. Poate fi o cale de tip clasificator (thread)
    finger: String, // va fi hash-ul lui res, dacă nu există niciun element în qualifiers. Dacă există va fi hash-ul stringului <res>&qualifier1&qualifier2...
    qualifiers: [], // sunt hash-urile unor altor compounds sau things care în cazul unor cuvinte omografe sau în cazul în care le ai în alte limbi (introduci hash-ul celui corespondent din altă limbă)
    arca: [], // sunt indentificatorii altor compounds sau chiar things care formează împreună o unitate/set. În cazul rolului de cale, vor fi hash-urile componentelor
    cid: [] // sunt hash-urile rezultate din crearea CID-urilor IPLD cu mai multe codecuri, dacă se dorește.
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

module.exports = new mongoose.model('compound', Compound);