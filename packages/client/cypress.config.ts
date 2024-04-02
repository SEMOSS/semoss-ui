import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
        env: {
            // user and pass must be updated by user
            user: 'cypress',
            pass: 'Password1!',
            incorrect_user: 'bad_guy',
            incorrect_pass: 'bad_guy_pass',
        },
    },
});
