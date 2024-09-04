import { useLLMComparison } from '@/hooks';
import { styled, Stack, Typography } from '@semoss/ui';
import { LLMEditor } from './LLMEditor';
import { TypeLlmConfig } from '@/components/workspace';

const StyledVariantEditor = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

export const VariantEditor = () => {
    const { watch } = useLLMComparison();
    const editorVariant = watch('editorVariant');
    const editorVariantName = watch('editorVariantName');

    return (
        <StyledVariantEditor gap={2} direction="column">
            <Typography variant="subtitle1" color="secondary" fontWeight="bold">
                {editorVariantName.toLowerCase() === 'default'
                    ? 'Default Variant'
                    : `Variant ${editorVariantName}`}
            </Typography>

            <LLMEditor model={editorVariant.model} />
        </StyledVariantEditor>
    );
};
