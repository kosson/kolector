require('dotenv').config();
const mongoose   = require('mongoose');
const { Schema } = mongoose;

const WorkSchema = require('bf-monograph-work-01');
const InstanceSchema = require('bf-monograph-instance-01');
const ItemSchema = require('bf-monograph-item-01');
const ManifestationSchema = require('bf-monograph-manifestation-01');

var MonographProfileSchema = new Schema({
    administrative: {
        id: "lc:profile:bf2:Monograph",
        date: "2017-05-26",
        title: "BIBFRAME 2.0 Monograph",
        uri_reference: "",
        author: "NDMSO",
        remark: ""
    },
    work: WorkSchema,
    instance: InstanceSchema,
    item: ItemSchema,
    manifestation: ManifestationSchema
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

module.exports = mongoose.model('MonographProfile', MonographProfileSchema);