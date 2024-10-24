import { Migration } from './migration.types';

/**
 * @name config
 * @description - This addresses a change in how we store our variables.
 *
 * 1. Simply rename queries to notebooks
 * 2. Remove dependencies
 */
const config: Migration = {
    versionFrom: '1.0.0-alpha.3',
    versionTo: '1.0.0-alpha.4',
    run: (state) => {
        const newState = { ...state };

        // Rename queries
        newState['notebooks'] = newState['queries'];

        // Cleanup unused keys
        delete newState['queries'];
        delete newState['dependencies'];

        return newState;
    },
};

export default config;
