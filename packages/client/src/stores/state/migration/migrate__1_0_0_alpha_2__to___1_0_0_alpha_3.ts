import { QueryState } from '../query.state';
import { SerializedState } from '../state.types';
import { Migration } from './migration.types';

/**
 * @name config
 * @description - This addresses a change in how we store our variables.
 *
 * 1. add input and output Boolean to each variable for API execution
 * 2. merge dependencies into variables as a value property on each variable
 */
const config: Migration = {
    versionFrom: '1.0.0-alpha.2',
    versionTo: '1.0.0-alpha.3',
    run: (state) => {
        const newState = { ...state };

        Object.entries(newState.variables).forEach((keyValue) => {
            const id = keyValue[0];
            const variable = keyValue[1];
            if (variable.type === 'cell' || variable.type === 'query') {
                variable['isInput'] = false;
                variable['isOutput'] = true;
            } else {
                variable['isInput'] = true;
                variable['isOutput'] = false;
            }

            if (newState.dependencies[variable.to]) {
                variable['value'] = newState.dependencies[variable.to];

                // Delete the dependency while we are at it
                delete newState.dependencies[variable.to];
            }

            // Delete pointer for constant values
            if (
                variable.type === 'database' ||
                variable.type === 'model' ||
                variable.type === 'vector' ||
                variable.type === 'function' ||
                variable.type === 'storage' ||
                variable.type === 'string' ||
                variable.type === 'date' ||
                variable.type === 'number' ||
                variable.type === 'array' ||
                variable.type === 'JSON'
            ) {
                delete newState.variables[id].to;
            }
        });

        // Only keep dependencies for tracking purposes if keys present
        if (!Object.keys(newState.dependencies).length) {
            delete newState.dependencies;
        }

        // Start keeping track of order of sheets to be executed
        const orderedQueries = [];
        Object.values(newState.queries).forEach((q: QueryState) => {
            orderedQueries.push(q.id);
        });

        newState.executionOrder = orderedQueries;

        return newState;
    },
};

export default config;
