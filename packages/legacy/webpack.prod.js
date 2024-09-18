const { merge } = require('webpack-merge'),
    common = require('./webpack.common.js'),
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    CompressionPlugin = require('compression-webpack-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin');

const { CUSTOMIZATION } = require('./custom/theme.js');

module.exports = () => {
    return merge(common, {
        mode: 'production',
        devtool: false,
        output: {
            filename: '[name].[contenthash].js',
            chunkFilename: '[name].[contenthash].js',
        },
        cache: false,
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[name].[contenthash].css',
                chunkFilename: '[name].[contenthash].css',
            }),
            new CompressionPlugin({
                algorithm: 'gzip',
                test: /\.js$|\.css$|\.html$/,
                exclude: /index.html/,
            }),
            new HtmlWebpackPlugin({
                scriptLoading: 'blocking',
                template: './core/template.ejs',
                filename: '../../../index.html',
                hash: true,
                inject: false,
                title: '',
                favicon: ''
            }),
        ],
    });
};
