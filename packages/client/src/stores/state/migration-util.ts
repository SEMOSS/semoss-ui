import {
    cleanBlocksOfOldSyntax,
    cleanCellVariables,
    cleanQueryOfOldSyntax,
} from '@/utility/migration';

// DONE: Migrate old syntax {{block.input-2712.value}}, {{query.python_code.cell.92121.output}}, {{query.python_code.output}} to variables
// DONE: variables that are cells --> "queryId": "", "cellId": "", We don't want to do string manipulation to get left and right pointer
// DONE: In designer only give variables as options with settings select
// DONE: In designer, Selected and Hovered mask show variable name if it is a variable
// DONE: rename cell allows creates a variable
// DONE: rename block creates a variable
// DONE: Fix Migration logic, If old app does not have version it's safe to assume they are at the first version
// DONE: Ensure no duplicating variable names, all have to be unique (error message), check the renaming too TODO: TEST
// DONE: Ensure periods can't be in alias (will mess with syntax perhaps)
// DONE: Migration Manager, if pointer is already in variables don't create a variable just change it to whats already there.

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
 * 2. For cell variables fix to {to: "query-1.1234"} --> {to: "query-1", cellId: "1234"}
 *
 * 3. Old syntax to new syntax
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

    // 3. Remove old syntax referencing queries, cells, blocks with variables, TODO: needs refactor
    // 3a. Remove references from queries
    const cleanedQueryState = await cleanQueryOfOldSyntax(cleanedState);

    // 3b. Remove references from blocks
    const cleanedBlockState = await cleanBlocksOfOldSyntax(cleanedQueryState);

    cleanedBlockState.version = to;

    return cleanedBlockState;
    // await Object.values(cleanedState.queries).forEach(
    //     (query: { cells: Record<string, unknown>[]; id: string }) => {
    //         query.cells.forEach(async (cell) => {
    //             const code = cell.parameters['code'];
    //             if (code) {
    //                 const regex = /{{(.*?)}}/g;

    //                 const cleaned = code.replace(regex, (match, content) => {
    //                     const split = content.split('.');

    //                     // Replace old cell syntax
    //                     if (
    //                         split[0] === 'query' &&
    //                         cleanedState.queries[split[1]] &&
    //                         split[2] === 'cell'
    //                     ) {
    //                         const queryId = split[1];
    //                         const cellId = split[3];

    //                         let alias = '';

    //                         // TODO: I could not do async await in a string replace
    //                         Object.entries(cleanedState.variables).forEach(
    //                             (keyValue: [string, Variable]) => {
    //                                 const variable = keyValue[1];
    //                                 if (variable.cellId === '88109') {
    //                                 }
    //                                 if (
    //                                     variable.to === split[1] &&
    //                                     variable.cellId === cellId
    //                                 ) {
    //                                     alias = keyValue[0];
    //                                 }
    //                             },
    //                         );
    //                         const identifier = `${queryId}--${cellId}`;

    //                         if (!alias && !cleanedState.variables[identifier]) {
    //                             cleanedState.variables[identifier] = {
    //                                 to: queryId,
    //                                 type: 'cell',
    //                                 cellId: cellId,
    //                             };
    //                         }

    //                         const remainder = split.slice(4).join('.');
    //                         const formatted = alias
    //                             ? alias
    //                             : identifier + '.' + remainder;

    //                         return `{{${formatted}}}`;
    //                     } else if (
    //                         // replace old query syntax
    //                         split[0] === 'query' &&
    //                         cleanedState.queries[split[1]] && // checks for variables that are named "query"
    //                         split[2] !== 'cell'
    //                     ) {
    //                         const queryId = split[1];
    //                         let alias = '';

    //                         // TODO: I could not do async await in a string replace
    //                         Object.entries(cleanedState.variables).forEach(
    //                             (keyValue: [string, Variable]) => {
    //                                 const variable = keyValue[1];
    //                                 if (
    //                                     variable.to === split[1] &&
    //                                     !variable.cellId
    //                                 ) {
    //                                     alias = keyValue[0];
    //                                 }
    //                             },
    //                         );

    //                         if (!alias && !cleanedState.variables[queryId]) {
    //                             cleanedState.variables[queryId] = {
    //                                 to: queryId,
    //                                 type: 'query',
    //                             };
    //                         }

    //                         const remainder = split.slice(2).join('.');
    //                         const formatted = alias
    //                             ? alias
    //                             : split[1] + '.' + remainder;

    //                         return `{{${formatted}}}`;
    //                     } else if (
    //                         // replace old block syntax
    //                         split[0] === 'block' &&
    //                         cleanedState.blocks[split[1]]
    //                     ) {
    //                         let alias = '';

    //                         // TODO: I could not do async await in a string replace
    //                         Object.entries(cleanedState.variables).forEach(
    //                             (keyValue: [string, Variable]) => {
    //                                 const variable = keyValue[1];
    //                                 if (
    //                                     variable.to === split[1] &&
    //                                     !variable.cellId
    //                                 ) {
    //                                     alias = keyValue[0];
    //                                 }
    //                             },
    //                         );

    //                         if (!alias && !cleanedState.variables[split[1]]) {
    //                             cleanedState.variables[split[1]] = {
    //                                 to: split[1],
    //                                 type: 'block',
    //                             };
    //                         }

    //                         const remainder = split.slice(2).join('.');
    //                         const formatted = alias
    //                             ? alias
    //                             : split[1] + '.' + remainder;

    //                         return `{{${formatted}}}`;
    //                     }

    //                     return match;
    //                 });

    //                 cell.parameters['code'] = cleaned;
    //             }
    //         });
    //     },
    // );

    // await Object.values(cleanedState.blocks).forEach((block) => {
    //     const properties = block['data'];

    //     if (properties) {
    //         const jsonString = JSON.stringify(properties);
    //         const regex = /{{(.*?)}}/g;

    //         const cleaned = jsonString.replace(regex, (match, content) => {
    //             const split = content.split('.');

    //             // Replace old cell syntax
    //             if (
    //                 split[0] === 'query' &&
    //                 cleanedState.queries[split[1]] &&
    //                 split[2] === 'cell'
    //             ) {
    //                 const queryId = split[1];
    //                 const cellId = split[3];

    //                 const identifier = `${queryId}--${cellId}`;

    //                 if (!cleanedState.variables[identifier]) {
    //                     cleanedState.variables[identifier] = {
    //                         to: queryId,
    //                         type: 'cell',
    //                         cellId: cellId,
    //                     };
    //                 }

    //                 const remainder = split.slice(4).join('.');
    //                 const formatted = identifier + '.' + remainder;

    //                 return `{{${formatted}}}`;
    //             } else if (
    //                 // replace old query syntax
    //                 split[0] === 'query' &&
    //                 cleanedState.queries[split[1]] && // checks for variables that are named "query"
    //                 split[2] !== 'cell'
    //             ) {
    //                 const queryId = split[1];

    //                 let alias = '';

    //                 // Check if there is already a variable
    //                 // TODO: I could not do async await in a string replace
    //                 Object.entries(cleanedState.variables).forEach(
    //                     (keyValue: [string, Variable]) => {
    //                         const variable = keyValue[1];
    //                         if (variable.to === split[1] && !variable.cellId) {
    //                             alias = keyValue[0];
    //                         }
    //                     },
    //                 );

    //                 // check if the id is there
    //                 if (!alias && !cleanedState.variables[queryId]) {
    //                     cleanedState.variables[queryId] = {
    //                         to: queryId,
    //                         type: 'query',
    //                     };
    //                 }

    //                 const remainder = split.slice(2).join('.');
    //                 const formatted = alias
    //                     ? alias
    //                     : split[1] + '.' + remainder;

    //                 return `{{${formatted}}}`;
    //             } else if (
    //                 // replace old block syntax
    //                 split[0] === 'block' &&
    //                 cleanedState.blocks[split[1]]
    //             ) {
    //                 let alias = '';

    //                 // Check if there is already a variable
    //                 // TODO: I could not do async await in a string replace
    //                 Object.entries(cleanedState.variables).forEach(
    //                     (keyValue: [string, Variable]) => {
    //                         const variable = keyValue[1];
    //                         if (variable.to === split[1] && !variable.cellId) {
    //                             alias = keyValue[0];
    //                         }
    //                     },
    //                 );

    //                 if (!alias && !cleanedState.variables[split[1]]) {
    //                     cleanedState.variables[split[1]] = {
    //                         to: split[1],
    //                         type: 'block',
    //                     };
    //                 }

    //                 const remainder = split.slice(2).join('.');
    //                 const formatted = alias
    //                     ? alias
    //                     : split[1] + '.' + remainder;

    //                 return `{{${formatted}}}`;
    //             }

    //             return match;
    //         });

    //         block['data'] = JSON.parse(cleaned);
    //     }
    // });
};

/**
 * @name migrate__1_0_0_alpha_1_to_1_0_0_alpha_2
 * @description - explain what this migration function does
 */
export const migrate__1_0_0_alpha_1_to_1_0_0_alpha_2 = (state, to) => {
    const newState = {
        ...state,
    };

    newState.variables = {};

    newState.version = to;

    return newState;
};
