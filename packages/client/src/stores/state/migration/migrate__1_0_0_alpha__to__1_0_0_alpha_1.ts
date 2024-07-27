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
    versionFrom: '1.0.0-alpha',
    versionTo: '1.0.0-alpha.1',
    run: async (state) => {
        const ns = {
            ...state,
        };

        // 1. Replace unique identifier
        ns.variables = {};

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
            ns.variables = {};
        }

        const cleanedState = await cleanCellVariables(ns);

        const cleanedQueryState = await cleanQueryOfOldSyntax(cleanedState);

        const cleanedBlockState = await cleanBlocksOfOldSyntax(
            cleanedQueryState,
        );

        return cleanedBlockState;

        // TODO: The code didn't migrate I left this here but commented

        // new state object
        const newState = { ...state };

        // 1. Replace the old variable identifier with the alias and update the cell variable format
        const oldVariables = state.variables as Record<
            string,
            { alias: string; to: string; type: string }
        >;

        // map of id -> alias
        let aliasMapping: {
            block: Record<string, string>;
            query: Record<string, string>;
            cell: Record<string, Record<string, string>>;
        } = {
            block: {},
            query: {},
            cell: {},
        };

        try {
            // recreate the new variables
            const updatedVariables = {};
            for (const k in oldVariables) {
                const v = oldVariables[k];

                // id the variable by its previous alias
                updatedVariables[v.alias] = {
                    to: v.to,
                    type: v.type,
                };

                // if it is the old cell variable, update to the new format
                if (v.type === 'cell') {
                    // first half is the queryId
                    // second half is the cellId
                    const split = v.to.split('.');

                    const queryId = split[0];
                    const cellId = split[1];

                    updatedVariables[v.alias] = {
                        to: queryId,
                        type: v.type,
                        cellId: cellId,
                    };

                    if (!aliasMapping.cell[queryId]) {
                        aliasMapping.cell[queryId] = {};
                    }

                    aliasMapping.cell[queryId][cellId] = v.alias;
                } else if (v.type === 'query') {
                    const queryId = v.to;

                    aliasMapping.query[queryId] = v.alias;
                } else if (v.type === 'block') {
                    const blockId = v.to;

                    aliasMapping.block[blockId] = v.alias;
                }
            }

            // update it
            newState.variables = updatedVariables;
        } catch {
            // If there are issues, reset the variables
            newState.variables = {};

            // clear the mappings
            aliasMapping = {
                block: {},
                query: {},
                cell: {},
            };
        }

        // 2. Recreate each cell with the new syntax
        const queries = state.queries as Record<
            string,
            {
                id: string;
                cells: {
                    id: string;
                    widget: string;
                    parameters: Record<string, unknown>;
                }[];
            }
        >;

        // mutate the new queries
        for (const queryId in queries) {
            const query = queries[queryId];

            for (const cell of query.cells) {
                // if it is a code cell, find all the instances of {{ }} and replace it
                if (cell.widget === ' code') {
                    let code = cell.parameters['code'];

                    // ignore if there is no code
                    if (!code) {
                        continue;
                    }

                    // convert to a string if it is an []
                    let stringified = false;
                    if (typeof code !== 'string') {
                        code = JSON.stringify(code);
                        stringified = true;
                    }

                    const cleaned = updateSyntax(
                        code as string,
                        newState,
                        aliasMapping,
                    );

                    cell.parameters['code'] = stringified
                        ? JSON.parse(cleaned)
                        : cleaned;
                }
            }
        }

        newState.queries = queries;

        // 3. Recreate each block with the new syntax
        const blocks = state.blocks as Record<
            string,
            {
                data: Record<string, unknown>;
            }
        >;

        for (const blockId in blocks) {
            const block = blocks[blockId];

            if (block.data) {
                // convert to string instead of DFS
                const jsonString = JSON.stringify(block.data);

                const cleaned = updateSyntax(
                    jsonString,
                    newState,
                    aliasMapping,
                );

                block['data'] = JSON.parse(cleaned);
            }
        }

        newState.blocks = blocks;

        // Return sanitized state
        return newState;
    },
};

/**
 * Update the syntax from the old version to th enew
 * @param str - strt
 * @param newState - updated state
 * @param aliasMappings - mapping of alias to varias objects
 * @returns newState
 */
const updateSyntax = (
    str: string,
    newState: Record<string, unknown>,
    aliasMappings: {
        block: Record<string, string>;
        query: Record<string, string>;
        cell: Record<string, Record<string, string>>;
    },
): string => {
    return str.replace(/{{(.*?)}}/g, (match, content) => {
        const split = content.split('.');

        if (
            // replace old cell syntax
            split[0] === 'query' &&
            newState.queries[split[1]] &&
            split[2] === 'cell'
        ) {
            const queryId = split[1];
            const cellId = split[3];

            let alias = '';
            if (
                aliasMappings.cell[queryId] &&
                aliasMappings.cell[queryId][cellId]
            ) {
                alias = aliasMappings.cell[queryId][cellId];
            }

            // if there is no alias, create a new one
            if (!alias) {
                alias = `${queryId}--${cellId}`;

                // create the variable
                if (!newState.variables[alias]) {
                    newState.variables[alias] = {
                        to: queryId,
                        type: 'cell',
                        cellId: cellId,
                    };

                    if (!aliasMappings.cell[queryId]) {
                        aliasMappings.cell[queryId] = {};
                    }

                    aliasMappings.cell[queryId][cellId] = alias;
                }
            }

            // get the remaining path
            const remainder = split.slice(4).join('.');

            // update the variable
            return `{{${
                remainder.length > 0 ? `${alias}.${remainder}` : alias
            }}}`;
        } else if (
            // replace old query syntax
            split[0] === 'query' &&
            newState.queries[split[1]] && // checks for variables that are named "query"
            split[2] !== 'cell'
        ) {
            const queryId = split[1];

            let alias = '';
            if (aliasMappings.query[queryId] && aliasMappings.query[queryId]) {
                alias = aliasMappings.query[queryId];
            }

            if (!alias) {
                alias = `${queryId}`;

                // create the variable
                if (!newState.variables[alias]) {
                    newState.variables[alias] = {
                        to: queryId,
                        type: 'query',
                    };
                }

                aliasMappings.query[queryId] = alias;
            }

            const remainder = split.slice(2).join('.');

            // update the variable
            return `{{${
                remainder.length > 0 ? `${alias}.${remainder}` : alias
            }}}`;
        } else if (
            // replace old block syntax
            split[0] === 'block' &&
            newState.blocks[split[1]]
        ) {
            const blockId = split[1];

            let alias = '';
            if (aliasMappings.block[blockId] && aliasMappings.block[blockId]) {
                alias = aliasMappings.block[blockId];
            }

            if (!alias) {
                alias = `${blockId}`;

                // create the variable
                if (!newState.variables[alias]) {
                    newState.variables[alias] = {
                        to: blockId,
                        type: 'block',
                    };
                }

                aliasMappings.block[blockId] = alias;
            }

            const remainder = split.slice(2).join('.');

            // update the variable
            return `{{${
                remainder.length > 0 ? `${alias}.${remainder}` : alias
            }}}`;
        }

        return content;
    });
};

export default config;

import { CellState, QueryState, Variable } from '@/stores';

// -------------------------------------------------
// START OF migrate__1_0_0_alpha_to_1_0_0_alpha_1
// -------------------------------------------------
export const splitAtPeriod = (str, side = 'left') => {
    const indexOfPeriod = str.indexOf('.');
    if (indexOfPeriod === -1) {
        return str; // No period found, return the entire string
    }

    if (side === 'left') {
        return str.substring(0, indexOfPeriod);
    } else if (side === 'right') {
        return str.substring(indexOfPeriod + 1);
    } else {
        throw new Error("Invalid side argument. Choose 'left' or 'right'");
    }
};

/**
 * Clean cell variables
 * @param s
 */
export const cleanCellVariables = async (s) => {
    const entries = Object.entries(s.variables);

    const promises = entries.map(async (kv: [string, Variable]) => {
        const variable = kv[1];
        if (variable.type === 'cell') {
            const queryId = await splitAtPeriod(variable.to, 'left');
            const cellId = await splitAtPeriod(variable.to, 'right');

            s.variables[kv[0]] = {
                to: queryId,
                type: variable.type,
                cellId: cellId,
            };
        }
    });

    await Promise.all(promises);
    return s;
};

export const cleanQueryOfOldSyntax = async (s) => {
    const queries = Object.values(s.queries);

    await Promise.all(
        queries.map(
            async (query: { cells: { parameters: { code?: string } }[] }) => {
                await Promise.all(
                    query.cells.map(async (cell) => {
                        const code = cell.parameters['code'];
                        if (code) {
                            const regex = /{{(.*?)}}/g;

                            const cleaned = await code.replace(
                                regex,
                                (match, content) => {
                                    const split = content.split('.');

                                    // Replace old cell syntax
                                    if (
                                        split[0] === 'query' &&
                                        s.queries[split[1]] &&
                                        split[2] === 'cell'
                                    ) {
                                        const queryId = split[1];
                                        const cellId = split[3];

                                        let alias = '';

                                        // TODO: I could not do async await in a string replace
                                        Object.entries(s.variables).forEach(
                                            (keyValue: [string, Variable]) => {
                                                const variable = keyValue[1];

                                                if (
                                                    variable.to === split[1] &&
                                                    variable.cellId === cellId
                                                ) {
                                                    alias = keyValue[0];
                                                }
                                            },
                                        );
                                        const identifier = `${queryId}--${cellId}`;

                                        if (
                                            !alias &&
                                            !s.variables[identifier]
                                        ) {
                                            s.variables[identifier] = {
                                                to: queryId,
                                                type: 'cell',
                                                cellId: cellId,
                                            };
                                        }

                                        const remainder = split
                                            .slice(4)
                                            .join('.');
                                        const formatted =
                                            (alias ? alias : identifier) +
                                            '.' +
                                            remainder;

                                        return `{{${formatted}}}`;
                                    } else if (
                                        // replace old query syntax
                                        split[0] === 'query' &&
                                        s.queries[split[1]] && // checks for variables that are named "query"
                                        split[2] !== 'cell'
                                    ) {
                                        const queryId = split[1];
                                        let alias = '';

                                        // TODO: I could not do async await in a string replace
                                        Object.entries(s.variables).forEach(
                                            (keyValue: [string, Variable]) => {
                                                const variable = keyValue[1];
                                                if (
                                                    variable.to === split[1] &&
                                                    !variable.cellId
                                                ) {
                                                    alias = keyValue[0];
                                                }
                                            },
                                        );

                                        if (!alias && !s.variables[queryId]) {
                                            s.variables[queryId] = {
                                                to: queryId,
                                                type: 'query',
                                            };
                                        }

                                        const remainder = split
                                            .slice(2)
                                            .join('.');
                                        const formatted =
                                            (alias ? alias : split[1]) +
                                            '.' +
                                            remainder;

                                        return `{{${formatted}}}`;
                                    } else if (
                                        // replace old block syntax
                                        split[0] === 'block' &&
                                        s.blocks[split[1]]
                                    ) {
                                        let alias = '';

                                        // TODO: I could not do async await in a string replace
                                        Object.entries(s.variables).forEach(
                                            (keyValue: [string, Variable]) => {
                                                const variable = keyValue[1];
                                                if (
                                                    variable.to === split[1] &&
                                                    !variable.cellId
                                                ) {
                                                    alias = keyValue[0];
                                                }
                                            },
                                        );

                                        if (!alias && !s.variables[split[1]]) {
                                            s.variables[split[1]] = {
                                                to: split[1],
                                                type: 'block',
                                            };
                                        }

                                        const remainder = split
                                            .slice(2)
                                            .join('.');
                                        const formatted =
                                            (alias ? alias : split[1]) +
                                            '.' +
                                            remainder;

                                        return `{{${formatted}}}`;
                                    }

                                    return match;
                                },
                            );

                            cell.parameters['code'] = cleaned;
                        }
                    }),
                );
            },
        ),
    );

    return s;
};

export const cleanBlocksOfOldSyntax = async (s) => {
    const blocks = Object.values(s.blocks);

    await Promise.all(
        blocks.map(async (block) => {
            const properties = block['data'];

            if (properties) {
                const jsonString = JSON.stringify(properties);
                const regex = /{{(.*?)}}/g;

                const cleaned = await jsonString.replace(
                    regex,
                    (match, content) => {
                        const split = content.split('.');

                        // Replace old cell syntax
                        if (
                            split[0] === 'query' &&
                            s.queries[split[1]] &&
                            split[2] === 'cell'
                        ) {
                            const queryId = split[1];
                            const cellId = split[3];

                            let alias = '';

                            // TODO: I could not do async await in a string replace
                            Object.entries(s.variables).forEach(
                                (keyValue: [string, Variable]) => {
                                    const variable = keyValue[1];

                                    if (
                                        variable.to === split[1] &&
                                        variable.cellId === cellId
                                    ) {
                                        alias = keyValue[0];
                                    }
                                },
                            );

                            const identifier = `${queryId}--${cellId}`;

                            if (!alias && !s.variables[identifier]) {
                                s.variables[identifier] = {
                                    to: queryId,
                                    type: 'cell',
                                    cellId: cellId,
                                };
                            }

                            const remainder = split.slice(4).join('.');
                            const formatted =
                                (alias ? alias : identifier) + '.' + remainder;

                            return `{{${formatted}}}`;
                        } else if (
                            // replace old query syntax
                            split[0] === 'query' &&
                            s.queries[split[1]] && // checks for variables that are named "query"
                            split[2] !== 'cell'
                        ) {
                            const queryId = split[1];

                            let alias = '';

                            // Check if there is already a variable
                            // TODO: I could not do async await in a string replace
                            Object.entries(s.variables).forEach(
                                (keyValue: [string, Variable]) => {
                                    const variable = keyValue[1];
                                    if (
                                        variable.to === split[1] &&
                                        !variable.cellId
                                    ) {
                                        alias = keyValue[0];
                                    }
                                },
                            );

                            // check if the id is there
                            if (!alias && !s.variables[queryId]) {
                                s.variables[queryId] = {
                                    to: queryId,
                                    type: 'query',
                                };
                            }

                            const remainder = split.slice(2).join('.');
                            const formatted =
                                (alias ? alias : split[1]) + '.' + remainder;

                            return `{{${formatted}}}`;
                        } else if (
                            // replace old block syntax
                            split[0] === 'block' &&
                            s.blocks[split[1]]
                        ) {
                            let alias = '';

                            // Check if there is already a variable
                            // TODO: I could not do async await in a string replace
                            Object.entries(s.variables).forEach(
                                (keyValue: [string, Variable]) => {
                                    const variable = keyValue[1];
                                    if (
                                        variable.to === split[1] &&
                                        !variable.cellId
                                    ) {
                                        alias = keyValue[0];
                                    }
                                },
                            );

                            if (!alias && !s.variables[split[1]]) {
                                s.variables[split[1]] = {
                                    to: split[1],
                                    type: 'block',
                                };
                            }

                            const remainder = split.slice(2).join('.');
                            const formatted =
                                (alias ? alias : split[1]) + '.' + remainder;

                            return `{{${formatted}}}`;
                        }

                        return match;
                    },
                );

                block['data'] = JSON.parse(cleaned);
            }
        }),
    );

    return s;
};

// -------------------------------------------------
// END OF migrate__1_0_0_alpha_to_1_0_0_alpha_1
// -------------------------------------------------
