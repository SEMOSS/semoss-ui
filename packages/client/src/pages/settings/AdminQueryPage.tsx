import { useEffect, useState } from 'react';

import {
    styled,
    useNotification,
    Alert,
    Button,
    Table,
    TextField,
    Select,
    Stack,
    TextArea,
} from '@/component-library';

import { useRootStore, useSettings } from '@/hooks';

import { Controller, useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';

const StyledContainer = styled('div')(() => ({
    display: 'flex',
    width: '100%',
    gap: '24px',
}));

const StyledLeft = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    width: '40%',
}));

const StyledRight = styled('div')(() => ({
    flex: '1',
}));

const DATABASE_OPTIONS = [
    'LocalMasterDatabase',
    'security',
    'scheduler',
    'themes',
    'UserTrackingDatabase',
];

interface TypeDbQuery {
    SELECTED_DATABASE: string;
    QUERY: string;
    ROWS: number;
}

export const AdminQueryPage = () => {
    const { monolithStore } = useRootStore();
    const { adminMode } = useSettings();
    const notification = useNotification();

    if (!adminMode) {
        return <Navigate to={'/settings'} />;
    }
    const [output, setOutput] = useState<{
        type: string;
        value: any;
    }>({
        type: '',
        value: '',
    });

    const [showRowsField, setShowRowsField] = useState(false);

    const { control, watch, setValue, handleSubmit } = useForm<{
        SELECTED_DATABASE: string;
        QUERY: string;
        ROWS: number;
    }>({
        defaultValues: {
            SELECTED_DATABASE: '',
            QUERY: '',
            ROWS: 100,
        },
    });

    const query = watch('QUERY');
    const selectedDatabase = watch('SELECTED_DATABASE');

    const disableButton = query && selectedDatabase ? true : false;

    useEffect(() => {
        verifySelectQuery();
    }, [query]);

    /**
     * @name verifySelectQuery
     * @desc check whether the query contains SELECT,
     * and if so update the ROWS field and show or hide field
     */
    function verifySelectQuery() {
        if (query.toUpperCase().startsWith('SELECT')) {
            // show rows field
            setShowRowsField(true);
        } else {
            if (showRowsField) {
                // don't show rows field
                setShowRowsField(false);
                setValue('ROWS', 0);
            }
        }
    }

    /**
     * @name submitQuery
     * @desc make runQuery API call based on submitted fields
     */
    const submitQuery = handleSubmit((data: TypeDbQuery) => {
        let pixelString = `META | AdminDatabase("${data.SELECTED_DATABASE}") | Query("<encode>${data.QUERY}</encode>")`;

        if (showRowsField) {
            pixelString += `| Collect(${data.ROWS});`;
        } else {
            // No collect
            pixelString += '| AdminExecQuery();';
        }

        monolithStore
            .runQuery(pixelString)
            .then((response) => {
                let output = undefined;
                let type = undefined;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    setOutput({
                        type: 'error',
                        value: output,
                    });
                    notification.add({
                        color: 'error',
                        message: output,
                    });

                    return;
                }

                // if we have a select query returning data
                else if (output instanceof Object) {
                    setOutput({
                        type: 'table',
                        value: {
                            headers: output.data.headers,
                            values: output.data.values,
                        },
                    });
                }

                // if we have a non-select query
                else {
                    setOutput({
                        type: 'success',
                        value: '',
                    });
                }

                notification.add({
                    color: 'success',
                    message: 'Successfully submitted query',
                });
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error,
                });
            });
    });

    /**
     * @name displayQueryOutput
     * @desc return alert or table based on the queryOutputType
     * @returns JSX.Element
     */
    const displayQueryOutput = (): JSX.Element => {
        if (output.type === 'success') {
            return <Alert color={'success'}>Successful query!</Alert>;
        } else if (output.type === 'error') {
            return <Alert color={'error'}>{output.value}</Alert>;
        } else if (output.type === 'table') {
            return (
                <Table>
                    <Table.Head>
                        <Table.Row>
                            {output.value.headers.map((header, index) => {
                                return (
                                    <Table.Cell key={index}>
                                        {header}
                                    </Table.Cell>
                                );
                            })}
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {output.value.values.map((row, index) => {
                            return (
                                <Table.Row key={index}>
                                    {row.map((column, i) => {
                                        return (
                                            <Table.Cell key={i}>
                                                {column}
                                            </Table.Cell>
                                        );
                                    })}
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table>
            );
        }
    };

    return (
        <StyledContainer>
            <StyledLeft>
                <form>
                    <Stack spacing={2}>
                        <Controller
                            name={'SELECTED_DATABASE'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                                return (
                                    <Select
                                        label="Database"
                                        value={field.value ? field.value : ''}
                                        onChange={(e) =>
                                            field.onChange(e.target.value)
                                        }
                                    >
                                        {DATABASE_OPTIONS.map((option, i) => {
                                            return (
                                                <Select.Item
                                                    value={option}
                                                    key={i}
                                                >
                                                    {option}
                                                </Select.Item>
                                            );
                                        })}
                                    </Select>
                                );
                            }}
                        />

                        <Controller
                            name={'QUERY'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                                return (
                                    <TextArea
                                        label="Enter query to run on database"
                                        value={field.value ? field.value : ''}
                                        onChange={(e) =>
                                            field.onChange(e.target.value)
                                        }
                                        minRows={4}
                                        maxRows={12}
                                    ></TextArea>
                                );
                            }}
                        />
                        {showRowsField && (
                            <Controller
                                name={'ROWS'}
                                control={control}
                                rules={{ min: 1 }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            label="Max # Rows to Collect"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
                                            }
                                            type={'number'}
                                        ></TextField>
                                    );
                                }}
                            />
                        )}
                        <Button
                            variant={'contained'}
                            onClick={() => submitQuery()}
                            disabled={!disableButton}
                        >
                            Execute Query
                        </Button>
                    </Stack>
                </form>
            </StyledLeft>
            <StyledRight>
                {!output.type
                    ? 'Execute a query to display the results here.'
                    : displayQueryOutput()}
            </StyledRight>
        </StyledContainer>
    );
};
