require('dotenv').config();
const fs          = require('fs-extra');
const archiver    = require('archiver');
const path        = require('path');
const mongoose    = require('mongoose');
const Resursa     = require('../models/resursa-red');           // Adu modelul resursei
const UserSchema  = require('../models/user');                  // Adu schema unui user
// necesare pentru constituirea și gestionarea repo-ului de git
const globby      = require('globby');
const git         = require('isomorphic-git');

// INDECȘII ES7
const RES_IDX_ES7 = redisClient.get("RES_IDX_ES7", (err, reply) => {
    if (err) console.error;
    return reply;
});
const RES_IDX_ALS = redisClient.get("RES_IDX_ALS", (err, reply) => {
    if (err) console.error;
    return reply;
});
const USR_IDX_ES7 = redisClient.get("USR_IDX_ES7", (err, reply) => {
    if (err) console.error;
    return reply;
});
const USR_IDX_ALS = redisClient.get("USR_IDX_ALS", (err, reply) => {
    if (err) console.error;
    return reply;
});