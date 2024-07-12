import { TypeLlmConfig } from '@/components/workspace';
import { Control, Controller } from 'react-hook-form';
import {
    styled,
    Typography,
    Stack,
    Select,
    Slider,
    TextField,
} from '@semoss/ui';
import { useLLMComparison } from '@/hooks';

const StyledLLMEditor = styled('div')(({ theme }) => ({
    width: '100%',
    padding: `0 ${theme.spacing(2)} ${theme.spacing(1)}`,
    borderBottom: `1px solid ${theme.palette.secondary.divider}`,

    '&:last-child': {
        borderBottom: 'none',
    },
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
    maxWidth: theme.spacing(6),
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
                    )}
                />
            </StyledField>

            <StyledField>
                <Typography variant="body2" color="secondary">
                    Top P
                </Typography>

                <Stack gap={2} direction="row" justifyContent="center">
                    <Controller
                        name={`models[${index}].topP`}
                        control={control}
                        render={({ field }) => (
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
                        )}
                    />

                    <Controller
                        name={`models[${index}].topP`}
                        control={control}
                        render={({ field }) => (
                            <StyledTextField
                                type="number"
                                onChange={field.onChange}
                                value={field.value ? field.value : 0}
                            />
                        )}
                    />
                </Stack>
            </StyledField>

            <StyledField>
                <Typography variant="body2" color="secondary">
                    Temperature
                </Typography>

                <Stack gap={2} direction="row" justifyContent="center">
                    <Controller
                        name={`models[${index}].temperature`}
                        control={control}
                        render={({ field }) => (
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
                        )}
                    />

                    <Controller
                        name={`models[${index}].temperature`}
                        control={control}
                        render={({ field }) => (
                            <StyledTextField
                                type="number"
                                onChange={field.onChange}
                                value={field.value ? field.value : 0}
                            />
                        )}
                    />
                </Stack>
            </StyledField>

            <StyledField>
                <Typography variant="body2" color="secondary">
                    Token Length
                </Typography>

                <Stack gap={2} direction="row" justifyContent="center">
                    <Controller
                        name={`models[${index}].length`}
                        control={control}
                        render={({ field }) => (
                            <Slider
                                onChange={field.onChange}
                                value={field.value ? field.value : 0}
                                min={0}
                                max={1024}
                                marks={[
                                    { value: 0, label: '0' },
                                    { value: 1024, label: '1024' },
                                ]}
                                valueLabelDisplay="auto"
                            />
                        )}
                    />

                    <Controller
                        name={`models[${index}].length`}
                        control={control}
                        render={({ field }) => (
                            <StyledTextField
                                type="number"
                                onChange={field.onChange}
                                value={field.value ? field.value : 0}
                            />
                        )}
                    />
                </Stack>
            </StyledField>
        </StyledLLMEditor>
    );
};
