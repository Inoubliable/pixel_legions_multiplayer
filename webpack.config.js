const path = require('path');
const webpack = require('webpack');

let public = __dirname + '/public/';

module.exports = {
    entry: public + 'js/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(public, './dist')
    },
    resolve: {
        alias: {
            $: "jquery/src/jquery",
        }
    },
    module: {
        rules: [{
            test: /\.js$/,
            include: [path.resolve(public, "./js/")],
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['env']
                }
            }
        }]
    },
    plugins: [
    ],
    mode: 'production',
    watch: true
};