import {
    cleanBlocksOfOldSyntax,
    cleanCellVariables,
    cleanQueryOfOldSyntax,
} from '@/utility/migration';

// TODO: Make sure necessary blocks use QueryInputSettings, keep concise
// TODO: String concat in designer with variables
// TODO: Migration Function for this, structure change --> queries to notebook
// TODO: add isInput, isOutput to variables structure (will we need a UI to determine this or should this be set programatically)?

/**
 * @name migrate__1_0_0_alpha_to_1_0_0_alpha_1
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
export const migrate__1_0_0_alpha_to_1_0_0_alpha_1 = async (state, to) => {
    const newState = {
        ...state,
    };

    // 1. Replace unique identifier
    newState.variables = {};

    try {
        await Object.values(state.variables).forEach(
            (value: { alias: string; to: string; type: string }) => {
                // id the variable by its previous alias
                newState.variables[value.alias] = {
                    to: value.to,
                    type: value.type,
                };
            },
        );
    } catch {
        // If issues just clear out the variables
        newState.variables = {};
    }

    // 2. Fix old cell variables
    const cleanedState = await cleanCellVariables(newState);

    // 3. Remove old syntax referencing queries, cells, blocks with variables
    // 3a. Remove references from queries
    const cleanedQueryState = await cleanQueryOfOldSyntax(cleanedState);

    // 3b. Remove references from blocks
    const sanitizedState = await cleanBlocksOfOldSyntax(cleanedQueryState);

    // Upgrade version
    sanitizedState.version = to;

    // Return sanitized state
    return sanitizedState;
};

/**
 * @name migrate__1_0_0_alpha_1_to_1_0_0_alpha_2
 * @description - explain what this migration function does when you start
 */
export const migrate__1_0_0_alpha_1_to_1_0_0_alpha_2 = (state, to) => {
    const newState = {
        ...state,
    };

    newState.variables = {};

    newState.version = to;

    return newState;
};
