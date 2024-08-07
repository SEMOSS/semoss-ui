import { Migration } from './migration.types';

/**
 * @name config
 * @description - This addresses a change in how we store our variables.
 *
 * 1. Look at our variables and see if we have the reference value in our state.  If not delete that variable
 */
const config: Migration = {
    versionFrom: '1.0.0-alpha.2',
    versionTo: '1.0.0-alpha.3',
    run: (state) => {
        return {
            ...state,
        };
    },
};

export default config;
