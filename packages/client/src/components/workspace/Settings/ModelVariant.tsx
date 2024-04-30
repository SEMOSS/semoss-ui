import { styled, Typography, Button, Stack, Collapse } from '@semoss/ui';
import { Add, ContentCopy, DeleteOutline } from '@mui/icons-material';
import { TypeVariant, TypeLlmConfig } from '../workspace.types';
import { useState } from 'react';
import { LlmCard } from './LlmCard';
import { AddModelCard } from './AddModelCard';

const StyledStack = styled(Stack)(({ theme }) => ({
    paddingTop: theme.spacing(3),
}));

const StyledVariantBox = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(2),
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),

    ...(selected && {
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
    isSelected: boolean;
    variant: TypeVariant;
    index: number;
    click: (number) => void;
}

export const ModelVariant = (props: ModelVariantProps) => {
    const { variant, isSelected, index, click } = props;
    const [hovered, setHovered] = useState(false);

    const handleAddVariant = (idx: number) => {
        // TODO
    };

    const handleDuplicateVariant = (idx: number) => {
        // TODO
    };

    const handleDeleteVariant = (idx: number) => {
        // TODO
    };

    return (
        <div onClick={() => click(index)}>
            <Typography variant="body1" fontWeight="medium">
                {index === 0 ? `Default (${variant.name})` : variant.name}
            </Typography>
            <StyledVariantBox selected={isSelected}>
                {variant.models.map((model: TypeLlmConfig, mIdx: number) => {
                    return (
                        <LlmCard
                            key={`${variant.name}-${model.name}-${mIdx}`}
                            llm={model}
                            isSelected={isSelected}
                        />
                    );
                })}
                {variant.models.length < 3 && <AddModelCard />}
                {variant.models.length < 2 && <AddModelCard />}
                {variant.models.length < 1 && <AddModelCard />}
            </StyledVariantBox>

            <StyledRow
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onFocus={() => setHovered(true)}
                onBlur={() => setHovered(false)}
            >
                <StyledActionBar in={isSelected || hovered}>
                    <StyledStack direction="row" gap={2}>
                        <Button
                            variant="text"
                            color="secondary"
                            onClick={() => handleAddVariant(index)}
                            startIcon={<Add />}
                        >
                            Add Variant
                        </Button>
                        <Button
                            variant="text"
                            color="secondary"
                            onClick={() => handleDuplicateVariant(index)}
                            startIcon={<ContentCopy />}
                        >
                            Duplicate
                        </Button>
                        {index !== 0 && (
                            <Button
                                variant="text"
                                color="secondary"
                                onClick={() => handleDeleteVariant(index)}
                                startIcon={<DeleteOutline />}
                            >
                                Delete
                            </Button>
                        )}
                    </StyledStack>
                </StyledActionBar>
            </StyledRow>
        </div>
    );
};
