import React from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { Button, Grid, IconButton, TextField, Stack, styled } from '@semoss/ui';
import { Delete } from '@mui/icons-material';

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

export const StorageForm = () => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            NAME: '',
            STORAGE_NAME: '',
            S3_REGION: '',
            S3_ACCESS_KEY: '',
            S3_SECRET_KEY: '',
            S3_ENDPOINT: '',
            SMSS_PROPERTIES: [
                {
                    KEY: '',
                    VALUE: '',
                },
            ],
        },
    });

    const { fields, remove, append } = useFieldArray({
        control,
        name: 'SMSS_PROPERTIES',
    });

    const onSubmit = async (data) => {
        // Format the JSON to send back to submission in parent
        const smssProperties = {};
        data.SMSS_PROPERTIES.forEach((obj) => {
            smssProperties[obj.KEY] = obj.VALUE;
        });

        console.log(smssProperties);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack rowGap={2}>
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
                        name={'STORAGE_NAME'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field, fieldState }) => {
                            const hasError = fieldState.error;
                            return (
                                <TextField
                                    fullWidth
                                    required
                                    label="Storage Name"
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
                                    rules={{}}
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
                                    rules={{}}
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
                        Add Storage
                    </Button>
                </StyledFlexEnd>
            </Stack>
        </form>
    );
};
