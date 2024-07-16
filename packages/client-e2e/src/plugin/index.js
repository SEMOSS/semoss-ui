/* eslint-disable @typescript-eslint/no-var-requires */
/// <reference types="cypress" />
const webpack = require('@cypress/webpack-preprocessor');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
    const defaults = webpack.defaultOptions;
    delete defaults.webpackOptions.module.rules[0].use[0].options.presets;
    const options = {
        // use the same Webpack options to bundle spec files as your app does "normally"
        // which should instrument the spec files in this project
        webpackOptions: require('../../../client/webpack.config'),
        // watchOptions: {},
    };
    on('file:preprocessor', webpack(options));

    require('@cypress/code-coverage/task')(on, config);
    return config;
};
