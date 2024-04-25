import { styled, Typography, Button, Stack } from '@semoss/ui';
import { Add, ContentCopy, DeleteOutline } from '@mui/icons-material';
import { TypeVariant, TypeLlmConfig } from './workspace.types';
import { LlmCard } from './LlmCard';
import { AddModelCard } from './AddModelCard';

const StyledVariant = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(1),
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    paddingTop: theme.spacing(3),
}));

const StyledVariantBox = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
    marginTop: theme.spacing(1),
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

interface ModelVariantProps {
    isSelected: boolean;
    variant: TypeVariant;
    index: number;
    click: (number) => void;
}

export const ModelVariant = (props: ModelVariantProps) => {
    const { variant, isSelected, index, click } = props;

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
        <StyledVariant onClick={() => click(index)}>
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

            {isSelected && (
                <StyledStack direction="row" spacing={2}>
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
            )}
        </StyledVariant>
    );
};
