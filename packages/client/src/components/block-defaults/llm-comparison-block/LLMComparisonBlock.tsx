import { useState, useEffect } from 'react';
import { useBlock } from '@/hooks';
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
    const [selectedTab, setSelectedTab] = useState('0');
    const [responses, setResponses] = useState([]);
    const displayedRes = responses[selectedTab];

    const [highlightedRating, setHighlightedRating] = useState(0);

    useEffect(() => {
        // TODO: update 'responses' in state when the data changes.
    }, []);

    const handleRateResponse = (num: number) => {
        // TODO: set rating for a variant's response using the rating from the 'num' param.
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
                    {responses.map((entry, idx: number) => (
                        <Tabs.Item
                            key={`${entry.name}-${idx}`}
                            label={`Variant ${entry.name}`}
                            value={idx.toString()}
                        />
                    ))}
                </Tabs>

                {responses.length === 0 ? (
                    <Typography variant="body2">
                        No response available.
                    </Typography>
                ) : (
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

                        <div>{displayedRes.response}</div>

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
                )}
            </StyledTabBox>
        </StyledLLMComparisonBlock>
    );
});
