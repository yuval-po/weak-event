module.exports = {
	mode: 'development',
	devtool: 'source-map',
	entry: './src/index.ts',
	output: {
		filename: 'ts-events.js',
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
