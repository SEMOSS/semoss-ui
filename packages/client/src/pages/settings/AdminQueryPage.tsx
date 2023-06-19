import { useEffect, useState } from 'react';

import {
    theme,
    Button,
    styled,
    Form,
    Table,
    Alert,
    useNotification,
    Scroll,
} from '@semoss/components';

import { useRootStore } from '@/hooks';

import { useForm } from 'react-hook-form';
import { Field } from '../../components/form';

const StyledContainer = styled('div', {
    margin: '0 auto',
    paddingLeft: theme.space[8],
    paddingRight: theme.space[8],
    paddingBottom: theme.space[8],
    '@sm': {
        maxWidth: '640px',
    },
    '@md': {
        maxWidth: '768px',
    },
    '@lg': {
        maxWidth: '1024px',
    },
    '@xl': {
        maxWidth: '1280px',
    },
    '@xxl': {
        maxWidth: '1536px',
    },
});

const StyledDescription = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.md,
    width: theme.space['full'],
    marginBottom: theme.space['6'],
    maxWidth: '50%',
});

const StyledAdminQuery = styled('div', {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: theme.space['16'],
});

const StyledLeft = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    width: '40%',
});

const StyledMarginedFields = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.space['4'],
});

const StyledRight = styled('div', {
    minHeight: '50%',
    minWidth: '60%',
});

const StyledRow = styled(Table.Row, {
    height: 'calc( 1.75em + 0.25em + 1px)',
});

const StyledCell = styled(Table.Cell, {
    minWidth: '15em',
    padding: '0.125em 0.5em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const StyledAlertDiv = styled('div', {
    minWidth: '100%',
});

const DATABASE_OPTIONS = [
    'LocalMasterDatabase',
    'security',
    'scheduler',
    'themes',
    'UserTrackingDatabase',
];

export const AdminQueryPage = () => {
    const { monolithStore } = useRootStore();
    const notification = useNotification();

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
    const submitQuery = handleSubmit((data) => {
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
                        content: output,
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
                    content: 'Successfully submitted query',
                });
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
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
            return (
                <Alert color={'success'} closeable={false}>
                    Successful query!
                </Alert>
            );
        } else if (output.type === 'error') {
            return (
                <StyledAlertDiv>
                    <Alert color={'error'} closeable={false}>
                        {output.value}
                    </Alert>
                </StyledAlertDiv>
            );
        } else if (output.type === 'table') {
            return (
                <Table>
                    <Table.Head>
                        <StyledRow>
                            {output.value.headers.map((header, index) => {
                                return (
                                    <StyledCell key={index}>
                                        {header}
                                    </StyledCell>
                                );
                            })}
                        </StyledRow>
                    </Table.Head>
                    <Table.Body>
                        {output.value.values.map((row, index) => {
                            return (
                                <StyledRow key={index}>
                                    {row.map((column, i) => {
                                        return (
                                            <StyledCell key={i}>
                                                {column}
                                            </StyledCell>
                                        );
                                    })}
                                </StyledRow>
                            );
                        })}
                    </Table.Body>
                </Table>
            );
        }
    };

    return (
        <StyledContainer>
            <StyledDescription>
                Query on Semoss based databases
            </StyledDescription>
            <StyledAdminQuery>
                <StyledLeft>
                    <Form>
                        <StyledMarginedFields>
                            <Field
                                label="Database"
                                name={'SELECTED_DATABASE'}
                                control={control}
                                rules={{ required: true }}
                                options={{
                                    component: 'select',
                                    options: DATABASE_OPTIONS,
                                    placeholder: 'Select...',
                                }}
                                error="You must select a database in order to query on."
                                description=""
                            ></Field>
                            <Field
                                label="Query"
                                name={'QUERY'}
                                control={control}
                                rules={{ required: true }}
                                options={{
                                    component: 'textarea',
                                    placeholder:
                                        'Enter query to run on database.',
                                    size: 'lg',
                                }}
                                error="Query is required"
                                description="Query will be executed on selected admin level database."
                            ></Field>
                            {showRowsField && (
                                <Field
                                    label="Max # Rows to Collect"
                                    name={'ROWS'}
                                    control={control}
                                    rules={{ min: 1 }}
                                    options={{
                                        component: 'numberpicker',
                                    }}
                                    description=""
                                ></Field>
                            )}
                            <Button
                                variant={!disableButton ? 'outline' : 'filled'}
                                onClick={() => submitQuery()}
                                disabled={!disableButton}
                            >
                                Execute Query
                            </Button>
                        </StyledMarginedFields>
                    </Form>
                </StyledLeft>
                <Scroll>
                    <StyledRight>
                        {!output.type
                            ? 'Execute a query to display the results here.'
                            : displayQueryOutput()}
                    </StyledRight>
                </Scroll>
            </StyledAdminQuery>
        </StyledContainer>
    );
};
