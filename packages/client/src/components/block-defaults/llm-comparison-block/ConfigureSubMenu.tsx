import { styled, Stack, Button } from '@semoss/ui';
import { useLLMComparison } from '@/hooks';
import { ModelVariant } from './ModelVariant';
import { Add, ContentCopy } from '@mui/icons-material';

const StyledVariantActions = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(1),
}));

export const ConfigureSubMenu = () => {
    const { variants, defaultVariant } = useLLMComparison();

    const handleAddVariant = () => {
        // TODO
    };

    const handleDuplicate = () => {
        // TODO
    };

    return (
        <Stack direction="column" gap={2}>
            <ModelVariant
                isDefault={true}
                variant={defaultVariant}
                index={-1}
            />

            {variants.map((variant, idx: number) => (
                <ModelVariant
                    variant={variant}
                    index={idx}
                    key={`variant-${idx}`}
                />
            ))}

            <StyledVariantActions>
                <Button
                    onClick={handleAddVariant}
                    variant="text"
                    disabled={!defaultVariant}
                    color="secondary"
                    startIcon={<Add />}
                >
                    Add Variant
                </Button>

                <Button
                    onClick={handleDuplicate}
                    variant="text"
                    disabled={!defaultVariant}
                    color="secondary"
                    startIcon={<ContentCopy />}
                >
                    Duplicate
                </Button>
            </StyledVariantActions>
        </Stack>
    );
};
