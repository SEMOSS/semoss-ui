import { useState, useEffect, useRef } from 'react';
import { useBlock, useBlocks } from '@/hooks';
import {
    ActionMessages,
    BlockComponent,
    BlockDef,
    CellState,
    Variant,
} from '@/stores';
import {
    IconButton,
    Stack,
    Tabs,
    Typography,
    styled,
    Icon,
    Checkbox,
    useNotification,
} from '@semoss/ui';
import { runPixel } from '@/api';
import { observer } from 'mobx-react-lite';
import { CheckCircle } from '@mui/icons-material';
import { Rating } from '@mui/material';
import { CircularProgress } from '@semoss/ui';

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
    const notification = useNotification();
    const cellIsLoadingRef = useRef(false);
    const [loadingRating, toggleLodaingRating] = useState(false);
    const [selectedTab, setSelectedTab] = useState<string>('');
    const [variable, setVariable] = useState(null);
    const [cell, setCell] = useState(null);
    const [variants, setVariants] = useState({});
    const displayed = (variants || {})[selectedTab] || {};
    const rating = displayed.rating ? displayed.rating : 0;

    // get the blocks' cell
    useEffect(() => {
        if (!data.variableId) {
            setVariants({});
            setVariable(null);
            setCell(null);
            return;
        } else if (typeof data.variableId === 'string') {
            const variable = state.variables[data.variableId];
            setVariable(variable || null);
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
                    messageId: (selectedCell?.output || [])[idx]?.messageId,
                    rating: null,
                    selected: variant.selected,
                };
            },
        );

        const variantKeys = Object.keys(modelledVars);
        setSelectedTab(variantKeys[0] || '');
        setVariants(modelledVars);
    };

    // Set the new rating in the DB and update the variant's rating in state.
    const handleRateResponse = async (num: number) => {
        toggleLodaingRating(true);
        const pixel = `SubmitLlmFeedback(messageId="${displayed.messageId}", feedbackText="${num}", rating=true);`;

        try {
            await runPixel(pixel);
            const variantsCopy = { ...variants };
            variantsCopy[displayed.id].rating = num;
            setVariants(variantsCopy);
        } catch {
            notification.add({
                color: 'error',
                message: `There was an error setting a rating for the response.`,
            });
        } finally {
            toggleLodaingRating(false);
        }
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

        // update variants in the cell's state.
        const cellVariants = { ...cell.parameters.variants };
        if (currentSelected) cellVariants[currentSelected].selected = false;
        cellVariants[displayed.id].selected = true;
        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: variable.to,
                cellId: cell.id,
                path: `parameters.variants`,
                value: cellVariants,
            },
        });
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
                            const variantName =
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
                                    <span>{variantName}</span>
                                </Stack>
                            ) : (
                                variantName
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
                                    label="Use Response"
                                />
                            </StyledContentHeader>

                            {cell?.isLoading ? (
                                <StyledLoadingBar>
                                    <CircularProgress />
                                </StyledLoadingBar>
                            ) : (
                                <div>{displayed.response}</div>
                            )}

                            <StyledRatingRow>
                                <Typography color="secondary" variant="body2">
                                    What would you rate this response?
                                </Typography>

                                {loadingRating ? (
                                    <CircularProgress />
                                ) : (
                                    <Rating
                                        value={rating}
                                        onChange={(e, val) =>
                                            handleRateResponse(val)
                                        }
                                    />
                                )}
                            </StyledRatingRow>
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
