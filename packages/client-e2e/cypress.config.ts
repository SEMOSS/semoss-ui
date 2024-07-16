import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

export default defineConfig({
    fixturesFolder: false,
    e2e: {
        ...nxE2EPreset(__filename, {
            cypressDir: './src',
            bundler: 'webpack',
            webServerCommands: {
                default: 'nx run client:serve',
                production: 'nx run client:preview',
            },
            ciWebServerCommand: 'nx run client:serve-static',
        }),
        setupNodeEvents(on, config) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require('../client-e2e/src/plugin/index.js')(on, config);
        },
        baseUrl: 'http://localhost:9090',
        env: {
            codeCoverage: {
                exclude: ['cypress/**/*.*'],
            },
            // user and pass must be updated by user
            user: 'cypress',
            pass: 'Password1!',
            incorrect_user: 'bad_guy',
            incorrect_pass: 'bad_guy_pass',
        },
    },
});
