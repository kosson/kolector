const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

// Body
const BodySchema = require('./body');
const Body = mongoose.model('Body', BodySchema);

var LogentrySchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    date: Date,
    idContributor: {type: String, es_indexed: true},
    autor: {type: String, es_indexed: true},
    creator: [],
    title: {        
        type: String,
        index: true,
        trim: true,
        es_indexed: true
    },
    ispartof: [],
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