const path = require('path'),
    webpack = require('webpack'),
    { CleanWebpackPlugin } = require('clean-webpack-plugin'),
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    DotenvPlugin = require('dotenv-webpack');

module.exports = {
    entry: {
        core: './core/entry.js',
    },
    output: {
        // publicPath: './dist/',
        path: path.resolve(__dirname, './dist'),
        assetModuleFilename: 'assets/[hash][ext][query]',
    },
    performance: {
        hints: 'warning',
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                resourceQuery: { not: [/raw/] },
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            // publicPath: '../',
                        },
                    },
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.css$/,
                resourceQuery: { not: [/raw/] },
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    'css-loader',
                ],
            },
            {
                test: /\.html$/,
                resourceQuery: { not: [/raw/] },
                use: {
                    loader: 'html-loader',
                    options: {
                        minimize: true,
                    },
                },
            },
            {
                test: /\.(js|ts)$/,
                resourceQuery: { not: [/raw/] },
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false,
                        presets: ['@babel/preset-env', '@babel/typescript'],
                        plugins: [
                            '@babel/plugin-syntax-dynamic-import',
                            '@babel/proposal-class-properties',
                            '@babel/proposal-object-rest-spread',
                        ],
                    },
                },
            },
            {
                test: /\.(jsx|tsx)$/,
                resourceQuery: { not: [/raw/] },
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false,
                        presets: [
                            '@babel/preset-env',
                            ['@babel/preset-react', { runtime: 'automatic' }],
                            '@babel/typescript',
                        ],
                        plugins: [
                            '@babel/plugin-syntax-dynamic-import',
                            '@babel/proposal-class-properties',
                            '@babel/proposal-object-rest-spread',
                        ],
                    },
                },
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                resourceQuery: { not: [/raw/] },
                type: 'asset',
            },
            {
                test: /\.(woff|woff2|ttf|eot)$/,
                resourceQuery: { not: [/raw/] },
                type: 'asset/resource',
            },
            {
                resourceQuery: /raw/,
                type: 'asset/source',
            },
        ],
    },
    optimization: {
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

        // splitChunks: {
        //     chunks: 'all',
        //     minSize: 30000,
        //     // maxSize: 0,
        //     minChunks: 1,
        //     maxAsyncRequests: 5,
        //     maxInitialRequests: 3,
        //     automaticNameDelimiter: '~',
        //     // automaticNameMaxLength: 30,
        //     name: false,
        //     cacheGroups: {
        //         vendors: {
        //             test: /([\\/]node_modules[\\/]|[\\/]widget-resources[\\/])/,
        //             priority: -10,
        //             chunks: 'all',
        //         },
        //         default: {
        //             minChunks: 2,
        //             priority: -20,
        //             reuseExistingChunk: true,
        //         },
        //     },
        // },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            '@client': path.resolve(__dirname, '../client'),
            images: path.resolve(__dirname, './core/resources/img'),
            theme$: path.resolve(__dirname, './style/src/theme.scss'),
        },
        extensions: [
            '*',
            '.js',
            '.json',
            '.ts',
            '.scss',
            '.css',
            '.jsx',
            '.tsx',
        ],
        modules: [
            'react',
            'core',
            'style',
            'widget',
            'widget-resources',
            'node_modules',
        ],
        fallback: {
            buffer: false,
        },
    },
    plugins: [
        new DotenvPlugin(),
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false,
        }),
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            $: 'jquery',
            'window.jQuery': 'jquery',
            'window.$': 'jquery',
        }),
    ],
};
