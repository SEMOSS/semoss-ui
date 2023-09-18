import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ImportFormComponent } from './formTypes';
import {
    Button,
    Collapse,
    IconButton,
    TextField,
    Typography,
    Stack,
} from '@semoss/ui';
import { useImport } from '@/hooks';

export const DataStaxForm: ImportFormComponent = () => {
    const { steps, setSteps } = useImport();

    const { control, handleSubmit } = useForm();

    const onSubmit = async (data) => {
        const conDetails = {
            dbDriver: data.dbDriver,
            additional: data.additional,
            hostname: data.hostname,
            port: data.port,
            httpPath: data.httpPath,
            UID: data.UID,
            PWD: data.PWD,
            database: data.database,
            schema: data.schema,
            CONNECTION_URL: data.CONNECTION_URL,
        };

        setSteps(
            [
                ...steps,
                {
                    title: data.DATABASE_NAME,
                    description:
                        'View and edit the relationships of the selected tables from the external connection that was made.',
                    data: conDetails,
                },
            ],
            steps.length + 1,
        );
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
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
                                type="password"
                                label="Password"
                                value={field.value ? field.value : ''}
                                onChange={(value) => field.onChange(value)}
                            ></TextField>
                        );
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'flex-end',
                    }}
                >
                    <Button variant="contained" disabled={true} type={'submit'}>
                        Connect
                    </Button>
                </div>
            </Stack>
        </form>
    );
};

DataStaxForm.name2 = 'DataStax';

DataStaxForm.logo = 'path_to_logo';
