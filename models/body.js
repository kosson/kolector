require('dotenv').config();
const mongoose              = require('mongoose');
const bcrypt                = require('bcrypt');
const logger                = require('../util/logger');

/* INDECȘII ES7 */
let {getStructure} = require('../util/es7');
let RES_IDX_ES7 = '';
let RES_IDX_ALS = '';
let USR_IDX_ES7 = ''; 
let USR_IDX_ALS = '';

// console.log("AVEM", getStructure());
getStructure().then((val) => {
    // creează valori default pentru numele indecșilor ES7 necesari în cazul în care indexul și alias-ul său nu au fost create încă
    USR_IDX_ALS = val.USR_IDX_ALS ?? 'users';
    USR_IDX_ES7 = val.USR_IDX_ES7 ?? 'users0';
    RES_IDX_ALS = val.RES_IDX_ALS ?? 'resursedus';
    RES_IDX_ES7 = val.RES_IDX_ES7 ?? 'resursedus0';
}).catch((error) => {
    console.log(`Schema mongoose pentru resurse`, error);
    logger.error(error);
});

// Definirea unei scheme necesare verificării existenței utilizatorului.
let Body = new mongoose.Schema({
    created:  Date,
    name: String,
    acronym: String,
    identifier: [],
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    partof: [],
    comments: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment'
    }
},{
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

// Adăugarea middleware pe `post` pentru a constitui primul index și alias-ul.
Body.post('save', function clbkUsrSave (doc, next) {
    // constituirea unui subset de câmpuri pentru înregistrarea Elasticsearch
    const data = {
        id:      doc._id,
        created: doc.created,
        email:   doc.email,
        name:    doc.name,
        partof:  doc.partof
    };
    // ES7Helper.searchIdxAndCreateDoc(schema, data, process.env.USR_IDX_ES7, process.env.USR_IDX_ALS);
    next(); 
});

module.exports = new mongoose.model('bodie', Body);