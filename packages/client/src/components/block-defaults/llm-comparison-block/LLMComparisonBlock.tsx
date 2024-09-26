import { useState, useEffect, useRef } from 'react';
import { useBlock, useBlocks } from '@/hooks';
import { BlockComponent, BlockDef, CellState } from '@/stores';
import {
    IconButton,
    Stack,
    Tabs,
    Typography,
    styled,
    Icon,
    Checkbox,
} from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import {
    CheckBoxRounded,
    CheckCircle,
    Star,
    StarBorder,
} from '@mui/icons-material';

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

const StyledContentHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
}));

export interface LLMComparisonBlockDef extends BlockDef<'llmComparison'> {
    widget: 'llmComparison';
    slots: never;
}

export const LLMComparisonBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock(id);
    const { state } = useBlocks();
    const query = state.getQuery(
        typeof data.queryId === 'string' ? data.queryId : '',
    );
    const queryIsLoadingRef = useRef(false);
    const [selectedTab, setSelectedTab] = useState<string>('');
    const [variants, setVariants] = useState({});
    const displayed = (variants || {})[selectedTab] || {};
    const [highlightedRating, setHighlightedRating] = useState(0);

    useEffect(() => {
        if (!data.queryId) {
            setVariants({});
            return;
        } else {
            getVariantsFromQuery();
        }
    }, [data.queryId]);

    // Refresh the variant's responses when the query has finished loading.
    // May want to refactor this to have a more direct solution for triggering the refresh.3
    useEffect(() => {
        if (!query.isLoading && queryIsLoadingRef.current === true) {
            queryIsLoadingRef.current = false;
            getVariantsFromQuery();
        }
        queryIsLoadingRef.current = query.isLoading;
    }, [query.isLoading]);

    // Fetch and save variants stored in query to state.
    const getVariantsFromQuery = () => {
        let query;
        if (typeof data.queryId === 'string') {
            query = state.getQuery(data.queryId);
        } else {
            console.log("Type of 'data.queryId' is NOT a string");
            return;
        }

        let modelledVars = {};
        Object.values(query.cells).forEach((cell: CellState, idx) => {
            const cellVars = {};
            Object.values(cell.parameters.variants).forEach((variant, idx) => {
                cellVars[variant.id] = {
                    ...variant,
                    response: (cell.output || [])[idx]?.response,
                    selected: idx === 0,
                };
            });

            modelledVars = {
                ...modelledVars,
                ...cellVars,
            };
        });

        const variantKeys = Object.keys(modelledVars);
        setSelectedTab(variantKeys[0] || '');
        setVariants(modelledVars);
    };

    const handleRateResponse = (num: number) => {
        // TODO: set rating for a variant's response using the rating from the 'num' param.
    };

    const handleChangeSelected = () => {
        // TODO
    };

    return (
        <StyledLLMComparisonBlock {...attrs}>
            <Typography variant="h6">Response</Typography>

            {Object.keys(variants).length === 0 ? (
                <StyledTabBox>
                    <Typography variant="body2">
                        Add a query with variants to generate responses.
                    </Typography>
                </StyledTabBox>
            ) : (
                <StyledTabBox gap={2}>
                    <Tabs
                        value={selectedTab}
                        onChange={(_, value: string) => {
                            setSelectedTab(value);
                        }}
                        color="primary"
                    >
                        {Object.keys(variants).map((key, idx: number) => {
                            const selected = variants[key].selected;
                            const name =
                                key.toLowerCase() === 'default'
                                    ? 'Default Variant'
                                    : `Variant ${key.toUpperCase()}`;
                            // const label = selected ? (
                            //     <Stack
                            //         direction="row"
                            //         gap={0}
                            //         alignItems="flex-end"
                            //     >
                            //         <Icon color="primary">
                            //             <CheckCircle />
                            //         </Icon>
                            //         <span>{name}</span>
                            //     </Stack>
                            // ) : (
                            //     name
                            // );
                            return (
                                <Tabs.Item
                                    key={`${key}-${idx}`}
                                    label={name}
                                    value={key}
                                />
                            );
                        })}
                    </Tabs>

                    {displayed.response ? (
                        <Stack direction="column" gap={1}>
                            <StyledContentHeader>
                                <Typography color="secondary" variant="body2">
                                    Model: {displayed.model.name}
                                </Typography>

                                {/* <Checkbox
                                    checked={displayed.selected}
                                    onChange={handleChangeSelected}
                                    label="Use Model"
                                /> */}
                            </StyledContentHeader>

                            <div>{displayed.response}</div>

                            {/* <StyledRatingRow>
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
                                        onMouseEnter={() =>
                                            setHighlightedRating(1)
                                        }
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
                                        onMouseEnter={() =>
                                            setHighlightedRating(2)
                                        }
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
                                        onMouseEnter={() =>
                                            setHighlightedRating(3)
                                        }
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
                                        onMouseEnter={() =>
                                            setHighlightedRating(4)
                                        }
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
                                        onMouseEnter={() =>
                                            setHighlightedRating(5)
                                        }
                                        onFocus={() => setHighlightedRating(5)}
                                    >
                                        {highlightedRating === 5 ? (
                                            <Star />
                                        ) : (
                                            <StarBorder />
                                        )}
                                    </StyledStarButton>
                                </Stack>
                            </StyledRatingRow> */}
                        </Stack>
                    ) : (
                        <div />
                    )}
                </StyledTabBox>
            )}
        </StyledLLMComparisonBlock>
    );
});
