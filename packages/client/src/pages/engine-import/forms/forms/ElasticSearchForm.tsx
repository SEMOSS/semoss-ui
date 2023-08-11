import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, TextField, Stack } from '@semoss/ui';
import { ImportFormComponent } from './formTypes';

export const ElasticSearchForm: ImportFormComponent = () => {
    const { control, reset } = useForm();

    React.useEffect(() => {
        reset({
            PORT: '9200',
            HTTP_TYPE: 'https',
        });
    }, []);

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
                                required
                                fullWidth
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
                    rules={{ required: false }}
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
                    rules={{ required: false }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                label="Port"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <Controller
                    name={'HTTP_TYPE'}
                    control={control}
                    rules={{ required: false }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                label="HTTP_TYPE"
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
                <Controller
                    name={'ADDITIONAL_PARAMETERS'}
                    control={control}
                    rules={{ required: false }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
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
                    rules={{ required: false }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
                                label="JDBC Url"
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

ElasticSearchForm.name2 = 'Elastic Search';

ElasticSearchForm.logo = 'path_to_logo';
