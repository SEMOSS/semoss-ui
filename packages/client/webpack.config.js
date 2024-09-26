/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const dotenv = require('dotenv');
// const importMetaEnv = require('@import-meta-env/unplugin');

dotenv.config({ path: '../../.env.local' });
dotenv.config({ path: '../../.env' });

const isProduction = process.env.NODE_ENV == 'production';

const config = {
    entry: './src/main.tsx',
    performance: {
        hints: false,
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: '',
            favicon: '',
            scriptLoading: 'module',
            template: './src/template.html',
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
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),

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
                use: [
                    'style-loader',
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            esModule: false,
                        },
                    },
                    'css-loader',
                ],
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
        },
    },
};

module.exports = () => {
    console.log('isProduction', isProduction);
    if (isProduction) {
        config.mode = 'production';
    } else {
        config.mode = 'development';
    }
    return config;
};
