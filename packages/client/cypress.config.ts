import { defineConfig } from 'cypress';

export default defineConfig({
    fixturesFolder: false,
    viewportHeight: 400,
    viewportWidth: 400,
    e2e: {
        setupNodeEvents(on, config) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require('../client/cypress/plugin/index.js')(on, config);
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
