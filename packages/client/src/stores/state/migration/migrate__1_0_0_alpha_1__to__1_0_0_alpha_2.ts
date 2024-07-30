import { Migration } from './migration.types';

/**
 * @name config
 * @description - This addresses a change in how we store our variables.
 *
 * 1. The unique identifier will change to what it is aliased by.
 * From: 'variable-7829': { alias: "LLM", to: 'model-8282', type: 'model'}
 * To: 'LLM': { to: 'model-8282', type: 'model'}
 *
 * 2. For cell variables fix
 * From: {to: "query-1.1234"}
 * To: {to: "query-1", cellId: "1234"}
 *
 * 3. Old syntax to new syntax (does not create dup references for variables)
 * {{query.py_code.cell.2189.output}} --> {{py_cell.output}}
 * {{query.py_code.output}} --> {{py_code.output}}
 */
const config: Migration = {
    versionFrom: '1.0.0-alpha.1',
    versionTo: '1.0.0-alpha.2',
    run: (state) => {
        return {
            ...state,
        };
    },
};

export default config;
