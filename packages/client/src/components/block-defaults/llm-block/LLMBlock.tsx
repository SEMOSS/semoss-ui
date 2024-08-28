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

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

    // Go look for our variant
    // Get the response for it's corresponding pointer
    // Get the temps for corresponding pointer
    const { to } = data;

    const variable = state.variables[to as string];
    const llmCell = state.queries[variable.to].cells[variable.cellId];

    const variant = state.variants[to];

    if (!llmCell) {
        throw new Error("Can't locate Prompt to run variants");
    }

    // Get corresponding query
    const q = state.queries[llmCell.query.id];

    const handleRateResponse = (num: number) => {
        // TODO: set rating for a variant's response using the rating from the 'num' param.
    };

    useEffect(() => {
        console.log('here');
    }, [to]);

    const showModelUsed = () => {
        const queryCells = Object.values(q.cells);
        const variantIndex = parseInt(selectedTab);

        if (variantIndex === -1) {
            return <>{llmCell.parameters.modelId}</>;
        } else {
            const variantModel = variant.models[variantIndex];

            const foundAssociatedTempCell = queryCells.find((c) => {
                if (c.temp) {
                    if (c.parameters.modelId === variantModel.database_id) {
                        return c;
                    }
                }
            });
            return <>{variantModel.database_id}</>;
        }
    };

    /**
     * The response for tied cell
     * @returns JSX
     */
    const response = () => {
        const queryCells = Object.values(q.cells);
        const variantIndex = parseInt(selectedTab);

        if (variantIndex === -1) {
            return (
                <>
                    {llmCell.isLoading && !llmCell.output ? (
                        <CircularProgress />
                    ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {llmCell.output
                                ? llmCell.output['response']
                                    ? JSON.stringify(llmCell.output['response'])
                                    : JSON.stringify(llmCell.output)
                                : 'No output but done loading'}
                        </ReactMarkdown>
                    )}
                </>
            );
        } else {
            const variantModel = variant.models[variantIndex];

            const foundAssociatedTempCell = queryCells.find((c) => {
                if (c.temp) {
                    if (c.parameters.modelId === variantModel.database_id) {
                        return c;
                    }
                }
            });

            return (
                <>
                    {foundAssociatedTempCell.isLoading &&
                    !foundAssociatedTempCell.output ? (
                        <CircularProgress />
                    ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {foundAssociatedTempCell.output
                                ? foundAssociatedTempCell.output['response']
                                    ? JSON.stringify(
                                          foundAssociatedTempCell.output[
                                              'response'
                                          ],
                                      )
                                    : JSON.stringify(
                                          foundAssociatedTempCell.output,
                                      )
                                : 'No output but done loading'}
                        </ReactMarkdown>
                    )}
                </>
            );
        }

        // return (
        //     <Stack>
        //         <ul>
        //             {variant
        //                 ? variant.models.map((m, i) => {
        //                       const foundCellState = queryCells.find((c) => {
        //                           if (c.temp) {
        //                               if (
        //                                   c.parameters.modelId === m.database_id
        //                               ) {
        //                                   return c;
        //                               }
        //                           }
        //                       });

        //                       return (
        //                           <li key={i}>
        //                               {' '}
        //                               Variant {i}:
        //                               {foundCellState
        //                                   ? JSON.stringify(
        //                                         foundCellState.output,
        //                                     )
        //                                   : 'cant find'}
        //                           </li>
        //                       );
        //                   })
        //                 : 'N/A'}
        //         </ul>
        //     </Stack>
        // );
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
                        {showModelUsed()}
                        {/* Displays formatted prefix */}
                        {/* {modelOrModels()} */}
                        {/* {JSON.stringify(v)} */}

                        {/* Displays LLMs used in sheet */}
                        {/* {displayUsedModelsInVariant()} */}
                    </Typography>

                    <Typography variant="caption">{response()}</Typography>
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

                    {/* Displays responses */}
                    {/* {displayVariantResponse()} */}
                </Stack>
            </StyledTabBox>
        </StyledLLMComparisonBlock>
    );
});
