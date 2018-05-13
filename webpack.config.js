const path = require('path');
const webpack = require('webpack');

let public = __dirname + '/public/';

module.exports = {
    entry: {
        'main': public + 'js/main.js',
        'game': public + 'js/game.js',
        'login': public + 'js/login.js',
        'register': public + 'js/register.js',
        'profile': public + 'js/profile.js',
        'waitingRoom': public + 'js/waitingRoom.js',
        'leaderboard': public + 'js/leaderboard.js',
        'home': public + 'js/home.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(public, './dist')
    },
    resolve: {
        alias: {
            $: "jquery/src/jquery",
        },
        extensions: ['.js']
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
    devtool: 'source-map',
    mode: 'production',
    watch: true
};