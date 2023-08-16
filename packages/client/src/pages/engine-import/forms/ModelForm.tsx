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

export const ModelForm = () => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            SMSS_PROPERTIES: [],
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
                {fields.map((property, i) => {
                    return (
                        <StyledProperty key={i}>
                            <StyledFlexEnd>
                                <IconButton
                                    disabled={fields.length < 2}
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
                        Add Storage
                    </Button>
                </StyledFlexEnd>
            </Stack>
        </form>
    );
};
