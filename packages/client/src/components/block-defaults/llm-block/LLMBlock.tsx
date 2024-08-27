import { CSSProperties, useState, useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';

import { useBlock, useBlocks, useRootStore } from '@/hooks';
import { BlockDef, BlockComponent, ActionMessages } from '@/stores';
import { Slot } from '@/components/blocks';

import {
    CircularProgress,
    IconButton,
    Stack,
    Tabs,
    Typography,
    Skeleton,
    styled,
} from '@semoss/ui';
import { Star, StarBorder } from '@mui/icons-material';

const StyledLLMComparisonBlock = styled('section')(({ theme }) => ({
    margin: theme.spacing(1),
    borderRadius: '12px',
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

const StyledTabBox = styled(Stack)(({ theme }) => ({
    borderRadius: '12px',
    backgroundColor: theme.palette.background.paper,
    padding: `${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(2)}`,
}));

const StyledRatingRow = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
}));

const StyledStarButton = styled(IconButton)(({ theme }) => ({
    padding: 0,
}));

const StyledLoading = styled(CircularProgress)(({ theme }) => ({
    width: '10px',
    height: '10px',
}));

// TODO: Temporary Data to build UI with
const fakeData = [
    {
        name: 'A',
        models: ['Vicana'],
        response: (
            <Typography variant="body1">
                IDK what this will look like so heres a string in its place for
                VARIANT A
            </Typography>
        ),
    },
    {
        name: 'B',
        models: ['Dall', 'Vicana'],
        response: (
            <Typography variant="body1">
                IDK what this will look like so heres a string in its place for
                VARIANT B
            </Typography>
        ),
    },
    {
        name: 'C',
        models: ['Dall', 'wizardLM', 'Vicana'],
        response: (
            <Typography variant="body1">
                IDK what this will look like so heres a string in its place for
                VARIANT C
            </Typography>
        ),
    },
];

export interface LLMBlockDef extends BlockDef<'llm'> {
    widget: 'llm';
    data: {
        style: CSSProperties;
        to: string;
        copyTo?: string;
        variants: Record<string, unknown>[];
    };
}

// {
//     alias: string | null;
//     value: string | null;
//     database_name: string | null;
//     database_type: string | null;
//     database_subtype: string | null;
//     topP: number | null;
//     temperature: number | null;
//     length: number | null;
// }

/**
 * This will how my variants come in as props
 */
const variants = [
    [
        {
            alias: '',
            value: 'variant 1 model 1',
            database_id: '4acbe913-df40-4ac0-b28a-daa5ad91b172',
            database_name: 'GPT-4o',
            database_type: '',
            database_subtype: '',
            topP: '',
            temperature: '',
            length: '',

            paramValues: {
                topP: '',
                temperature: '',
                length: '',
            },
        },
        {
            alias: '',
            value: 'variant 1 model 2',
            database_id: '001510f8-b86e-492e-a7f0-41299775e7d9',
            database_name: 'AIC LLM',
            database_type: '',
            database_subtype: '',
            topP: '',
            temperature: '',
            length: '',
            paramValues: {
                topP: '',
                temperature: '',
                length: '',
            },
        },
        {
            alias: '',
            value: 'variant 1 model 3',
            database_id: 'dbf6d2d7-dfba-4400-a214-6ac403350b04',
            database_name: 'CFG AI GPT3.5 Turbo',
            database_type: '',
            database_subtype: '',
            topP: '',
            temperature: '',
            length: '',
            paramValues: {
                topP: '',
                temperature: '',
                length: '',
            },
        },
    ],
    [
        {
            alias: '',
            value: 'variant 2 model 1',
            database_id: 'dbf6d2d7-dfba-4400-a214-6ac403350b04',
            database_name: 'CFG AI GPT3.5 Turbo',
            database_type: '',
            database_subtype: '',
            topP: '',
            temperature: '',
            length: '',
            paramValues: {
                topP: '',
                temperature: '',
                length: '',
            },
        },
        {
            alias: '',
            value: 'variant 2 model 2',
            database_id: '4acbe913-df40-4ac0-b28a-daa5ad91b172',
            database_name: 'GPT-4o',
            database_type: '',
            database_subtype: '',
            topP: '',
            temperature: '',
            length: '',

            paramValues: {
                topP: '',
                temperature: '',
                length: '',
            },
        },
        {
            alias: '',
            value: 'variant 2 model 3',
            database_id: '001510f8-b86e-492e-a7f0-41299775e7d9',
            database_name: 'AIC LLM',
            database_type: '',
            database_subtype: '',
            topP: '',
            temperature: '',
            length: '',
            paramValues: {
                topP: '',
                temperature: '',
                length: '',
            },
        },
    ],
];

export const LLMBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<LLMBlockDef>(id); // TODO: use data here to set the tabs, and data displayed for each tab.
    const [selectedTab, setSelectedTab] = useState('-1');
    const [highlightedRating, setHighlightedRating] = useState(0);
    const { monolithStore } = useRootStore();

    const [variantQuerySheet, setVariantQuerySheet] = useState([]);
    const [modelsUsed, setModelsUsed] = useState([]);

    const { state } = useBlocks();

    const { to } = data;

    const handleRateResponse = (num: number) => {
        // TODO: set rating for a variant's response using the rating from the 'num' param.
    };

    /**
     * Used to see if we have an output, use this to know if we have enough data for each variant after
     */
    const parsedResponse = state.parseVariable(`{{${to}}}`);
    const variable = state.variables[to];

    /**
     * Anytime our response changes go see our other variants
     */
    useEffect(() => {
        if (parsedResponse) {
            debugger;
            compare();
        }

        // Remove the temp queries and variables
        return () => {
            Object.values(state.queries).forEach((query) => {
                if (query.temp) {
                    state.dispatch({
                        message: ActionMessages.DELETE_QUERY,
                        payload: {
                            queryId: query.id,
                        },
                    });
                }
            });
            Object.entries(state.variables).forEach(([key, variable]) => {
                if (variable.temp) {
                    state.dispatch({
                        message: ActionMessages.DELETE_VARIABLE,
                        payload: {
                            id: key,
                        },
                    });
                }
            });
        };
    }, [parsedResponse]);

    /**
     * Gets the models used in variant
     */
    useEffect(() => {
        const getModelNames = async () => {
            if (selectedTab === '-1') {
                if (variable) {
                    const modelNames: string[] = await Promise.all(
                        state.queries[variable.to].list.map(async (id, idx) => {
                            const q = state.queries[variable.to];
                            const c = q.getCell(id);
                            if (c.widget === 'llm') {
                                let cleaned = c.parameters['modelId'] as string;

                                if (
                                    cleaned.startsWith('{{') &&
                                    cleaned.endsWith('}}')
                                ) {
                                    // remove the brackets
                                    cleaned = cleaned.slice(2, -2);
                                }

                                const to = state.variables[cleaned].to;
                                const mId = state.dependencies[to];

                                const resp = await monolithStore.runQuery(
                                    `GetEngineMetadata(engine=["${mId}"]);`,
                                );

                                return resp.pixelReturn[0].output.database_name;
                            } else {
                                return null;
                            }
                        }),
                    );

                    // Filter out null values before setting state
                    setModelsUsed(modelNames.filter((name) => name !== null));
                } else {
                    setModelsUsed([]); // If variable is not defined, set an empty array
                }
            } else {
                const variantNames = variants[selectedTab].map((model, idx) => {
                    return model.database_name;
                });
                setModelsUsed(variantNames);
            }
        };

        getModelNames();
    }, [selectedTab, variable, variants.length]);

    /**
     * @name compare
     * @description
     * Sets up comparison based on the new response that comes in
     * 1. DUPLICATE THE QUERY SHEET (GET ID)
     * 2. REPLACE LLM CELL VALUES THERE FOR THE SPECIFIC ITERATION
     * 3. EXECUTE QUERY BY NEW_ID
     * For Testing: log this in chrome tools --> Should be different,  do comparison
     * state.queries[key].cells['7347'].parameters.modelId,
     * state.queries.default.cells['7347'].parameters.modelId
     */
    const compare = async () => {
        // VERIFIED: Creates duplicate queries - Duplicate the query that we are attached to on this block - O(n)
        const variantQueries = await createVariantsForQuery();

        // VERIFIED: It swaps LLM cells, TODO: Handle multi-model swap - replace each queries llm cells - O(n^2)
        const qs = await replaceVariantQueryLLMCells(variantQueries);

        variantQueries.forEach(async (key) => {
            await state.dispatch({
                message: ActionMessages.RUN_QUERY,
                payload: {
                    queryId: key,
                },
            });
        });

        Object.values(qs).forEach((v: { trigger: () => void }[]) => {
            v.forEach((c) => {
                c.trigger();
            });
        });

        return variantQuerySheet;
    };

    /**
     *
     * @param str
     * @param q
     * @returns
     */
    const updateSyntax = async (str, q): Promise<string> => {
        return await str.replace(/{{(.*?)}}/g, (match, content) => {
            const split = content.split('.');

            const stringVariableRef = state.variables[split[0]];

            if (!stringVariableRef) {
                return `{{${content}}}`;
            }

            if (variable.to === stringVariableRef.to) {
                const randomId = `temp-${split[0]}-${Math.floor(
                    1000 + Math.random() * 9000,
                )}`;

                state.variables[randomId] = {
                    to: q.id,
                    cellId: stringVariableRef.cellId,
                    type: 'cell',
                    temp: true,
                };

                // get the remaining path
                const remainder = split.slice(2).join('.');

                return `{{${
                    remainder.length > 0 ? `${randomId}.${remainder}` : randomId
                }}}`;
            }

            return `{{${content}}}`;
        });
    };

    /**
     *
     * @returns new variant id's for
     */
    const createVariantsForQuery = async () => {
        let currentVariantIndex = 0;
        const variantIds = [];

        while (currentVariantIndex < variants.length) {
            const query = await state.getQuery(variable.to);

            if (!query) {
                return;
            }

            // get the json
            const json = query.toJSON();

            // get a new id
            const newQueryId = `${json.id}-copy-compare-variant-index-${currentVariantIndex}`;

            // dispatch it
            const id = await state.dispatch({
                message: ActionMessages.NEW_QUERY,
                payload: {
                    queryId: newQueryId,
                    config: {
                        cells: json.cells,
                        temp: true,
                    },
                },
            });

            // debugger

            variantIds.push(id);
            currentVariantIndex += 1;
        }

        setVariantQuerySheet(variantIds);

        return variantIds;
    };

    /**
     * Updates all the cells in respective query sheet
     * @param queryIds
     * @description
     * Swaps out the llms that are used for the query sheet tied to block.
     * Do this per variant/sheet
     */
    const replaceVariantQueryLLMCells = async (queryIds) => {
        const queryCellsToUpdate = {};

        queryIds.forEach((q) => {
            queryCellsToUpdate[q] = [];
        });

        await Promise.all(
            queryIds.map(async (id, i) => {
                const q = state.getQuery(id);
                let modelIdx = 0;

                await Promise.all(
                    q.list.map(async (cellId) => {
                        const c = q.getCell(cellId);
                        console.log('hello cell');

                        if (c.widget === 'llm') {
                            const modelToSwap = variants[i][modelIdx];
                            // iterate the current variant model
                            modelIdx += 1;

                            (c.parameters.modelId = modelToSwap.database_id),
                                (c.parameters.paramValues =
                                    modelToSwap.paramValues);

                            const cleanSyntax = await updateSyntax(
                                c.parameters.command,
                                q,
                            );

                            queryCellsToUpdate[id].push({
                                query: id,
                                cell: c.id,
                                trigger: () =>
                                    state.dispatch({
                                        message: ActionMessages.UPDATE_CELL,
                                        payload: {
                                            queryId: id,
                                            cellId: c.id,
                                            path: 'parameters',
                                            value: {
                                                ...c.parameters,
                                                modelId:
                                                    modelToSwap.database_id,
                                                command: cleanSyntax,
                                                paramValues:
                                                    modelToSwap.paramValues,
                                            },
                                        },
                                    }),
                            });
                        } else if (c.widget === 'code') {
                            const code = c.parameters.code;

                            // Verified: Cleans string of syntax
                            const cleanedString = await updateSyntax(code, q);

                            // if the string is different make the updates, otherwise no need
                            if (cleanedString !== code) {
                                state.queries[q.id].cells[
                                    c.id
                                ].parameters.code = cleanedString;

                                queryCellsToUpdate[id].push({
                                    query: id,
                                    cell: c.id,
                                    trigger: () =>
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: id,
                                                cellId: c.id,
                                                path: 'parameters.code',
                                                value: cleanedString,
                                            },
                                        }),
                                });
                            }
                        }
                    }),
                );
            }),
        );

        return queryCellsToUpdate;
    };

    /**
     * Shows the Variant Responses as well as what we have in our notebook
     * @returns JSX.Element
     */
    const displayVariantResponse = (): JSX.Element => {
        if (variable) {
            const queryIdVariant = variantQuerySheet[parseInt(selectedTab)];
            const masterQuery = state.queries[variable.to];

            if (selectedTab === '-1') {
                const renderResponse = () => {
                    if (parsedResponse) {
                        if (masterQuery.isLoading) {
                            return <StyledLoading />;
                        } else {
                            return JSON.stringify(
                                parsedResponse.response
                                    ? parsedResponse.response
                                    : parsedResponse,
                            );
                        }
                    } else {
                        if (masterQuery.isLoading) {
                            return <StyledLoading />;
                        } else {
                            return 'Awaiting execution';
                        }
                    }
                };

                return (
                    <Stack>
                        <Typography variant="caption">
                            {renderResponse()}
                        </Typography>
                        <StyledRatingRow>
                            {/* {JSON.stringify(variantQuerySheet)} */}
                            <Typography color="secondary" variant="body2">
                                What would you rate this response?
                            </Typography>

                            <Stack
                                direction="row"
                                onMouseLeave={() => {
                                    setHighlightedRating(0);
                                }}
                                onBlur={() => {
                                    setHighlightedRating(0);
                                }}
                            >
                                <StyledStarButton
                                    onClick={() => handleRateResponse(1)}
                                    onMouseEnter={() => setHighlightedRating(1)}
                                    onFocus={() => setHighlightedRating(1)}
                                >
                                    {highlightedRating >= 1 ? (
                                        <Star />
                                    ) : (
                                        <StarBorder />
                                    )}
                                </StyledStarButton>
                                <StyledStarButton
                                    onClick={() => handleRateResponse(2)}
                                    onMouseEnter={() => setHighlightedRating(2)}
                                    onFocus={() => setHighlightedRating(2)}
                                >
                                    {highlightedRating >= 2 ? (
                                        <Star />
                                    ) : (
                                        <StarBorder />
                                    )}
                                </StyledStarButton>
                                <StyledStarButton
                                    onClick={() => handleRateResponse(3)}
                                    onMouseEnter={() => setHighlightedRating(3)}
                                    onFocus={() => setHighlightedRating(3)}
                                >
                                    {highlightedRating >= 3 ? (
                                        <Star />
                                    ) : (
                                        <StarBorder />
                                    )}
                                </StyledStarButton>
                                <StyledStarButton
                                    onClick={() => handleRateResponse(4)}
                                    onMouseEnter={() => setHighlightedRating(4)}
                                    onFocus={() => setHighlightedRating(4)}
                                >
                                    {highlightedRating >= 4 ? (
                                        <Star />
                                    ) : (
                                        <StarBorder />
                                    )}
                                </StyledStarButton>
                                <StyledStarButton
                                    onClick={() => handleRateResponse(5)}
                                    onMouseEnter={() => setHighlightedRating(5)}
                                    onFocus={() => setHighlightedRating(5)}
                                >
                                    {highlightedRating === 5 ? (
                                        <Star />
                                    ) : (
                                        <StarBorder />
                                    )}
                                </StyledStarButton>
                            </Stack>
                        </StyledRatingRow>
                    </Stack>
                );
            }

            const renderVariantResponse = () => {
                if (masterQuery.isLoading) {
                    return <StyledLoading />;
                }
                if (!queryIdVariant) {
                    return 'Awaiting execution';
                }

                if (state.queries[queryIdVariant].isLoading) {
                    return <StyledLoading />;
                } else if (state.queries[queryIdVariant].output) {
                    return JSON.stringify(
                        state.queries[queryIdVariant].output.response
                            ? state.queries[queryIdVariant].output.response
                            : state.queries[queryIdVariant].output,
                    );
                } else {
                    return 'Awaiting execution';
                }
            };

            return (
                <Stack>
                    <Typography variant="caption">
                        {renderVariantResponse()}
                    </Typography>
                    <StyledRatingRow>
                        <Typography color="secondary" variant="body2">
                            What would you rate this response?
                        </Typography>

                        <Stack
                            direction="row"
                            onMouseLeave={() => {
                                setHighlightedRating(0);
                            }}
                            onBlur={() => {
                                setHighlightedRating(0);
                            }}
                        >
                            <StyledStarButton
                                onClick={() => handleRateResponse(1)}
                                onMouseEnter={() => setHighlightedRating(1)}
                                onFocus={() => setHighlightedRating(1)}
                                disabled={
                                    !queryIdVariant
                                        ? true
                                        : !state.queries[queryIdVariant].output
                                }
                            >
                                {highlightedRating >= 1 ? (
                                    <Star />
                                ) : (
                                    <StarBorder />
                                )}
                            </StyledStarButton>
                            <StyledStarButton
                                onClick={() => handleRateResponse(2)}
                                onMouseEnter={() => setHighlightedRating(2)}
                                onFocus={() => setHighlightedRating(2)}
                                disabled={
                                    !queryIdVariant
                                        ? true
                                        : !state.queries[queryIdVariant].output
                                }
                            >
                                {highlightedRating >= 2 ? (
                                    <Star />
                                ) : (
                                    <StarBorder />
                                )}
                            </StyledStarButton>
                            <StyledStarButton
                                onClick={() => handleRateResponse(3)}
                                onMouseEnter={() => setHighlightedRating(3)}
                                onFocus={() => setHighlightedRating(3)}
                                disabled={
                                    !queryIdVariant
                                        ? true
                                        : !state.queries[queryIdVariant].output
                                }
                            >
                                {highlightedRating >= 3 ? (
                                    <Star />
                                ) : (
                                    <StarBorder />
                                )}
                            </StyledStarButton>
                            <StyledStarButton
                                onClick={() => handleRateResponse(4)}
                                onMouseEnter={() => setHighlightedRating(4)}
                                onFocus={() => setHighlightedRating(4)}
                                disabled={
                                    !queryIdVariant
                                        ? true
                                        : !state.queries[queryIdVariant].output
                                }
                            >
                                {highlightedRating >= 4 ? (
                                    <Star />
                                ) : (
                                    <StarBorder />
                                )}
                            </StyledStarButton>
                            <StyledStarButton
                                onClick={() => handleRateResponse(5)}
                                onMouseEnter={() => setHighlightedRating(5)}
                                onFocus={() => setHighlightedRating(5)}
                                disabled={
                                    !queryIdVariant
                                        ? true
                                        : !state.queries[queryIdVariant].output
                                }
                            >
                                {highlightedRating === 5 ? (
                                    <Star />
                                ) : (
                                    <StarBorder />
                                )}
                            </StyledStarButton>
                        </Stack>
                    </StyledRatingRow>
                </Stack>
            );
        } else {
            return <>Please connect your LLM Compare block to a query sheet</>;
        }
    };

    /**
     * Display Model/Models: Prefix
     * @returns string
     * @description
     */
    const modelOrModels = (): string => {
        if (variable) {
            if (selectedTab === '-1') {
                const llmCells = [];
                state.queries[variable.to].list.forEach((id) => {
                    const q = state.queries[variable.to];
                    const c = q.getCell(id);
                    if (c.widget === 'llm') {
                        llmCells.push(id);
                    }
                });

                if (llmCells.length === 1) {
                    return 'Model: ';
                } else {
                    return 'Models: ';
                }
            } else {
                if (variants[selectedTab].length === 1) {
                    return 'Model: ';
                } else {
                    return 'Models: ';
                }
            }
        } else {
            return 'Models: ';
        }
    };

    /**
     *
     * @returns
     */
    const displayUsedModelsInVariant = (): string => {
        if (!modelsUsed.length) {
            return 'Models not configured';
        } else {
            let returnString = '';
            modelsUsed.forEach((m, idx) => {
                if (m) {
                    returnString += m;
                    if (idx + 1 !== state.queries[variable.to].list.length) {
                        returnString += ', ';
                    }
                }
            });

            return returnString;
        }
    };

    return (
        <StyledLLMComparisonBlock {...attrs}>
            <Typography variant="h6">Response</Typography>

            <StyledTabBox gap={2}>
                <Tabs
                    value={selectedTab}
                    onChange={(_, value: string) => {
                        setSelectedTab(value);
                    }}
                    color="primary"
                >
                    <Tabs.Item
                        key={'default variant tab'}
                        label={'Default'}
                        value={'-1'}
                    />
                    {variants.map((v, i) => {
                        return (
                            <Tabs.Item
                                key={`variant-tab-${i}`}
                                label={`Variant ${i}`}
                                value={i.toString()}
                            />
                        );
                    })}
                </Tabs>

                <Stack direction="column" gap={2}>
                    <Typography color="secondary" variant="body2">
                        {/* Displays formatted prefix */}
                        {modelOrModels()}

                        {/* Displays LLMs used in sheet */}
                        {displayUsedModelsInVariant()}
                    </Typography>

                    {/* Displays responses */}
                    {displayVariantResponse()}
                </Stack>
            </StyledTabBox>
        </StyledLLMComparisonBlock>
    );
});
