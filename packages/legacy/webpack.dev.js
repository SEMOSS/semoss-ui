const { merge } = require('webpack-merge'),
    common = require('./webpack.common.js'),
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin');

const { CUSTOMIZATION } = require('./custom/theme.js');

module.exports = () => {
    return merge(common, {
        mode: 'development',
        stats: {
            children: false,
        },
        output: {
            filename: '[name].js',
            chunkFilename: '[name].js',
        },
        cache: {
            buildDependencies: {
                config: [__filename],
            },
            type: 'filesystem',
            version: 'dev',
        },
        devServer: {
            historyApiFallback: true,
            noInfo: true,
            overlay: true,
            stats: {
                children: false,
            },
        },
        devtool: 'eval',
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[name].css',
                chunkFilename: '[name].css',
            }),
            new HtmlWebpackPlugin({
                scriptLoading: 'blocking',
                template: './core/template.ejs',
                filename: '../index.html',
                inject: false,
                title: CUSTOMIZATION.page.title,
                favicon:CUSTOMIZATION.page.favicon
            }),
        ],
    });
};
