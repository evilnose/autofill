const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebPackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: {
        background: './background.main.js',
        content: './content/content.main.js',
        index: './angular-app/index.ts',
    },
    devtool: 'inline-source-map',
    plugins: [
        new CleanWebPackPlugin(['dist']),
        //TODO: we don't need this if we're using angular
        new HtmlWebpackPlugin({
            title: 'Dashboard | Autofill',
            filename: 'index.html',
            chunks: ['index'],
            template: './angular-app/index.html',
        }),
        new CopyWebpackPlugin([
            {from: '../ext_assets', to: './'}
        ]),
        new MomentLocalesPlugin(),
        new webpack.ContextReplacementPlugin(
            // The (\\|\/) piece accounts for path separators in *nix and Windows
            /angular(\\|\/)core/,
            path.resolve(__dirname, './src/angular-app/app'), // location of your src
            {} // a map of your routes
        ),
        new CheckerPlugin(),
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        attrs: [':data-src']
                    }
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.ts$/,
                loaders: [
                    'ts-loader',
                    'angular2-template-loader'
                ],
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    'to-string-loader',
                    // 'style-loader',
                    'css-loader',
                    'sass-loader',
                    {
                        loader: 'postcss-loader', // Run post css actions
                        options: {
                            plugins: function () { // post css plugins, can be exported to postcss.config.js
                                return [
                                    // require('precss'),
                                    require('autoprefixer')
                                ];
                            }
                        }
                    },
                ]
            },
            {
                test: /\.(jpe|jpg|png|gif|svg)(\?.*$|$)/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        outputPath: 'img/',
                        publicPath: 'img/'
                    }
                }]
            },
            {
                test: /\.(woff|woff2|eot|ttf)$/,
                use: {
                    loader: "file-loader",
                    options: {
                        limit: 50000,
                    },
                },
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    watch: true,
    watchOptions: {
        ignored: /node_modules/
    }
};