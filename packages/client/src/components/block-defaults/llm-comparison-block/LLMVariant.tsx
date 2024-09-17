import { styled, Typography, Stack, IconButton } from '@semoss/ui';
import { Close } from '@mui/icons-material';
import { TypeVariant, TypeVariants } from '../../workspace/workspace.types';
import { useState } from 'react';
import { LlmCard } from './LlmCard';
import { useBlock, useBlocks, useLLMComparison } from '@/hooks';
import { LLMComparisonBlockDef } from './LLMComparisonBlock';

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
    const { setData } = useBlock<LLMComparisonBlockDef>(blockId);
    const { state } = useBlocks();

    const handleDeleteVariant = () => {
        const variantsCopy: TypeVariants = { ...getValues('variants') };
        const deleted = variantsCopy[variantName];
        delete variantsCopy[variantName];
        deleteVariantFromAppJson(deleted);
        setValue('variants', variantsCopy);
    };

    const deleteVariantFromAppJson = (variant: TypeVariant) => {
        // TODO: need to add action in store for deleting a variant in a cell.
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
                            : `Variant ${variantName}`}
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
