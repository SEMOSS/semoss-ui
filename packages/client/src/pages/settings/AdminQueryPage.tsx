import { useEffect, useReducer, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
    styled,
    useNotification,
    Accordion,
    Alert,
    Button,
    Divider,
    Table,
    TextField,
    Select,
    Stack,
    TextArea,
    Typography,
} from '@semoss/ui';

import { usePixel, useRootStore } from '@/hooks';
import { useNavigate, useLocation } from 'react-router-dom';

import { Controller, useForm } from 'react-hook-form';

const StyledContainer = styled('div')(() => ({
    display: 'flex',
    width: '100%',
    gap: '24px',
    flexDirection: 'column',
}));

const StyledLeft = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    width: '40%',
}));

const StyledRight = styled('div')(() => ({
    flex: '1',
}));

const StyledPropContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    marginBottom: theme.spacing(2),
    padding: '24px',
    borderRadius: '15px',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    boxShadow: '0px 5px 5px rgba(0, 0, 0, 0.03)',
}));

const StyledTitle = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(2),
    display: 'flex',
}));

const StyledActionButtonsDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    gap: '.5rem',
}));

const StyledButton = styled(Button)({
    textTransform: 'none',
    fontWeight: 'bold',
});

const StyledSelect = styled(Select)({
    width: '25%',
});

const StyledAccordion = styled(Accordion)({
    zIndex: 1,
});

interface TypeDbQuery {
    SELECTED_DATABASE: string;
    QUERY: string;
    ROWS: number;
}

const initialState = {
    databases: [],
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'field': {
            return {
                ...state,
                [action.field]: action.value,
            };
        }
    }
    return state;
};

const LANGUAGES = {
    sql: {
        name: 'SQL',
    },
    r: {
        name: 'R',
    },
    python: {
        name: 'Python',
    },
};

export const AdminQueryPage = () => {
    const { configStore, monolithStore } = useRootStore();
    const notification = useNotification();
    const { search: catalogParams } = useLocation();
    const [expanded, setExpanded] = useState(false);

    // get a list of the keys
    const databaseMetaKeys = configStore.store.config.databaseMetaKeys.filter(
        (k) => {
            return (
                k.display_options === 'single-checklist' ||
                k.display_options === 'multi-checklist' ||
                k.display_options === 'single-select' ||
                k.display_options === 'multi-select' ||
                k.display_options === 'single-typeahead' ||
                k.display_options === 'multi-typeahead'
            );
        },
    );

    // get metakeys to the ones we want
    const metaKeys = databaseMetaKeys.map((k) => {
        return k.metakey;
    });

    const [state, dispatch] = useReducer(reducer, initialState);
    const { databases } = state;

    const [offset, setOffset] = useState(0);
    const [canCollect, setCanCollect] = useState(true);
    const canCollectRef = useRef(true);
    canCollectRef.current = canCollect;
    const limit = 6;

    const offsetRef = useRef(0);
    offsetRef.current = offset;

    // save the search string
    const [search, setSearch] = useState<string>('');

    const [mode, setMode] = useState<string>('My Databases');
    const [view, setView] = useState<'list' | 'tile'>('tile');
    const [filterByVisibility, setFilterByVisibility] = useState(true);

    const dbPixelPrefix: string = `MyEngines`;

    // track which filters are opened their selected value, and search term
    const [filterVisibility, setFilterVisibility] = useState<
        Record<string, { open: boolean; value: string[]; search: string }>
    >(() => {
        return databaseMetaKeys.reduce((prev, current) => {
            prev[current.metakey] = {
                open: false,
                value: [],
                search: '',
            };

            return prev;
        }, {});
    });

    const [filterValues, setFilterValues] = useState<
        Record<string, string[] | string | null>
    >(() => {
        return databaseMetaKeys.reduce((prev, current) => {
            const multiple =
                current.display_options === 'multi-checklist' ||
                current.display_options === 'multi-select' ||
                current.display_options === 'multi-typeahead';

            prev[current.metakey] = multiple ? [] : null;

            return prev;
        }, {});
    });

    // construct filters to send to metafilters
    const metaFilters = {};
    for (const key in filterValues) {
        const filter = filterValues[key];
        const filterVal = filterVisibility[key].value;
        if (filter && filterVal.length > 0) {
            metaFilters[key] = filterVal;
        }
    }

    const metaKeysDescription = [...metaKeys, 'description'];

    const getDatabases = usePixel<
        {
            app_cost: string;
            app_id: string;
            app_name: string;
            app_type: string;
            database_cost: string;
            database_global: boolean;
            database_id: string;
            database_name: string;
            database_type: string;
            database_created_by: string;
            database_date_created: string;
            description: string;
            low_database_name: string;
            permission: number;
            tag: string;
            user_permission: number;
            upvotes: number;
        }[]
    >(
        `${dbPixelPrefix}( metaKeys = ${JSON.stringify(
            metaKeysDescription,
        )} , metaFilters = [ ${JSON.stringify(
            metaFilters,
        )} ] , filterWord=["${search}"], userT = [true], engineTypes=['DATABASE'], offset=[${offset}], limit=[${limit}]) ;`,
    );

    useEffect(() => {
        if (getDatabases.status !== 'SUCCESS') {
            return;
        }

        if (getDatabases.data.length < limit) {
            setCanCollect(false);
        } else {
            if (!canCollectRef.current) {
                setCanCollect(true);
            }
        }

        const mutateListWithVotes = databases;

        getDatabases.data.forEach((db) => {
            mutateListWithVotes.push({
                ...db,
                upvotes: db.upvotes ? db.upvotes : 0,
                views: 'N/A',
                trending: 'N/A',
            });
        });

        dispatch({
            type: 'field',
            field: 'databases',
            value: mutateListWithVotes,
        });
    }, [getDatabases.status, getDatabases.data]);

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
            <StyledPropContainer>
                <StyledTitle>
                    <Select
                        onChange={() => setExpanded(!expanded)}
                        sx={{
                            width: '7%',
                            boxShadow: 'none',
                            '.MuiOutlinedInput-notchedOutline': { border: 0 },
                        }}
                        defaultValue={LANGUAGES['sql'].name}
                    >
                        {Object.keys(LANGUAGES).map((option, i) => {
                            return (
                                <Select.Item
                                    value={LANGUAGES[option].name}
                                    key={i}
                                >
                                    {LANGUAGES[option].name}
                                </Select.Item>
                            );
                        })}
                    </Select>
                    <Controller
                        name={'SELECTED_DATABASE'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => {
                            return (
                                <StyledSelect
                                    label="Database"
                                    value={field.value ? field.value : ''}
                                    onChange={(e) =>
                                        field.onChange(e.target.value)
                                    }
                                >
                                    {databases.map((option, i) => {
                                        return (
                                            <Select.Item
                                                value={option.database_name}
                                                key={i}
                                            >
                                                {option.database_name}
                                            </Select.Item>
                                        );
                                    })}
                                </StyledSelect>
                            );
                        }}
                    />
                    <StyledActionButtonsDiv>
                        <StyledButton variant="outlined">Reset</StyledButton>
                        <StyledButton variant="contained">Save</StyledButton>
                    </StyledActionButtonsDiv>
                </StyledTitle>
                <Divider sx={{ marginBottom: '8px' }} />
                <Editor height="60vh" defaultLanguage="javascript" />
            </StyledPropContainer>
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
                                        {databases.map((option, i) => {
                                            return (
                                                <Select.Item
                                                    value={option.database_name}
                                                    key={i}
                                                >
                                                    {option.database_name}
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
