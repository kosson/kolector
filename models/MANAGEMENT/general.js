const mongoose = require('mongoose');

// `focus` are același înțeles precum clasa la elemente. În cazul în care vor fi găzduite mai multe instanțe sub aceeași aplicație, focus va purta alte denumiri.

let MGMTgeneral = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    _v: Number,
    focus: { 
        type: String, 
        default: 'general'
    },
    brand: String,
    publisher: String,
    creator: String,
    description: String,
    contact: String,
    template: { 
        type: String, 
        default: 'k1'
    }
});

module.exports = new mongoose.model('mgmtgeneral', MGMTgeneral);