const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
// const mexp     = require('mongoose-elasticsearch-xp').v7;

var LogentrySchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    date: Date,
    idContributor: {type: String, es_indexed: true},
    autor: {type: String, es_indexed: true},
    title: {        
        type: String,  // Aici se introduce titlul lucrării în limba de elaborare
        // validate: {
        //     required: [true, 'Titlul este absolut necesar']
        // },
        index: true,
        trim: true,
        es_indexed: true
    },
    content: {},
    contorAcces: Number
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

// LogentrySchema.plugin(mexp);

module.exports = mongoose.model('logentry', LogentrySchema);