import { useEffect } from 'react';
import { useLLMComparison } from '@/hooks';
import { styled, Stack, Typography } from '@semoss/ui';
import { LLMEditor } from './LLMEditor';

const StyledVariantEditor = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

export const VariantEditor = () => {
    const { watch, getValues, setValue } = useLLMComparison();
    const editorVariantName = watch('editorVariantName');

    // If there is no established variant, create one for the user to edit
    useEffect(() => {
        const { editorVariant } = getValues();
        if (!editorVariant) {
            const newVariant = {
                model: {
                    value: null,
                    database_name: null,
                    database_type: null,
                    database_subtype: null,
                    topP: 0,
                    temperature: 0,
                    length: 0,
                },
                sortWeight: 0, // TODO
                trafficAllocation: 0, // TODO
            };
            setValue('editorVariant', newVariant);
        }
    }, []);

    return (
        <StyledVariantEditor gap={2} direction="column">
            <Typography variant="subtitle1" color="secondary" fontWeight="bold">
                {(editorVariantName || '').toLowerCase() === 'default'
                    ? 'Default Variant'
                    : `Variant ${editorVariantName}`}
            </Typography>

            <LLMEditor />
        </StyledVariantEditor>
    );
};
