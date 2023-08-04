/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const dotenv = require('dotenv');

const LOGO = './src/assets/img/logo.svg';

dotenv.config({ path: './.env.local' });
dotenv.config({ path: './.env' });

const isProduction = process.env.NODE_ENV == 'production';
const ENDPOINT = process.env.ENDPOINT;
const MODULE = process.env.MODULE;

const config = {
    entry: './src/main.tsx',
    performance: {
        hints: false,
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
        // publicPath: '/',
    },
    devServer: {
        host: 'localhost',
        hot: true,
        port: '3000',
        proxy: {
            [MODULE]: {
                target: ENDPOINT,
                changeOrigin: true,
                secure: false,
                preserveHeaderKeyCase: true,
            },
        },
        historyApiFallback: true,
        client: {
            overlay: false,
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'CfG.AI',
            favicon: LOGO,
            scriptLoading: 'module',
            template: './src/template.html',
        }),
        // importMetaEnv.webpack({ example: '.env.local' }),
        new webpack.ProvidePlugin({
            React: 'react',
            ReactDOM: 'react-dom',
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env),
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
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
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
    if (isProduction) {
        config.mode = 'production';
    } else {
        config.mode = 'development';
    }
    return config;
};
