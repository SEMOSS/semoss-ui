import { Stack, Typography, styled, IconButton } from '@semoss/ui';
import { TypeVariant, TypeLlmConfig } from '@/components/workspace';
import { useEffect, useState } from 'react';
import { DragIndicatorOutlined } from '@mui/icons-material';
import { useLLMComparison } from '@/hooks';

const StyledVariantOrderBox = styled(Stack)(({ theme }) => ({
    border: `1px soid ${theme.palette.primary.border}`,
    borderRadius: theme.spacing(1.5),
}));

export const VariantDragAndDrop = () => {
    const [orderedVars, setOrderedVars] = useState<TypeVariant[]>([]);
    const { getValues } = useLLMComparison();

    useEffect(() => {
        const defaultVar = getValues('defaultVariant');
        const currVariants = getValues('variants');
        setOrderedVars([defaultVar, currVariants]);
    }, []);

    return (
        <Stack direction="row" gap={1}>
            {orderedVars.map((variant: TypeVariant, idx) => (
                <Stack
                    direction="row"
                    gap={2}
                    alignItems="center"
                    key={`variant-drag-box-${idx}`}
                >
                    <Typography variant="subtitle2" fontWeight="bold">
                        {idx}
                    </Typography>
                    <StyledVariantOrderBox direction="row" gap={2}>
                        <div>
                            <Typography variant="body2">
                                {variant.name}
                            </Typography>
                            <Typography variant="caption">
                                {variant.models.map(
                                    (mod: TypeLlmConfig) => mod.alias,
                                )}
                            </Typography>
                        </div>
                        <IconButton>
                            <DragIndicatorOutlined />
                        </IconButton>
                    </StyledVariantOrderBox>
                </Stack>
            ))}
        </Stack>
    );
};
