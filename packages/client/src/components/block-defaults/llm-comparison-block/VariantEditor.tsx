import { useLLMComparison } from '@/hooks';
import { Controller } from 'react-hook-form';
import { styled, Stack, TextField, Typography, FormControl } from '@semoss/ui';
import { FormHelperText } from '@mui/material';
import { LLMEditor } from './LLMEditor';
import { TypeLlmConfig } from '@/components/workspace';

const StyledVariantEditor = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

const StyledField = styled(Stack)(({ theme }) => ({
    padding: `${theme.spacing(1)}`,
}));

const StyledError = styled(FormHelperText)(({ theme }) => ({
    color: theme.palette.error.text,
}));

export const VariantEditor = () => {
    const { control, watch } = useLLMComparison();
    const ModelsInEditor = watch('ModelsInEditor');

    return (
        <StyledVariantEditor gap={2} direction="column">
            <StyledField gap={1} direction="column">
                <Typography
                    variant="subtitle1"
                    color="secondary"
                    fontWeight="bold"
                >
                    Variant Name
                </Typography>
                <Controller
                    name="newVariantName"
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                        <FormControl>
                            <TextField
                                onChange={field.onChange}
                                value={field.value ? field.value : ''}
                            />
                            {fieldState.error && (
                                <StyledError>
                                    Please enter a unique name for the new
                                    Variant.
                                </StyledError>
                            )}
                        </FormControl>
                    )}
                />
            </StyledField>

            {ModelsInEditor.map((model: TypeLlmConfig, idx: number) => (
                <LLMEditor
                    key={`LLM-${model.value}-${idx}`}
                    model={model}
                    index={idx}
                />
            ))}
        </StyledVariantEditor>
    );
};
