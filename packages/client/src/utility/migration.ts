import { CellState, QueryState, Variable } from '@/stores';
import { splitAtPeriod } from './general';

// -------------------------------------------------
// START OF migrate__1_0_0_alpha_to_1_0_0_alpha_1
// -------------------------------------------------

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
                        let code = cell.parameters['code'];

                        if (code) {
                            let stringified = false;
                            if (typeof code !== 'string') {
                                code = JSON.stringify(code);
                                stringified = true;
                            }

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

                                        debugger;
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

                            cell.parameters['code'] = stringified
                                ? JSON.parse(cleaned)
                                : cleaned;
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
