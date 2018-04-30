const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebPackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
// const webpack = require('webpack');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	mode: 'development',
	context: path.resolve(__dirname, 'src'),
	entry: {
		background: './background.main.js',
		content: './content/content.main.js',
		index: './app/index.js',
	},
	devtool: 'inline-source-map',
	plugins: [
		new CleanWebPackPlugin(['dist']),
		//TODO: we don't need this if we're using angular
		new HtmlWebpackPlugin({
			title: 'Dashboard | Autofill',
			filename: 'index.html',
			chunks: ['index'],
			template: './app/index.html',
		}),
		new CopyWebpackPlugin([
			{ from: '../ext_assets', to: './' }
		]),
		new MomentLocalesPlugin,
		// new UglifyJsPlugin({
		// 	test: /\.js($|\?)/i
		// })
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
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			},
			{
				test: /\.scss$/,
				use: [{
						loader: "style-loader" // creates style nodes from JS strings
					},
					{
						loader: "css-loader" // translates CSS into CommonJS
					},
					{
						loader: "sass-loader" // compiles Sass to CSS
					}
				]
			},
			{
				test: /\.(jpe|jpg|png|gif|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
				use: [{
					loader: 'file-loader',
					options: {
						outputPath: 'img/',
						publicPath: 'img/'
					}
				}]
			}
		]
	},
	watch: true,
	watchOptions: {
		ignored: /node_modules/
	}
};