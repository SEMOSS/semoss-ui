// TODO: Define versions else where maybe in state.types --> this is just so we don't have harcoded values
type Versions = {
    // 1.0.0-alpha: '1.0.0-alpha2'
};

// TODO: Migration Function for this, structure change queries to notebook
// TODO: Migrate old syntax {{block.input-2712.value}}, {{query.python_code.cell.92121.output}}, {{query.python_code.output}} to variables
// TODO: variables that are cells --> "queryId": "", "cellId": "", We don't want to do string manipulation to get left and right pointer

// TODO: add isInput, isOutput to variables structure (will we need a UI to determine this or should this be set programatically)?

/**
 * @name __1_0_0_alpha_to_1_0_0_alpha_1
 * @description - This addresses a change in how we store our variables.
 * The unique identifier will change to what it is aliased by.
 * From: 'variable-7829': { alias: "LLM", to: 'model-8282', type: 'model'}
 * To: 'LLM': { to: 'model-8282', type: 'model'}
 */
export const __1_0_0_alpha_to_1_0_0_alpha_1 = (state) => {
    // TODO: Rename with migrate__1_0
    const newState = {
        ...state,
    };

    // Clear out old variables
    newState.variables = {};

    try {
        Object.values(state.variables).forEach(
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

    newState.version = '1.0.0-alpha.1';

    return newState;
};

/**
 * @name __1_0_0_alpha_1_to_1_0_0_alpha_2
 * @description - explain what this migration function does
 */
export const __1_0_0_alpha_1_to_1_0_0_alpha_2 = (state) => {
    const newState = {
        ...state,
    };

    newState.variables = {};

    newState.version = '1.0.0-alpha.2';

    return newState;
};
