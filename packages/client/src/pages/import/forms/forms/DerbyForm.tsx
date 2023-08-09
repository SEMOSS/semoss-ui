import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Form } from '@semoss/components';
import { Button, TextField, Stack } from '@semoss/ui';
import { ImportFormComponent } from './formTypes';

export const DerbyForm: ImportFormComponent = () => {
    const { control, reset } = useForm();

    React.useEffect(() => {
        reset({
            PORT: '1527',
        });
    }, []);

    return (
        <Form>
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
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
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
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
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
                                fullWidth
                                required
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
                                fullWidth
                                required
                                label="Port"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'SCHEMA'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
                                label="Schema"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'USERNAME'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
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
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
                                label="Password"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'ADDITIONAL_PARAMETERS'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
                                label="Additional Parameters"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'JDBC_URL'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
                                label="JDBC Url"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                ADVANCED SETTINGS
                <Controller
                    name={'FETCH_SIZE'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
                                label="Fetch Size"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'CONNECTION_TIMEOUT'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
                                label="Connection Timeout"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'CONNECTION_POOLING'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
                                label="Connection Pooling"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'POOL_MIN_SIZE'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
                                label="Pool Minimum Size"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'POOL_MAX_SIZE'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                required
                                label="Pool Maximum Size"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
            </Stack>
        </Form>
    );
};

DerbyForm.name2 = 'Derby';

DerbyForm.logo = 'path_to_logo';
