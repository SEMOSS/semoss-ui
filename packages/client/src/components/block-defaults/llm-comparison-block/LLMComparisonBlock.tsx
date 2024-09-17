import { useState, useEffect, useRef } from 'react';
import { useBlock, useBlocks } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { IconButton, Stack, Tabs, Typography, styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
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

export interface LLMComparisonBlockDef extends BlockDef<'llmComparison'> {
    widget: 'llmComparison';
    slots: never;
}

export const LLMComparisonBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock(id);
    const { state } = useBlocks();
    const tabsLengthRef = useRef(0);
    const [selectedTab, setSelectedTab] = useState<string | null>(null);
    const [variants, setVariants] = useState({});
    const variantTabs: string[] = Object.keys(variants || {});
    const displayed = (variants || {})[selectedTab] || {};

    const [highlightedRating, setHighlightedRating] = useState(0);

    // Reset selected tab when variants are changed.
    useEffect(() => {
        if (variantTabs.length !== tabsLengthRef.current) {
            setSelectedTab(variantTabs[0] || null);
            tabsLengthRef.current = variantTabs.length;
        }
    }, [variantTabs]);

    // Fetch and save variants stored in query to state.
    useEffect(() => {
        if (!data.queryId) {
            setVariants({});
            return;
        }

        const query = state.getQuery(data.queryId);

        let modelledVars = {};
        Object.values(query.cells).forEach((cell) => {
            const cellVars = {};
            Object.values(cell.parameters.variants).forEach((variant, idx) => {
                cellVars[variant.id] = {
                    ...variant,
                    response: (cell.output || [])[idx]?.response,
                };
            });

            modelledVars = {
                ...modelledVars,
                ...cellVars,
            };
        });

        setVariants(modelledVars);
    }, [data.queryId]);

    const handleRateResponse = (num: number) => {
        // TODO: set rating for a variant's response using the rating from the 'num' param.
    };

    return (
        <StyledLLMComparisonBlock {...attrs}>
            <Typography variant="h6">Response</Typography>

            {variantTabs.length === 0 ? (
                <StyledTabBox>
                    <Typography variant="body2">
                        Add a query with variants to generate responses.
                    </Typography>
                </StyledTabBox>
            ) : (
                <StyledTabBox gap={2}>
                    <Tabs
                        value={selectedTab || null}
                        onChange={(_, value: string) => {
                            setSelectedTab(value);
                        }}
                        color="primary"
                    >
                        {variantTabs.map((tab, idx: number) => (
                            <Tabs.Item
                                key={`${tab}-${idx}`}
                                label={`Variant ${tab}`}
                                value={tab}
                            />
                        ))}
                    </Tabs>

                    {displayed.response ? (
                        <Stack direction="column" gap={2}>
                            <Typography color="secondary" variant="body2">
                                {displayed.models?.length === 1
                                    ? 'Model: '
                                    : 'Models: '}
                                {displayed.models?.map((model, idx: number) => {
                                    let returnString = model;
                                    if (idx + 1 !== displayed.models?.length)
                                        returnString += ', ';
                                    return returnString;
                                })}
                            </Typography>

                            <div>{displayed.response}</div>

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
                            </StyledRatingRow>
                        </Stack>
                    ) : (
                        <div />
                    )}
                </StyledTabBox>
            )}
        </StyledLLMComparisonBlock>
    );
});
