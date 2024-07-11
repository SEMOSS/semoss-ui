/**
 * @name __1_0_0_alpha_to_1_0_0_alpha_1
 * @description - This addresses a change in how we store our variables.
 * The unique identifier will change to what it is aliased by.
 * From: 'variable-7829': { alias: "LLM", to: 'model-8282', type: 'model'}
 * To: 'LLM': { to: 'model-8282',type: 'model'}
 */
export const __1_0_0_alpha_to_1_0_0_alpha_1 = (state) => {
    const newState = {
        ...state,
    };

    newState.variables = {};

    try {
        Object.values(state.variables).forEach(
            (value: { alias: string; to: string; type: string }) => {
                newState.variables[value.alias] = {
                    to: value.to,
                    type: value.type,
                };
            },
        );
    } catch {
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
