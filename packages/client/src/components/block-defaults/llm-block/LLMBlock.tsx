import { CSSProperties, useState, useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';

import { useBlock, useBlocks } from '@/hooks';
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

const variants = [
    [
        {
            alias: '',
            value: 'variant 1',
            database_id: 'e338934d-bef1-4920-9136-dc0e37060dfa',
            database_name: 'Mistral-Orca',
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
            value: 'variant 2',
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
];

// NOTES ---

// TODO: Show the selected variable response, a varaiable is:
// A: query that last cell is an llm-cell
// B: llm-cell

// TODO: Create Settings component for block and add variants

// THOUGHT PROCESS 2

// DO WE NEED TO WAIT FOR IT?
// 4. WAIT FOR IT TO PROCESS
// 5. ONCE PROCESSED, GO GET ALL LLM-CELL VALUES ITERATE THROUGH QUERY CELLS AND SEND OUTPUT FOR EACH LLM TO STORE IN STATE HERE
// 6. GET RID OF QUERY SHEET, FOR CLEAN UP

// THOUGHT PROCESS 1
// (GOT STUCK) So if we just try to make a copy and direct modification without attaching it to our state store methods,
// it will directly modify the state when we try to do swaps. Thought about making a new state Store for each variant, but not ideal.

// 1. Go find the sheet that needs to be reexecuted
// 2. go through those cells and find all llm-cells
// 2a. For each llm cell replace the placeholders with its respective variant index and model index.

// 3. with this new sheet copied. do we need a new dispatch. Execute LLM Compare
// where we execute sheet and it sends me back all of the llm-cell responses
// comp();

export const LLMBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<LLMBlockDef>(id); // TODO: use data here to set the tabs, and data displayed for each tab.
    const [selectedTab, setSelectedTab] = useState('-1');
    const [highlightedRating, setHighlightedRating] = useState(0);

    const [variantQuerySheet, setVariantQuerySheet] = useState([]);

    const { state } = useBlocks();

    const { copyTo } = data;

    const handleRateResponse = (num: number) => {
        // TODO: set rating for a variant's response using the rating from the 'num' param.
    };

    /**
     * Used to see if we have an output, use this to know if we have enough data for each variant after
     */
    const parsedResponse = state.parseVariable(`{{${copyTo}}}`);
    const variable = state.variables[copyTo];
    const value = state.getVariable(variable.to, variable.type);

    /**
     * Anytime our response changes go see our other variants
     * THOUGHT PROCESS 2
     * 1. DUPLICATE THE QUERY SHEET (GET ID)
     * 2. REPLACE LLM CELL VALUES THERE FOR THE ITERATION
     * 3. EXECUTE QUERY BY NEW_ID
     */
    useEffect(() => {
        if (parsedResponse) {
            compare();
        }
    }, [parsedResponse]);

    /**
     * Sets up comparison based on the new response that comes in
     */
    const compare = async () => {
        // VERIFIED: Creates duplicate queries
        // Duplicate the query that we are attached to on this block - O(n)
        const variantQueries = await createVariantsForQuery();

        // state.queries;
        // debugger;

        // VERIFIED: It swaps LLM cells, TODO: Handle multi-model swap
        // replace each queries llm cells - O(n^2)

        await replaceVariantQueryLLMCells(variantQueries);

        // state.queries;
        // debugger

        // VERIFIED: It executes the new queries with the variant info
        await variantQueries.forEach(async (id) => {
            await state.dispatch({
                message: ActionMessages.RUN_QUERY,
                payload: {
                    queryId: id,
                },
            });
        });

        setVariantQuerySheet(variantQueries);
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
                    },
                },
            });

            // state.queries;
            // debugger;

            variantIds.push(id);
            currentVariantIndex += 1;
        }

        return variantIds;
    };

    /**
     * Updates all the cells in respective query sheet
     * @param queryIds
     */
    const replaceVariantQueryLLMCells = async (queryIds) => {
        await queryIds.forEach(async (id, i) => {
            const q = state.getQuery(id);
            const cells = Object.values(q.cells);

            await cells.forEach(async (c) => {
                if (c.widget === 'llm') {
                    const modelToSwap = variants[i][0];
                    // debugger;

                    await state.dispatch({
                        message: ActionMessages.UPDATE_CELL,
                        payload: {
                            queryId: id,
                            cellId: c.id,
                            path: 'parameters',
                            value: {
                                ...c.parameters,
                                model: modelToSwap.database_id,
                                paramValues: modelToSwap.paramValues,
                            },
                        },
                    });
                } else if (c.widget === 'code') {
                    // TODO: add logic to create a new variable and swap the cell variables that are used in code as cells

                    // 1. Look through the code property and find variables that are cells
                    // - When found variable {{}}
                    // - see what type of variable it is
                    // ---- is it a cell?
                    // -------- If so did it come from a cell from our original query context (not the temp)
                    // ------------- Replace the variable {{llm-cell}} to {{llm-cell-temp-101029}}
                    // ------------- Create a variable for your temp context

                    const code = c.parameters.code;

                    const updateSyntax = (str) => {
                        return str.replace(/{{(.*?)}}/g, (match, content) => {
                            const split = content.split('.');

                            if (
                                // replace old cell syntax
                                split[0] === 'llm-cell'
                            ) {
                                console.log('query', q.id);
                                console.log('cell', c.id);
                                // debugger;
                                // update the variable
                                return `"{{celly}}"`;
                            }

                            return `{{${content}}}`;
                        });
                    };

                    // Verified: Cleans string of syntax
                    const cleanedString = await updateSyntax(code);
                    // debugger;
                    if (cleanedString !== code) {
                        state.queries[q.id].cells[c.id].parameters.code =
                            cleanedString;

                        // ^ This WORKS, But Below Doesnt

                        // await state.dispatch({
                        //     message: ActionMessages.UPDATE_CELL,
                        //     payload: {
                        //         queryId: id,
                        //         cellId: c.id,
                        //         path: 'parameters.code',
                        //         value: cleanedString,
                        //     },
                        // });
                    }
                }
            });
        });
    };

    /**
     * Shows the Variant Responses as well as what we have in our notebook
     * @returns JSX.Element
     */
    const displayVariant = (): JSX.Element => {
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
                            {highlightedRating >= 1 ? <Star /> : <StarBorder />}
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
                            {highlightedRating >= 2 ? <Star /> : <StarBorder />}
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
                            {highlightedRating >= 3 ? <Star /> : <StarBorder />}
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
                            {highlightedRating >= 4 ? <Star /> : <StarBorder />}
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
    };

    /**
     * Display Model/Models: Prefix
     * @returns string
     */
    const modelOrModels = (): string => {
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
                        {modelOrModels()}
                        {selectedTab === '-1'
                            ? state.queries[variable.to].list.map((id, idx) => {
                                  const q = state.queries[variable.to];
                                  const c = q.getCell(id);
                                  if (c.widget === 'llm') {
                                      let returnString = c.parameters.model;
                                      if (
                                          idx + 1 !==
                                          state.queries[variable.to].list.length
                                      )
                                          returnString += ', ';
                                      return returnString;
                                  }
                              })
                            : variants[selectedTab].map((model, idx) => {
                                  let returnString = model.database_name;
                                  if (idx + 1 !== variants[selectedTab].length)
                                      returnString += ', ';
                                  return returnString;
                              })}
                    </Typography>

                    {displayVariant()}
                </Stack>
            </StyledTabBox>
        </StyledLLMComparisonBlock>
    );
});
