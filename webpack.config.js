const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebPackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	entry: {
		background: './src/background.main.js',
		content: './src/content/content.main.js',
		popup: './src/ui/popup/js/popup.js'
	},
	devtool: 'inline-source-map',
	plugins: [
		new CleanWebPackPlugin(['dist_dev']),
		new HtmlWebpackPlugin({
			title: 'Autofill Popup',
			filename: 'popup.html',
			chunks: ['popup'],
			template: './src/ui/popup/index.html'
		}),
		new CopyWebpackPlugin([
			{ from: 'ext_assets', to: './' }
		]),
		// new UglifyJsPlugin({
		// 	test: /\.js($|\?)/i
		// })
	],
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist_dev')
	},
	module: {
		rules: [{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: [{
					loader: 'file-loader',
					options: {
						outputPath: 'img/',
						publicPath: 'img/'
					}
				}]
			}
		]
	}
};