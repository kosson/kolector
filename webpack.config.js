const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

// assets.js
const Assets = require('./assets');

module.exports = {
    name: 'browser',
    // devtool: 'eval',
    mode: 'development',
    entry: {
        app: "./public/js/main.mjs",
    },
    output: {
        path: __dirname + "/public/bundle",
        filename: "[name].bundle.js"
    },
    plugins: [
        new CopyPlugin({
            patterns: Assets.map(asset => {
                return {
                    from: path.resolve(__dirname, `./node_modules/${asset}`),
                    to: path.resolve(__dirname, './public/lib/npm')
                };
            })
        })

    ],
    devtool: 'source-map'
};