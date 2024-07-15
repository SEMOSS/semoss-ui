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
 * 1. The unique identifier will change to what it is aliased by.
 * From: 'variable-7829': { alias: "LLM", to: 'model-8282', type: 'model'}
 * To: 'LLM': { to: 'model-8282', type: 'model'}
 * 2. Old syntax to new syntax - TODO:
 * {{query.py_code.cell.2189.output}} --> {{py_cell.output}}
 * {{query.py_code.output}} --> {{py_code.output}}
 */
export const __1_0_0_alpha_to_1_0_0_alpha_1 = (state) => {
    // TODO: Rename with migrate__1_0
    const newState = {
        ...state,
    };

    // 1. Replace unique identifier
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

    // 2. Remove old syntax referencing queries, cells, blocks with variables

    // 2a. Remove references from queries
    Object.values(newState.queries).forEach(
        (query: { cells: Record<string, unknown>[]; id: string }) => {
            query.cells.forEach(async (cell) => {
                const code = cell.parameters['code'];
                if (code) {
                    // 1. Remove block syntax
                    let regex = /{{block\.([a-z]+--\d+)\.(.*?)}}/g;

                    const removedBlockSyntax = await code.replace(
                        regex,
                        (fullMatch, identifier, remainder) => {
                            // Check and create a new variable for new instances
                            if (!newState.variables[identifier]) {
                                newState.variables[identifier] = {
                                    to: identifier,
                                    type: 'block',
                                };
                            }

                            // Return the modified string replacing 'block.' with ''
                            return `{{${identifier}.${remainder}}}`;
                        },
                    );

                    // 2. Replace old query syntax
                    regex = /{{query\.([a-z-]+\d*)\.([a-zA-Z_]+)}}/g;

                    const removedQuerySyntax = await removedBlockSyntax.replace(
                        regex,
                        (fullMatch, identifier, remainder) => {
                            // Check and create a new variable for new instances
                            if (!newState.variables[identifier]) {
                                newState.variables[identifier] = {
                                    to: identifier,
                                    type: 'query',
                                };
                            }
                            // Return the modified string replacing 'query.' with ''
                            return `{{${identifier}.${remainder}}}`;
                        },
                    );

                    // 3. Remove the old cell syntax
                    regex =
                        /{{query\.([a-z-]+\d*)\.cell\.(\d+)\.([a-zA-Z_]+)}}/g;

                    const cleaned = removedQuerySyntax.replace(
                        regex,
                        (fullMatch, queryPart, numberPart, outputPart) => {
                            const identifier = `${queryPart}--${numberPart}`;
                            if (!newState.variables[identifier]) {
                                newState.variables[identifier] = {
                                    to: `${queryPart}.${numberPart}`,
                                    type: 'cell',
                                };
                            }

                            // Return the modified string in the new format
                            return `{{${queryPart}--${numberPart}.${outputPart}}}`;
                        },
                    );

                    // Update the code with the new replaced value
                    cell.parameters['code'] = cleaned;
                }
            });
        },
    );

    // 2b. Remove references from blocks
    Object.values(newState.blocks).forEach((block) => {
        debugger;
    });

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
