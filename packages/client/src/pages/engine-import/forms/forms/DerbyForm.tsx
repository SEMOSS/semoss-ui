import React, { useState } from 'react';
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
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useImport } from '@/hooks';

export const DerbyForm: ImportFormComponent = () => {
    const { steps, setSteps } = useImport();
    const [openSettings, setOpenSettings] = useState(false);

    const { control, reset, handleSubmit } = useForm<{
        dbDriver: string;
        hostname: string;
        port: string;
        schema: string;
        additional: string;

        USERNAME: string;
        PASSWORD: string;

        DATABASE_NAME: string;
        DATABASE_DESCRIPTION: string;
        DATABASE_TAGS: string[];
        CONNECTION_URL: string;
        FETCH_SIZE: number;
        CONNECTION_TIMEOUT: number;
        CONNECTION_POOLING: number;
        POOL_MIN_SIZE: number;
        POOL_MAX_SIZE: number;
    }>({
        defaultValues: {
            dbDriver: 'DERBY',
            port: '1527',
        },
    });

    const onSubmit = async (data) => {
        const conDetails = {
            dbDriver: data.dbDriver,
            additional: data.additional,
            hostname: data.hostname,
            port: data.port,
            schema: data.schema,
            USERNAME: data.USERNAME,
            PASSWORD: data.PASSWORD,
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
                    name={'hostname'}
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
                    name={'port'}
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
                    name={'schema'}
                    control={control}
                    rules={{ required: false }}
                    render={({ field, fieldState }) => {
                        const hasError = fieldState.error;
                        return (
                            <TextField
                                fullWidth
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
                    name={'additional'}
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
                    name={'CONNECTION_URL'}
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
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography variant={'body1'}>ADVANCED SETTINGS</Typography>
                    <IconButton onClick={() => setOpenSettings(!openSettings)}>
                        {openSettings ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </div>
                <Collapse in={openSettings}>
                    <Stack rowGap={2}>
                        <Controller
                            name={'FETCH_SIZE'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Fetch Size"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'CONNECTION_TIMEOUT'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Connection Timeout"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'CONNECTION_POOLING'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Connection Pooling"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'POOL_MIN_SIZE'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Pool Minimum Size"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                        <Controller
                            name={'POOL_MAX_SIZE'}
                            control={control}
                            rules={{ required: false }}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error;
                                return (
                                    <TextField
                                        fullWidth
                                        label="Pool Maximum Size"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    ></TextField>
                                );
                            }}
                        />
                    </Stack>
                </Collapse>
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'flex-end',
                    }}
                >
                    <Button variant="contained" type={'submit'}>
                        Connect
                    </Button>
                </div>
            </Stack>
        </form>
    );
};

DerbyForm.name2 = 'Derby';

DerbyForm.logo = 'path_to_logo';
