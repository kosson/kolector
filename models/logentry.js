const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
// const mexp     = require('mongoose-elasticsearch-xp').v7;

var LogentrySchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    date: Date,
    idContributor: {type: String, es_indexed: true},
    autor: {type: String, es_indexed: true},
    creator: [{
        name: String,
        email: String,
        id: []
    }],
    title: {        
        type: String,
        index: true,
        trim: true,
        es_indexed: true
    },
    alias: {
        type: String,
        trim: true
    },
    content: {},
    tags: [],
    contorAcces: Number
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

module.exports = mongoose.model('logentry', LogentrySchema);