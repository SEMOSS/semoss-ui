import { TypeLlmConfig } from '@/components/workspace';
import { Control, Controller } from 'react-hook-form';
import {
    styled,
    Typography,
    Stack,
    Select,
    Slider,
    TextField,
    FormControl,
} from '@semoss/ui';
import { useLLMComparison } from '@/hooks';
import { FormHelperText } from '@mui/material';

const StyledLLMEditor = styled('div')(({ theme }) => ({
    width: '100%',
    padding: `0 ${theme.spacing(2)} ${theme.spacing(1)}`,
    borderBottom: `1px solid ${theme.palette.secondary.divider}`,

    '&:last-child': {
        borderBottom: 'none',
    },
}));

const StyledError = styled(FormHelperText)(({ theme }) => ({
    color: theme.palette.error.text,
}));

const StyledHeader = styled('div')(({ theme }) => ({
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: theme.spacing(1),
}));

const StyledField = styled(Stack)(({ theme }) => ({
    padding: `${theme.spacing(1)}`,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    maxWidth: theme.spacing(9),
}));

interface PropsLLMEditor {
    /** Model currently populated/saved to the variant */
    model: TypeLlmConfig;

    /** Model's index within the form's 'models' */
    index: number;

    /** control used for managing state in form hook */
    control: Control<any, any>;
}

export const LLMEditor = (props: PropsLLMEditor) => {
    const { allModels } = useLLMComparison();
    const { model, index, control } = props;

    return (
        <StyledLLMEditor>
            <StyledHeader>
                <Typography variant="subtitle1" fontWeight="medium">
                    Swap Model for {model.alias}
                </Typography>
            </StyledHeader>

            <StyledField gap={1} direction="column">
                <Typography variant="body2" color="secondary">
                    Select Model
                </Typography>

                <Controller
                    name={`models[${index}].value`}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                        <FormControl>
                            <Select
                                value={field.value ? field.value : ''}
                                onChange={field.onChange}
                                error={!!fieldState.error}
                            >
                                {allModels.map((model, idx) => (
                                    <Select.Item
                                        key={`${model.value}-${idx}`}
                                        value={model.value}
                                    >
                                        {model.database_name}
                                    </Select.Item>
                                ))}
                            </Select>
                            {fieldState.error && (
                                <StyledError>
                                    Please select an option for the Model.
                                </StyledError>
                            )}
                        </FormControl>
                    )}
                />
            </StyledField>

            <StyledField>
                <Typography variant="body2" color="secondary">
                    Top P
                </Typography>

                <Controller
                    name={`models[${index}].topP`}
                    control={control}
                    rules={{ min: 0, max: 1 }}
                    render={({ field, fieldState }) => (
                        <FormControl>
                            <Stack
                                gap={2}
                                direction="row"
                                justifyContent="center"
                            >
                                <Slider
                                    onChange={field.onChange}
                                    value={field.value ? field.value : 0}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    marks={[
                                        { value: 0, label: '0' },
                                        { value: 1, label: '1' },
                                    ]}
                                    valueLabelDisplay="auto"
                                />
                                <StyledTextField
                                    type="number"
                                    onChange={field.onChange}
                                    error={!!fieldState.error}
                                    value={field.value ? field.value : 0}
                                />
                            </Stack>
                            {!!fieldState.error && (
                                <StyledError>
                                    The value for Top P must be between 0 and 1.
                                </StyledError>
                            )}
                        </FormControl>
                    )}
                />
            </StyledField>

            <StyledField>
                <Typography variant="body2" color="secondary">
                    Temperature
                </Typography>

                <Controller
                    name={`models[${index}].temperature`}
                    control={control}
                    rules={{ min: 0, max: 1 }}
                    render={({ field, fieldState }) => (
                        <FormControl>
                            <Stack
                                gap={2}
                                direction="row"
                                justifyContent="center"
                            >
                                <Slider
                                    onChange={field.onChange}
                                    value={field.value ? field.value : 0}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    marks={[
                                        { value: 0, label: '0' },
                                        { value: 1, label: '1' },
                                    ]}
                                    valueLabelDisplay="auto"
                                />
                                <StyledTextField
                                    type="number"
                                    onChange={field.onChange}
                                    error={!!fieldState.error}
                                    value={field.value ? field.value : 0}
                                />
                            </Stack>
                            {!!fieldState.error && (
                                <StyledError>
                                    The value for Temperature must be between 0
                                    and 1.
                                </StyledError>
                            )}
                        </FormControl>
                    )}
                />
            </StyledField>

            <StyledField>
                <Typography variant="body2" color="secondary">
                    Token Length
                </Typography>

                <Controller
                    name={`models[${index}].length`}
                    control={control}
                    rules={{ min: 0, max: 1024 }}
                    render={({ field, fieldState }) => (
                        <FormControl>
                            <Stack
                                gap={2}
                                direction="row"
                                justifyContent="center"
                            >
                                <Slider
                                    onChange={field.onChange}
                                    value={field.value ? field.value : 0}
                                    min={0}
                                    max={1024}
                                    step={1}
                                    marks={[
                                        { value: 0, label: '0' },
                                        { value: 1024, label: '1024' },
                                    ]}
                                    valueLabelDisplay="auto"
                                />
                                <StyledTextField
                                    type="number"
                                    onChange={field.onChange}
                                    error={!!fieldState.error}
                                    value={field.value ? field.value : 0}
                                />
                            </Stack>
                            {!!fieldState.error && (
                                <StyledError>
                                    The value for Token Length must be between 0
                                    and 1024.
                                </StyledError>
                            )}
                        </FormControl>
                    )}
                />
            </StyledField>
        </StyledLLMEditor>
    );
};
