import { styled, Typography, Button, Stack, Collapse } from '@semoss/ui';
import { Add, ContentCopy, DeleteOutline } from '@mui/icons-material';
import { TypeVariant, TypeLlmConfig } from '../workspace.types';
import { useState } from 'react';
import { LlmCard } from './LlmCard';
import { AddModelCard } from './AddModelCard';
import { useLLMComparison } from '@/hooks';
import { LLMSwapCard } from './LLMSwapCard';

const StyledStack = styled(Stack)(({ theme }) => ({
    paddingTop: theme.spacing(3),
}));

const StyledVariantBox = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isDefault',
})<{ isDefault?: boolean }>(({ theme, isDefault }) => ({
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(2),
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),

    ...(isDefault && {
        boxShadow: '0px 5px 8px 0px #00000014',
    }),
}));

const StyledRow = styled('div')(({ theme }) => ({
    position: 'relative',
    height: '50px',
}));

const StyledActionBar = styled(Collapse)(({ theme }) => ({
    position: 'absolute',
    paddingTop: theme.spacing(2),
    top: theme.spacing(-2),
    width: '100%',
    zIndex: 1,
}));

interface ModelVariantProps {
    // isSelected: boolean;
    // variant?: TypeVariant;
    index?: number;
    click?: (number) => void;

    /** is a part of the default variant used in app */
    isDefault?: boolean;

    /** variant info, the models associated to variant */
    models: TypeLlmConfig[];
}

export const ModelVariant = (props: ModelVariantProps) => {
    const { index, models, isDefault } = props;
    const [hovered, setHovered] = useState(false);
    const { defaultVariant, addNewVariant, deleteVariant } = useLLMComparison();

    return (
        <Stack direction="column" gap={1}>
            <Typography variant="body1" fontWeight="medium">
                {index === -1 ? 'Default Variant' : `Variant ${index + 1}`}
            </Typography>
            <StyledVariantBox isDefault={isDefault}>
                {models.map((model: TypeLlmConfig, mIdx: number) => {
                    if (!model) {
                        return (
                            <LLMSwapCard
                                key={`llm-card--variant-${index}--model-${mIdx}`}
                                variantIndex={index}
                                modelIndex={mIdx}
                            />
                        );
                    } else {
                        return (
                            <LlmCard
                                key={`llm-card--variant-${index}--model-${mIdx}`}
                                llm={model}
                                variantIndex={index}
                                modelIndex={mIdx}
                                isDefault={isDefault}
                            />
                        );
                    }
                })}
            </StyledVariantBox>

            <StyledRow
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onFocus={() => setHovered(true)}
                onBlur={() => setHovered(false)}
            >
                <StyledActionBar in={isDefault || hovered}>
                    <StyledStack direction="row" gap={2}>
                        <Button
                            variant="text"
                            color="secondary"
                            onClick={() => {
                                const variantListWithPlaceholder: null[] =
                                    new Array(defaultVariant.length).fill(null);
                                addNewVariant(variantListWithPlaceholder);
                            }}
                            startIcon={<Add />}
                        >
                            Add Variant
                        </Button>
                        <Button
                            variant="text"
                            color="secondary"
                            onClick={() => addNewVariant(index)}
                            startIcon={<ContentCopy />}
                        >
                            Duplicate
                        </Button>
                        {index !== -1 && (
                            <Button
                                variant="text"
                                color="secondary"
                                onClick={() => deleteVariant(index)}
                                startIcon={<DeleteOutline />}
                            >
                                Delete
                            </Button>
                        )}
                    </StyledStack>
                </StyledActionBar>
            </StyledRow>
        </Stack>
    );
};
