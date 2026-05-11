const path = require("node:path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = {
	entry: {
		background: "./src/background/index.ts",
		content: "./src/content/index.ts",
		panel: "./src/panel/index.tsx",
	},
	output: {
		path: path.resolve(__dirname, "build"),
		filename: "[name].bundle.js",
		clean: true,
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				use: "ts-loader",
				exclude: [/node_modules/, /libs\/(ui|sdk|shared|renderer)/],
			},
			{
				test: /\.(js|jsx)$/,
				use: "babel-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
		],
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
		alias: {
			"@semoss/ui/next": path.resolve(
				__dirname,
				"../../libs/ui/dist/next.mjs",
			),
		},
	},
	plugins: [
		new Dotenv({
			systemvars: true,
		}),
		new CopyPlugin({
			patterns: [
				{ from: "src/manifest.json", to: "manifest.json" },
				{ from: "src/options", to: "options", noErrorOnMissing: true },
				{ from: "src/assets", to: "assets", noErrorOnMissing: true },
				{ from: "src/devtools/devtools.js", to: "devtools.js" },
			],
		}),
		new HtmlWebpackPlugin({
			template: "./src/panel/index.html",
			filename: "panel.html",
			chunks: ["panel"],
		}),
		new HtmlWebpackPlugin({
			template: "./src/devtools/index.html",
			filename: "devtools.html",
			chunks: [],
		}),
	],
	devtool: "cheap-module-source-map",
};
