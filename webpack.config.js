import path from 'path';

module.exports = {
	mode: "development",
	devtool: "inline-source-map",
	entry: "./app.ts",
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: "ts-events",
		library: {
			name: "tsEvents",
			type: "umd"
		}
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	module: {
		rules: [
			{ test: /\.ts$/, loader: "ts-loader" }
		]
	}
};