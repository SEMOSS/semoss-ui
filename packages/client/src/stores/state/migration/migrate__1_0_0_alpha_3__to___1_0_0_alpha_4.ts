import { Migration } from './migration.types';

/**
 * @name config
 * @description - This addresses a change in how we store our variables.
 *
 * 1. Go through blocks and add new data property to page for route
 */
const config: Migration = {
    versionFrom: '1.0.0-alpha.3',
    versionTo: '1.0.0-alpha.4',
    run: (state) => {
        const newState = { ...state };

        Object.entries(newState.blocks).forEach((keyValue) => {
            const block = keyValue[1];

            if (block.widget === 'page') {
                block.data['route'] = '';
            }
        });

        return newState;
    },
};

export default config;
