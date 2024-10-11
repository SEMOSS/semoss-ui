import { useState, useEffect, useRef } from 'react';
import { useBlock, useBlocks } from '@/hooks';
import { BlockComponent, BlockDef, CellState, Variant } from '@/stores';
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
import { CircularProgress } from '@semoss/ui';
import { toJS } from 'mobx';

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

const StyledLoadingBar = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(2),
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
    const cellIsLoadingRef = useRef(false);
    const [selectedTab, setSelectedTab] = useState<string>('');
    const [cell, setCell] = useState(null);
    const [variants, setVariants] = useState({});
    const displayed = (variants || {})[selectedTab] || {};
    const [highlightedRating, setHighlightedRating] = useState(0);

    // get the blocks' cell
    useEffect(() => {
        if (!data.variableId) {
            setVariants({});
            setCell(null);
            return;
        } else {
            if (typeof data.variableId === 'string') {
                // todod
                const variable = state.variables[data.variableId];
                if (!variable || variable.type !== 'cell') {
                    console.log(
                        `Error retrieving variable with ID: ${data.variableId}`,
                    );
                } else {
                    const query = state.getQuery(variable.to);
                    const c = query.getCell(variable.cellId);
                    if (c) {
                        setCell(c);
                        getVariantsFromCell(c);
                    } else {
                        console.log('Error retrieving Cell from the variable.');
                    }
                }
            }
        }
    }, [data.variableId]);

    // Refresh the variant's responses when the query has finished loading.
    useEffect(() => {
        if (!cell) return;

        if (!cell.isLoading && cellIsLoadingRef.current === true) {
            cellIsLoadingRef.current = false;
            getVariantsFromCell(cell);
        }
        cellIsLoadingRef.current = cell.isLoading;
    }, [cell, cell?.isLoading]);

    // Fetch and save variants stored in cell to state.
    const getVariantsFromCell = (selectedCell: CellState) => {
        const modelledVars = {};
        Object.values(selectedCell.parameters.variants).forEach(
            (variant: Variant, idx) => {
                modelledVars[variant.id] = {
                    ...variant,
                    response: (selectedCell?.output || [])[idx]?.response,
                    selected: idx === 0,
                };
            },
        );

        const variantKeys = Object.keys(modelledVars);
        setSelectedTab(variantKeys[0] || '');
        setVariants(modelledVars);
    };

    const handleRateResponse = (num: number) => {
        // TODO: set rating for a variant's response using the rating from the 'num' param.
    };

    const handleChangeSelected = () => {
        const variantsCopy = { ...variants };

        // Prevent user from de-selecting variant. (one must always be selected).
        if (displayed.selected) return;

        // update the newly selected variant, and de-select all others.
        let currentSelected;
        Object.keys(variantsCopy).forEach((key: string) => {
            if (variantsCopy[key].selected) currentSelected = key;
            variantsCopy[key].selected = selectedTab === key ? true : false;
        });

        setVariants(variantsCopy);

        // TODO: update variants in the appropriate cell.
    };

    return (
        <StyledLLMComparisonBlock {...attrs}>
            <Typography variant="h6">Response</Typography>

            {Object.keys(variants).length === 0 ? (
                <StyledTabBox>
                    <Typography variant="body2">
                        Add a LLM Cell with variants to generate responses with.
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
                            const label = selected ? (
                                <Stack
                                    direction="row"
                                    gap={0}
                                    alignItems="flex-end"
                                >
                                    <Icon color="primary">
                                        <CheckCircle />
                                    </Icon>
                                    <span>{name}</span>
                                </Stack>
                            ) : (
                                name
                            );
                            return (
                                <Tabs.Item
                                    key={`${key}-${idx}`}
                                    label={label}
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

                                <Checkbox
                                    checked={displayed.selected}
                                    onChange={handleChangeSelected}
                                    label="Use Model"
                                />
                            </StyledContentHeader>

                            {cell?.isLoading ? (
                                <StyledLoadingBar>
                                    <CircularProgress />
                                </StyledLoadingBar>
                            ) : (
                                <div>{displayed.response}</div>
                            )}

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
                        <>
                            {cell?.isLoading ? (
                                <StyledLoadingBar>
                                    <CircularProgress />
                                </StyledLoadingBar>
                            ) : (
                                <Typography variant="body1">
                                    Generate responses from the cell and view
                                    them here.
                                </Typography>
                            )}
                        </>
                    )}
                </StyledTabBox>
            )}
        </StyledLLMComparisonBlock>
    );
});
