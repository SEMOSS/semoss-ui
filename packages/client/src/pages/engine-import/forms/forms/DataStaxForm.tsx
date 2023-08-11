import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, TextField, Stack } from '@semoss/ui';
import { ImportFormComponent } from './formTypes';

export const DataStaxForm: ImportFormComponent = () => {
    const { control } = useForm();

    return (
        <form>
            <Stack rowGap={2}>
                <Controller
                    name={'DATABASE_NAME'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
                                label="Database Name"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'DATABASE_DESCRIPTION'}
                    control={control}
                    rules={{ required: false }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                label="Database Description"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'DATABASE_TAGS'}
                    control={control}
                    rules={{ required: false }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                label="Database Tags"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'HOST_NAME'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                required
                                fullWidth
                                label="Host Name"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'PORT'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                required
                                fullWidth
                                label="Port"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'GRAPH'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                required
                                fullWidth
                                label="Enter Graph"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'USERNAME'}
                    control={control}
                    rules={{ required: false }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                label="Username"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'PASSWORD'}
                    control={control}
                    rules={{ required: false }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                label="Password"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
            </Stack>
        </form>
    );
};

DataStaxForm.name2 = 'DataStax';

DataStaxForm.logo = 'path_to_logo';
