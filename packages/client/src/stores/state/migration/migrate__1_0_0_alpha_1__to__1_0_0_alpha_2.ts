import { Migration } from './migration.types';

/**
 * @name config
 * @description - This addresses a change in how we store our variables.
 *
 * 1. Look at our variables and see if we have the reference value in our state.
 * If not delete that variable. If so skip...
 */
const config: Migration = {
    versionFrom: '1.0.0-alpha.1',
    versionTo: '1.0.0-alpha.2',
    run: (state) => {
        const newState = { ...state };

        Object.entries(newState.variables).forEach((keyValue) => {
            const id = keyValue[0];
            const variable = keyValue[1];
            if (variable.type === 'block') {
                if (!state.blocks[variable.to]) {
                    delete newState.variables[id];
                }
            } else if (variable.type === 'cell') {
                if (!state.queries[variable.to]) {
                    delete newState.variables[id];
                } else {
                    const cellId = variable.cellId;

                    let present = false;
                    state.queries[variable.to].cells.forEach((c) => {
                        if (c.id === cellId) {
                            present = true;
                        }
                    });

                    if (!present) {
                        delete newState.variables[id];
                    }
                }
            } else if (variable.type === 'query') {
                if (!state.queries[variable.to]) {
                    delete newState.variables[id];
                }
            }
        });

        return newState;
    },
};

export default config;
