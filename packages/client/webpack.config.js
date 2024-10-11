// eslint-disable-next-line @typescript-eslint/no-var-requires
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { NxReactWebpackPlugin } = require('@nx/react/webpack-plugin');

/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const dotenv = require('dotenv');
// const importMetaEnv = require('@import-meta-env/unplugin');
const BundleAnalyzerPlugin =
    require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

dotenv.config({ path: '../../.env.local' });
dotenv.config({ path: '../../.env' });

const isProduction = process.env.NODE_ENV == 'production';

console.log('isProduction', isProduction);
const config = {
    entry: './src/main.tsx',
    performance: {
        hints: false,
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: isProduction ? '[name].[contenthash].js' : '[name].js',
        clean: true,
    },
    optimization: {
        minimize: !isProduction,
        minimizer: [new TerserPlugin({})],
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: {
            chunks: 'async',
            cacheGroups: {
                defaultVendors: {
                    idHint: 'vendors',
                },
            },
        },
    },
    plugins: [
        new NxAppWebpackPlugin({
            tsConfig: './tsconfig.json',
            compiler: 'babel',
            main: './src/main.tsx',
            babelConfig: 'packages/client/.babelrc',
            // index: './src/template.html',
            baseHref: '/',
            outputHashing:
                process.env['NODE_ENV'] == 'production' ? 'all' : 'none',
            watch: process.env['NODE_ENV'] == 'production' ? false : true,
            nodeOptions: {
                // Specify NODE_OPTIONS here
                // For example, to increase the maximum heap size, you can use:
                NODE_OPTIONS: '--max-old-space-size=8192',
            },
        }),
        new NxReactWebpackPlugin({
            // Uncomment this line if you don't want to use SVGR
            // See: https://react-svgr.com/
            svgr: false,
        }),
        new HtmlWebpackPlugin({
            title: process.env.THEME_TITLE,
            favicon: path.resolve(__dirname, process.env.THEME_FAVICON),
            scriptLoading: 'module',
            template: path.resolve(__dirname, './src/template.html'),
            filename: 'index.html',
        }),

        // importMetaEnv.webpack({ example: '.env.local' }),
        new webpack.ProvidePlugin({
            React: 'react',
            ReactDOM: 'react-dom',
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify({
                ...process.env,
            }),
        }),
        new MiniCssExtractPlugin({
            filename: isProduction ? '[name].[contenthash].css' : '[name].css',
            chunkFilename: isProduction ? '[id].[contenthash].css' : '[id].css',
        }),
        // new webpack.DefinePlugin({
        //     'process.env.NODE_OPTIONS': '--max-old-space-size=8192',
        // }),

        // new MonacoWebpackPlugin({
        //     languages: ['javascript', 'typescript'],
        // }),
        // new BundleAnalyzerPlugin()
        // Add your plugins here
        // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    ],
    module: {
        rules: [
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|jpeg|gif)$/i,
                type: 'asset',
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },

            {
                // when bundling application's own source code
                // transpile using Babel which uses .babelrc file
                // and instruments code using babel-plugin-istanbul
                test: /\.js/,
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                ],
            },
            // Add your rules for custom modules here
            // Learn more about loaders from https://webpack.js.org/loaders/
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, './src'),
            react: path.resolve('./node_modules/react'),
            '@semoss/ui': path.resolve(__dirname, '../../libs/ui/src/index.ts'),
        },
    },
};

module.exports = (_, context) => {
    if (isProduction) {
        config.mode = 'production';
    } else {
        config.mode = 'development';
    }
    return config;
};
