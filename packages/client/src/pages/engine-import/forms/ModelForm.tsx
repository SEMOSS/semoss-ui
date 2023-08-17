import React, { useEffect } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import {
    Button,
    IconButton,
    TextField,
    Stack,
    styled,
    Menu,
    Select,
} from '@semoss/ui';
import { Delete } from '@mui/icons-material';
import { useImport } from '@/hooks';

const StyledFlexEnd = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
}));

const StyledProperty = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledKeyValue = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
}));

export const ModelForm = (props) => {
    const { submitFunc } = props;

    const { control, handleSubmit, setValue } = useForm({
        defaultValues: {
            NAME: '',
            MODEL: '',
            MODEL_TYPE: '',
            S3_REGION: '',
            S3_ACCESS_KEY: '',
            S3_SECRET_KEY: '',
            S3_ENDPOINT: '',
            SMSS_PROPERTIES: [],
        },
    });

    const { fields, remove, append } = useFieldArray({
        control,
        name: 'SMSS_PROPERTIES',
    });

    // Model in last step
    const { steps } = useImport();

    useEffect(() => {
        const lastStep = steps[steps.length - 1];
        setValue('MODEL', lastStep.title);
    }, [steps.length]);

    const onSubmit = async (data) => {
        const smssProperties = {};

        smssProperties['MODEL'] = data.MODEL;
        smssProperties['MODEL_TYPE'] = data.MODEL_TYPE;
        smssProperties['S3_REGION'] = data.S3_REGION;
        smssProperties['S3_ACCESS_KEY'] = data.S3_ACCESS_KEY;
        smssProperties['S3_ENDPOINT'] = data.S3_ENDPOINT;
        smssProperties['S3_SECRET_KEY'] = data.S3_REGION;

        // Format the JSON to send back to submission in parent
        data.SMSS_PROPERTIES.forEach((obj) => {
            if (!smssProperties[obj.KEY]) {
                smssProperties[obj.KEY] = obj.VALUE;
            }
        });

        const formVals = {
            type: 'model',
            storage: data.NAME,
            fields: smssProperties,
        };

        submitFunc(formVals);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack rowGap={2}>
                <StyledKeyValue>
                    <Controller
                        name={'MODEL'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;
                            return (
                                <TextField
                                    fullWidth
                                    required
                                    label="Model"
                                    disabled={true}
                                    value={field.value ? field.value : ''}
                                    onChange={(value) => field.onChange(value)}
                                ></TextField>
                            );
                        }}
                    />
                </StyledKeyValue>

                <StyledKeyValue>
                    <Controller
                        name={'MODEL_TYPE'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;
                            return (
                                <Select
                                    fullWidth
                                    required
                                    label="Model Type"
                                    value={field.value ? field.value : ''}
                                    onChange={(value) => field.onChange(value)}
                                >
                                    <Menu.Item value={'EMBEDDED'}>
                                        Embedded
                                    </Menu.Item>
                                    <Menu.Item value={'FAST_CHAT'}>
                                        Fast Chat
                                    </Menu.Item>
                                    <Menu.Item value={'OPEN_AI'}>
                                        Open AI
                                    </Menu.Item>
                                    <Menu.Item value={'TEXT_GENERATION'}>
                                        Text Generation
                                    </Menu.Item>
                                </Select>
                            );
                        }}
                    />
                </StyledKeyValue>

                <StyledKeyValue>
                    <Controller
                        name={'NAME'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;
                            return (
                                <TextField
                                    fullWidth
                                    required
                                    label="Name"
                                    value={field.value ? field.value : ''}
                                    onChange={(value) => field.onChange(value)}
                                ></TextField>
                            );
                        }}
                    />
                </StyledKeyValue>

                <StyledKeyValue>
                    <Controller
                        name={'S3_REGION'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;
                            return (
                                <TextField
                                    fullWidth
                                    required
                                    label="S3 Region"
                                    value={field.value ? field.value : ''}
                                    onChange={(value) => field.onChange(value)}
                                ></TextField>
                            );
                        }}
                    />
                </StyledKeyValue>

                <StyledKeyValue>
                    <Controller
                        name={'S3_ACCESS_KEY'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;
                            return (
                                <TextField
                                    fullWidth
                                    required
                                    label="S3 Access Key"
                                    value={field.value ? field.value : ''}
                                    onChange={(value) => field.onChange(value)}
                                ></TextField>
                            );
                        }}
                    />
                </StyledKeyValue>

                <StyledKeyValue>
                    <Controller
                        name={'S3_SECRET_KEY'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;
                            return (
                                <TextField
                                    fullWidth
                                    required
                                    label="S3 Secret Key"
                                    value={field.value ? field.value : ''}
                                    onChange={(value) => field.onChange(value)}
                                ></TextField>
                            );
                        }}
                    />
                </StyledKeyValue>

                <StyledKeyValue>
                    <Controller
                        name={'S3_ENDPOINT'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;
                            return (
                                <TextField
                                    fullWidth
                                    required
                                    label="S3 Endpoint"
                                    value={field.value ? field.value : ''}
                                    onChange={(value) => field.onChange(value)}
                                ></TextField>
                            );
                        }}
                    />
                </StyledKeyValue>
                {fields.map((property, i) => {
                    return (
                        <StyledProperty key={i}>
                            <StyledFlexEnd>
                                <IconButton
                                    onClick={() => {
                                        remove(i);
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                            </StyledFlexEnd>
                            <StyledKeyValue>
                                <Controller
                                    name={`SMSS_PROPERTIES.${i}.KEY`}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field, fieldState }) => {
                                        const hasError = fieldState.error;
                                        return (
                                            <TextField
                                                fullWidth
                                                required
                                                label="Key"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                            ></TextField>
                                        );
                                    }}
                                />
                                <Controller
                                    name={`SMSS_PROPERTIES.${i}.VALUE`}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field, fieldState }) => {
                                        const hasError = fieldState.error;
                                        return (
                                            <TextField
                                                fullWidth
                                                required
                                                label="Value"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                            ></TextField>
                                        );
                                    }}
                                />
                            </StyledKeyValue>
                        </StyledProperty>
                    );
                })}
                <StyledFlexEnd>
                    <Button
                        variant={'contained'}
                        onClick={() => {
                            append({
                                KEY: '',
                                VALUE: '',
                            });
                        }}
                    >
                        Add Property
                    </Button>
                    <Button type="submit" variant={'contained'}>
                        Add Model
                    </Button>
                </StyledFlexEnd>
            </Stack>
        </form>
    );
};
