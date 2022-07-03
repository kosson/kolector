require('dotenv').config();
const express = require('express');
const app     = express();

exports.app = function appCreator () {
    return app;
}

exports.http = function httpCreator () {
    return require('http').createServer(app);
}