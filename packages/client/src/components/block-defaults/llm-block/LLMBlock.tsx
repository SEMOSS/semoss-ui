import { CSSProperties, useState, useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';

import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent, ActionMessages } from '@/stores';
import { Slot } from '@/components/blocks';

import { IconButton, Stack, Tabs, Typography, styled } from '@semoss/ui';
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
            database_name: '',
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
            database_name: '',
            database_type: '',
            database_subtype: '',
            topP: '',
            temperature: '',
            length: '',
        },
    ],
];

// TODO: Show the selected variable response, a varaiable is:
// A: query that last cell is an llm-cell
// B: llm-cell

// TODO: Create Settings component for block and add variants

// TODO: How will i swap out a variant and execute its flow to see responses
// A: Will i go pull those llm cells, just swap and execute here
// B: copy the sheets cells, look through them all and find llm-cells, and swap the models for whats in the variant

export const LLMBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<LLMBlockDef>(id); // TODO: use data here to set the tabs, and data displayed for each tab.
    const [selectedTab, setSelectedTab] = useState('0');
    const [highlightedRating, setHighlightedRating] = useState(0);
    const displayedRes = fakeData[Number(selectedTab)];

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
     */
    useEffect(() => {
        if (parsedResponse) {
            // THOUGHT PROCESS 2
            // 1. DUPLICATE THE QUERY SHEET (GET ID)
            // 2. REPLACE LLM CELL VALUES THERE FOR THE ITERATION
            // 3. EXECUTE QUERY BY NEW_ID
            // 4. WAIT FOR IT TO PROCESS
            // 5. ONCE PROCESSED, GO GET ALL LLM-CELL VALUES ITERATE THROUGH QUERY CELLS AND SEND OUTPUT FOR EACH LLM TO STORE IN STATE HERE
            // 6. GET RID OF QUERY SHEET, FOR CLEAN UP

            compare();

            // THOUGHT PROCESS 1
            // (GOT STUCK) So if we just try to make a copy and direct modification without attaching it to our state store methods,
            // it will directly modify the state when we try to do swaps. Thought about making a new state Store for each variant, but not ideal.

            // 1. Go find the sheet that needs to be reexecuted
            // 2. go through those cells and find all llm-cells
            // 2a. For each llm cell replace the placeholders with its respective variant index and model index.

            // 3. with this new sheet copied. do we need a new dispatch. Execute LLM Compare
            // where we execute sheet and it sends me back all of the llm-cell responses
            // comp();
        }
    }, [parsedResponse]);

    const compare = async () => {
        // VERIFIED: Creates duplicate queries
        // Duplicate the query that we are attached to on this block - O(n)
        const variantQueries = await createVariantsForQuery();
        state.queries;

        debugger;

        // VERIFIED: It swaps LLM cells, TODO: Handle multi-model swap
        // replace each queries llm cells - O(n^2)

        await replaceVariantQueryLLMCells(variantQueries);
        state.queries;

        // VERIFIED: It executes the new queries with the variant info
        await variantQueries.forEach(async (id) => {
            await state.dispatch({
                message: ActionMessages.RUN_QUERY,
                payload: {
                    queryId: id,
                },
            });
        });

        // TODO: Go find responses for each variant
        // I may have to poll the query ids to see if they have been .isExecuted

        debugger;

        return 'Set up the DS for how you want to display variants responses';

        // [
        // [{}, {}],
        // [{}, {}],
        // ]
    };

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

            state.queries;
            debugger;

            variantIds.push(id);
            currentVariantIndex += 1;
        }

        return variantIds;
    };

    const replaceVariantQueryLLMCells = async (queryIds) => {
        await queryIds.forEach(async (id, i) => {
            const q = state.getQuery(id);
            const cells = Object.values(q.cells);

            await cells.forEach(async (c) => {
                if (c.widget === 'llm') {
                    const modelToSwap = variants[i][0];
                    debugger;

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
                }
            });
        });
    };

    // TODO: DEAD CODE BELOW
    const createNewCompareSheets = async () => {
        const sheetToExecute = state.queries[variable.to];

        const cells = Object.entries(sheetToExecute.cells);

        variants;

        let currentVariantIndex = 0;
        let currentVariantModelIndex = 0;

        // Keep a copy of the modified sheets to pass to our new action that executes the whole sheet
        const createdSheets = [];

        while (currentVariantIndex < variants.length) {
            const NEW_STATE = state.toJSON();

            const q = NEW_STATE.queries[variable.to];
            const c = Object.entries(q.cells);

            debugger;
            const cells_copy = c;

            const new_q = {
                cells: {},
            };

            cells_copy.forEach((cellValue) => {
                const c = cellValue[1];
                if (c.widget === 'llm') {
                    const modelToSwap = variants[currentVariantIndex][0];
                    debugger;

                    c.parameters = {
                        ...c.parameters,
                        model: modelToSwap.database_id,
                        paramValues: modelToSwap.paramValues,
                    };

                    new_q.cells[cellValue[0]] = c;
                } else {
                    new_q.cells[cellValue[0]] = c;
                }
            });

            q.cells = new_q.cells;

            debugger;

            // cells_copy.forEach((list) => {
            //     new_q.cells[list[0]] = list[1]
            // })

            // Push to our storage of sheets that have correctly parsed data to pass to the Sheet Runner
            createdSheets.push(NEW_STATE);

            currentVariantIndex += 1;
        }

        // Should i return a list of state stores in order to execute them independently and let the state store process the runs
        return createdSheets;
    };

    const comp = async () => {
        const createdSheets = await createNewCompareSheets();
        debugger;

        createdSheets.forEach(() => {
            // EXECUTE THE SHEET WITH STATE STORE.
            // PASS THE QUERY REGISTRY AND IDEALLY send outputs for each cell and show the last the last response
        });
    };

    return (
        <StyledLLMComparisonBlock {...attrs}>
            <Typography variant="h6">Response</Typography>
            <Typography variant="caption">{value}</Typography>

            <StyledTabBox gap={2}>
                <Tabs
                    value={selectedTab}
                    onChange={(_, value: string) => {
                        setSelectedTab(value);
                    }}
                    color="primary"
                >
                    {fakeData.map((entry, idx: number) => (
                        <Tabs.Item
                            key={`${entry.name}-${idx}`}
                            label={`Variant ${entry.name}`}
                            value={idx.toString()}
                        />
                    ))}
                </Tabs>

                <Stack direction="column" gap={2}>
                    <Typography color="secondary" variant="body2">
                        {displayedRes.models.length === 1
                            ? 'Model: '
                            : 'Models: '}
                        {displayedRes.models.map((model, idx: number) => {
                            let returnString = model;
                            if (idx + 1 !== displayedRes.models.length)
                                returnString += ', ';
                            return returnString;
                        })}
                    </Typography>

                    {parsedResponse}

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
            </StyledTabBox>
        </StyledLLMComparisonBlock>
    );
});
