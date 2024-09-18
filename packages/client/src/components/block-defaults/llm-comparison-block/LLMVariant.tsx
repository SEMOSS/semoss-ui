import { styled, Typography, Stack, IconButton } from '@semoss/ui';
import { Close } from '@mui/icons-material';
import { TypeVariant } from '../../workspace/workspace.types';
import { useState } from 'react';
import { LlmCard } from './LlmCard';
import { useBlock, useBlocks, useLLMComparison } from '@/hooks';
import { LLMComparisonBlockDef } from './LLMComparisonBlock';
import { ActionMessages, CellState } from '@/stores';

const StyledVariantHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const StyledVariantBox = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isVertical',
})<{ isVertical: boolean }>(({ theme, isVertical }) => ({
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(2),
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),

    ...(isVertical && {
        flexDirection: 'column',
        alignItems: 'stretch',
    }),
}));

interface ModelVariantProps {
    /** name of variant used as its ID in the 'variants' object in state */
    variantName: string;

    /** variant and LLM data */
    variant: TypeVariant;

    /** sets the orientation for how the models are displayed */
    orientation?: 'column' | 'row';
}

export const LLMVariant = (props: ModelVariantProps) => {
    const { variantName, variant, orientation = 'column' } = props;
    const isDefault = variantName.toLowerCase() === 'default';
    const [hovered, setHovered] = useState(false);
    const { setValue, getValues, blockId } = useLLMComparison();
    const { data } = useBlock<LLMComparisonBlockDef>(blockId);
    const { state } = useBlocks();

    // Delete the Variant in the app json and update the Comparison Block menu's state.
    const handleDeleteVariant = () => {
        let query;
        if (typeof data.queryId === 'string') {
            query = state.getQuery(data.queryId);
        } else {
            console.log("Type of 'data.queryId' is NOT a string");
            return;
        }

        // Find the Cell in the query that contains the variant matching variantName
        let cellMatch;
        const cells: CellState[] = Object.values(query.cells);
        for (let i = 0; i < cells.length; i++) {
            const cellVariants = cells[i]?.parameters.variants || {};
            const found = Object.keys(cellVariants).find(
                (key) => key === variantName,
            );
            if (found) {
                cellMatch = cells[i];
                break;
            }
        }

        // Remove variant from the Cell and save to cell's state
        delete cellMatch.parameters.variants[variantName];
        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: cellMatch.query.id,
                cellId: cellMatch.id,
                path: `parameters.variants`,
                value: cellMatch.parameters.variants,
            },
        });

        // Remove variant from LLMComparisonMenu's State
        const variantsCopy = { ...getValues('variants') };
        delete variantsCopy[variantName];
        setValue('variants', variantsCopy);
    };

    return (
        <Stack
            direction="column"
            gap={1}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
        >
            <StyledVariantHeader>
                <Stack direction="row" alignItems="center">
                    <Typography variant="body1" fontWeight="medium">
                        {isDefault
                            ? 'Default Variant'
                            : `Variant ${variantName.toUpperCase()}`}
                    </Typography>
                </Stack>

                {!isDefault && (
                    <IconButton onClick={handleDeleteVariant}>
                        <Close />
                    </IconButton>
                )}
            </StyledVariantHeader>

            <StyledVariantBox isVertical={orientation === 'column'}>
                <LlmCard
                    llm={variant.model}
                    variantName={variantName}
                    isVariantHovered={hovered}
                />
            </StyledVariantBox>
        </Stack>
    );
};
