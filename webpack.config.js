
const path = require('path');

module.exports = {
	mode: 'development',
	devtool: 'source-map',
	entry: './src/index.ts',
	output: {
		path: path.resolve(__dirname, 'dist', 'bundle'),
		filename: 'ts-events',
		library: {
			name: 'tsEvents',
			type: 'umd'
		}
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	module: {
		rules: [
			{ test: /\.ts$/, loader: 'ts-loader' }
		]
	}
};
