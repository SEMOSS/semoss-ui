import { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import {
    styled,
    Button,
    Divider,
    Menu,
    MenuProps,
    Stack,
    Typography,
    Modal,
    Select,
    Table,
    Checkbox,
    TextField,
    Grid,
    IconButton,
    Tooltip,
} from '@semoss/ui';

import { useBlocks, usePixel, useRootStore } from '@/hooks';
import {
    ActionMessages,
    CellStateConfig,
    NewCellAction,
    QueryState,
} from '@/stores';
import {
    AccountTree,
    Add,
    Functions,
    ChangeCircleOutlined,
    Storage,
    Code,
    ImportExport,
    TextFields,
    KeyboardArrowUp,
    KeyboardArrowDown,
    TableRows,
    Label,
    JoinLeftRounded,
    FilterListRounded,
    ControlPointDuplicateRounded,
    CheckBox,
    IndeterminateCheckBox,
    Close,
    JoinInner,
    ArrowDownwardRounded,
} from '@mui/icons-material';
import {
    DefaultCellDefinitions,
    DefaultCells,
    TransformationCells,
} from '@/components/cell-defaults';
import { QueryImportCellConfig } from '../cell-defaults/query-import-cell';
import { DataImportCellConfig } from '../cell-defaults/data-import-cell';
import { CodeCellConfig } from '../cell-defaults/code-cell';
import { useFieldArray, useForm, Form, Controller } from 'react-hook-form';

import { LoadingScreen } from '@/components/ui';

import { runPixel } from '@/api';

const StyledImportDataForm = styled('form')(({ theme }) => ({
    margin: '30px 41px',
}));

const StyledModalTitle = styled(Typography)(({ theme }) => ({
    alignContent: 'center',
    marginRight: '15px',
}));

const StyledModalTitleWrapper = styled(Modal.Title)(({ theme }) => ({
    display: 'flex',
    alignContent: 'center',
    padding: '0px',
    marginBottom: '15px',
    justifyContent: 'space-between',
}));

const StyledModalTitleWrapper2 = styled(Modal.Title)(({ theme }) => ({
    display: 'flex',
    alignContent: 'center',
    padding: '0px',
    justifyContent: 'space-between',
}));

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    backgroundColor: 'unset!important',
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
    flexGrow: 1,
}));

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        marginTop: theme.spacing(1),
    },
    '.MuiList-root': {
        padding: 0,
    },
}));

const StyledMenuItem = styled(Menu.Item)(() => ({
    textTransform: 'capitalize',
}));

const StyledBorderDiv = styled('div')(({ theme }) => ({
    border: `1px solid ${theme.palette.secondary.main}`,
    padding: '8px 16px',
    borderRadius: '8px',
}));

interface Column {
    id: string;
    tableName: string;
    columnName: string;
    columnType: string;
    userAlias: string;
    checked: boolean;
}

interface AddCellOption {
    display: string;
    icon: React.ReactNode;
    defaultCellType?: DefaultCellDefinitions['widget'];
    options?: {
        display: string;
        defaultCellType: DefaultCellDefinitions['widget'];
    }[];
    disabled?: boolean;
}

type QueryChildElement = {
    childElementName: string;
};

type QueryStackElement = {
    queryType: string; // Data, Join or Filter
    queryChildren: QueryChildElement[];
};

type FormValues = {
    queryStackElements: QueryStackElement[];
    databaseSelect: string;
    tableSelect: string;
    columns: Column[];
};

const Transformations = Array.from(Object.values(TransformationCells)).map(
    (item) => {
        return {
            display: item.name,
            defaultCellType: item.widget,
        };
    },
);

const DataImportDropdownOptions = [
    {
        display: `From Data Catalog`,
        defaultCellType: null,
    },
    {
        display: `From CSV`,
        defaultCellType: null,
    },
];

const AddCellOptions: Record<string, AddCellOption> = {
    code: {
        display: 'Cell',
        defaultCellType: 'code',
        icon: <Code />,
    },
    'query-import': {
        display: 'Query Import',
        defaultCellType: 'query-import',
        // no DB MUI icon using the icon path from main menu
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
            >
                <g clipPath="url(#clip0_2378_103062)">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 3C7.58 3 4 4.79 4 7V17C4 19.21 7.59 21 12 21C16.41 21 20 19.21 20 17V7C20 4.79 16.42 3 12 3ZM18 17C18 17.5 15.87 19 12 19C8.13 19 6 17.5 6 17V14.77C7.61 15.55 9.72 16 12 16C14.28 16 16.39 15.55 18 14.77V17ZM18 12.45C16.7 13.4 14.42 14 12 14C9.58 14 7.3 13.4 6 12.45V9.64C7.47 10.47 9.61 11 12 11C14.39 11 16.53 10.47 18 9.64V12.45ZM12 9C8.13 9 6 7.5 6 7C6 6.5 8.13 5 12 5C15.87 5 18 6.5 18 7C18 7.5 15.87 9 12 9Z"
                        fill="#666666"
                    ></path>
                </g>
                <defs>
                    <clipPath id="clip0_2378_103062">
                        <rect width="24" height="24" fill="#666666"></rect>
                    </clipPath>
                </defs>
            </svg>
        ),
    },
    transformation: {
        display: 'Transformation',
        icon: <ChangeCircleOutlined />,
        options: Transformations,
    },
    'import-data': {
        display: 'Import Data',
        icon: <ImportExport />,
        options: DataImportDropdownOptions,
        disabled: false,
    },
    text: {
        display: 'Text',
        // defaultCellType: 'text', // text type currently doesn't exist
        icon: <TextFields />,
        disabled: true,
    },
};

const IMPORT_MODAL_WIDTHS = {
    // small: '500px',
    // medium: '750px',
    small: '1150px',
    medium: '1150px',
    large: '1150px',
};

const SQL_COLUMN_TYPES = [
    'DATE',
    'NUMBER',
    'STRING',
    'TIMESTAMP',
    // there may be more to add need a definitive list
];

export const NotebookAddCell = observer(
    (props: { query: QueryState; previousCellId?: string }): JSX.Element => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const [selectedAddCell, setSelectedAddCell] = useState<string>('');

        const [importModalType, setImportModalType] = useState<string>('');
        const [isDataImportModalOpen, setIsDataImportModalOpen] =
            useState<boolean>(false);
        const open = Boolean(anchorEl);

        const { query, previousCellId = '' } = props;
        const { state, notebook } = useBlocks();

        const { control, handleSubmit, reset, watch, setValue, getValues } =
            useForm<FormValues>({
                defaultValues: {
                    queryStackElements: [],
                    databaseSelect: '',
                    tableSelect: '',
                },
            });

        const [userDatabases, setUserDatabases] = useState(null);
        const [queryElementCounter, setQueryElementCounter] = useState(0);

        const [databaseTableHeaders, setDatabaseTableHeaders] = useState([]);
        const [databaseTableRawHeaders, setDatabaseTableRawHeaders] = useState(
            [],
        );
        const [tableNames, setTableNames] = useState<string[]>([]);
        const [databaseTableRows, setDatabaseTableRows] = useState([]);

        const [tableColumnsObject, setTableColumnsObject] = useState({});

        const [selectedDatabaseId, setSelectedDatabaseId] = useState(null);
        const [selectedTable, setSelectedTable] = useState(null);
        const [hiddenColumnIdsSet, setHiddenColumnIdsSet] = useState(new Set());
        const [importModalPixelWidth, setImportModalPixelWidth] =
            useState<string>(IMPORT_MODAL_WIDTHS.small);

        const importDataSQLStringRef = useRef<string>('');

        const getDatabases = usePixel('META | GetDatabaseList ( ) ;'); // making repeat network calls, move to load data modal open
        const [isDatabaseLoading, setIsDatabaseLoading] =
            useState<boolean>(false);
        const [showEditColumns, setShowEditColumns] = useState<boolean>(false);
        const [showTablePreview, setShowTablePreview] =
            useState<boolean>(false);
        const [checkAllColumns, setCheckAllColumns] = useState<boolean>(true);
        const { configStore, monolithStore } = useRootStore();

        // temp state vars move to useForm asap if possible
        const [selectedLeftTable, setSelectedLeftTable] =
            useState<string>(null);
        const [selectedRightTable, setSelectedRightTable] =
            useState<string>(null);
        const [selectedLeftKey, setSelectedLeftKey] = useState<string>(null);
        const [selectedRightKey, setSelectedRightKey] = useState<string>(null);

        const [tableEdgesObject, setTableEdgesObject] = useState(null);
        const [columnDataTypesDict, setColumnDataTypesDict] = useState(null);

        const {
            fields: stackFields,
            append: appendStack,
            remove: removeStack,
        } = useFieldArray({
            control,
            name: 'queryStackElements',
        });

        const {
            fields: editableColumnFields,
            append: appendEditableColumns,
            remove: removeEditableColumns,
        } = useFieldArray({
            control,
            name: 'columns',
        });

        useEffect(() => {
            setSelectedLeftKey(null);
            setSelectedRightKey(null);
            removeEditableColumns();
            removeStack();
        }, [selectedDatabaseId, selectedTable]);

        useEffect(() => {
            removeEditableColumns();
            removeStack();
        }, [selectedDatabaseId]);

        useEffect(() => {
            removeEditableColumns();
            tableColumnsObject[selectedTable]?.forEach((tableObject, idx) => {
                console.log({ tableObject });
                appendEditableColumns({
                    id: idx,
                    tableName: tableObject.tableName,
                    columnName: tableObject.columnName,
                    userAlias: tableObject.columnName,
                    columnType: tableObject.columnType,
                    checked: true,
                });
            });
        }, [selectedTable]);

        useEffect(() => {
            if (getDatabases.status !== 'SUCCESS') {
                return;
            }
            setUserDatabases(getDatabases.data);
        }, [getDatabases.status, getDatabases.data]);

        // const loadDatabaseStructure = () => {
        //     // set loading to true
        //     // fetch database structure
        // };

        // const cellTypeOptions = computed(() => {
        //     const options = { ...AddCellOptions };
        //     // transformation cell types can only be added if there exists a query-import cell before it
        //     if (!previousCellId) {
        //         delete options['transformation'];
        //     } else {
        //         const previousCellIndex = query.list.indexOf(previousCellId);
        //         let hasFrameVariable = false;
        //         for (let index = 0; index <= previousCellIndex; index++) {
        //             if (
        //                 query.cells[query.list[index]].config.widget ===
        //                 'query-import'
        //             ) {
        //                 hasFrameVariable = true;
        //                 break;
        //             }
        //         }
        //         if (!hasFrameVariable) {
        //             delete options['transformation'];
        //         }
        //     }

        //     return Object.values(options);
        // }).get();

        /**
         * Create a new cell
         */
        const appendCell = (widget: string) => {
            try {
                const newCellId = `${Math.floor(Math.random() * 100000)}`;

                const config: NewCellAction['payload']['config'] = {
                    widget: DefaultCells[widget].widget,
                    parameters: DefaultCells[widget].parameters,
                };

                if (widget === DataImportCellConfig.widget) {
                    config.parameters = {
                        ...DefaultCells[widget].parameters,
                        frameVariableName: `FRAME_${newCellId}`,
                        databaseId: selectedDatabaseId,
                        selectQuery: importDataSQLStringRef.current, // construct query based on useForm inputs
                    };
                }

                if (widget === QueryImportCellConfig.widget) {
                    config.parameters = {
                        ...DefaultCells[widget].parameters,
                        frameVariableName: `FRAME_${newCellId}`,
                    };
                }

                if (
                    previousCellId &&
                    state.queries[query.id].cells[previousCellId].widget ===
                        widget &&
                    widget === CodeCellConfig.widget
                ) {
                    const previousCellType =
                        state.queries[query.id].cells[previousCellId].parameters
                            ?.type ?? 'pixel';
                    config.parameters = {
                        ...DefaultCells[widget].parameters,
                        type: previousCellType,
                    };
                }

                // copy and add the step
                state.dispatch({
                    message: ActionMessages.NEW_CELL,
                    payload: {
                        queryId: query.id,
                        cellId: newCellId,
                        previousCellId: previousCellId,
                        config: config as Omit<CellStateConfig, 'id'>,
                    },
                });
                notebook.selectCell(query.id, newCellId);
            } catch (e) {
                console.error(e);
            }
        };

        const constructSQLString = ({ submitData }) => {
            console.log({ submitData });
            let newSQLString = 'SELECT ';

            newSQLString += submitData.columns
                .filter((ele) => ele.checked)
                .map((colObj) => {
                    if (colObj.columnName === colObj.userAlias) {
                        return colObj.columnName;
                    } else {
                        return `${colObj.columnName} AS \"${colObj.userAlias}\"`;
                    }
                })
                .join(', ');

            newSQLString += ` FROM ${submitData.tableSelect}`;
            newSQLString += ';';

            if (
                selectedLeftTable &&
                selectedRightTable &&
                selectedLeftKey &&
                selectedRightKey
            ) {
                newSQLString = `SELECT ${'*'} FROM ${selectedLeftTable} INNER JOIN ${selectedRightTable} ON ${selectedLeftTable}.${selectedLeftKey}=${selectedRightTable}.${selectedRightKey};`;
            }

            importDataSQLStringRef.current = newSQLString;
        };

        const constructDataBasePixel = ({ submitData }) => {
            // mimic this pixel structure instead of constructing raw SQL ?
            // or have join autoselect keys and add columns to edit
            // that makes sense with new pixel structure
            // show all tables and selectable rows in edit columns view
            // find way of showing alerts for un joinable columns
            // add form structure to json state (?)
            // make basic non SQL view for notebook cell
            // make edit window

            // "pixelExpression": "Database ( database = [ \"f9b656cc-06e7-4cce-bae8-b5f92075b6da\" ] ) |

            // Select (
            //     STATION_SETTINGS__ROLE ,
            //     USER_SETTINGS__DATE_CREATED ,
            //     VISN_SETTINGS__EMAIL ,
            //     VISN_SETTINGS__USER ,
            //     VISN_SETTINGS__VISN )
            // .as ( [
            //     ROLE ,
            //     DATE_CREATED ,
            //     EMAIL ,
            //     USER ,
            //     VISN
            // ] ) |

            // Join ( (
            //     USER_SETTINGS ,
            //     inner.join ,
            //     STATION_SETTINGS
            // ) , (
            //     USER_SETTINGS ,
            //     inner.join ,
            //     VISN_SETTINGS
            // ) ) |

            // Distinct ( false ) |

            // QueryRowCount ( ) ;",
            console.log({ submitData });
            let newSQLString = 'SELECT ';

            newSQLString += submitData.columns
                .filter((ele) => ele.checked)
                .map((colObj) => {
                    if (colObj.columnName === colObj.userAlias) {
                        return colObj.columnName;
                    } else {
                        return `${colObj.columnName} AS \"${colObj.userAlias}\"`;
                    }
                })
                .join(', ');

            newSQLString += ` FROM ${submitData.tableSelect}`;
            newSQLString += ';';

            if (
                selectedLeftTable &&
                selectedRightTable &&
                selectedLeftKey &&
                selectedRightKey
            ) {
                newSQLString = `SELECT ${'*'} FROM ${selectedLeftTable} INNER JOIN ${selectedRightTable} ON ${selectedLeftTable}.${selectedLeftKey}=${selectedRightTable}.${selectedRightKey};`;
            }

            importDataSQLStringRef.current = newSQLString;
        };

        const onImportDataSubmit = (submitData) => {
            constructSQLString({ submitData });
            appendCell('data-import');
            setIsDataImportModalOpen(false);
            closeImportModalHandler();
        };

        const closeImportModalHandler = () => {
            setImportModalPixelWidth(IMPORT_MODAL_WIDTHS.small);
            setHiddenColumnIdsSet(new Set());
            setIsDataImportModalOpen(false);
            setDatabaseTableHeaders([]);
            setSelectedDatabaseId(null);
            setShowTablePreview(false);
            setTableColumnsObject({});
            setDatabaseTableRows([]);
            setSelectedTable(null);
            setTableNames([]);
            reset();
        };

        const retrieveDatabaseTablesAndEdges = async (databaseId) => {
            setIsDatabaseLoading(true);
            const pixelString = `META|GetDatabaseTableStructure(database=[ \"${databaseId}\" ]);META|GetDatabaseMetamodel( database=[ \"${databaseId}\" ], options=["dataTypes","positions"]);`;

            // const pixelResponse = await runPixel(pixelString);
            monolithStore.runQuery(pixelString).then((pixelResponse) => {
                const responseTableStructure =
                    pixelResponse.pixelReturn[0].output;
                const isResponseTableStructureGood =
                    pixelResponse.pixelReturn[0].operationType.indexOf(
                        'ERROR',
                    ) === -1;

                const responseTableEdgesStructure =
                    pixelResponse.pixelReturn[1].output;
                const isResponseTableEdgesStructureGood =
                    pixelResponse.pixelReturn[1].operationType.indexOf(
                        'ERROR',
                    ) === -1;

                // populate database structure as before
                if (isResponseTableStructureGood) {
                    console.log({ responseTableStructure });
                    const tableNames = [
                        ...responseTableStructure.reduce((set, ele) => {
                            set.add(ele[0]);
                            return set;
                        }, new Set()),
                    ];

                    const newTableColumnsObject = responseTableStructure.reduce(
                        (acc, ele, idx) => {
                            const tableName = ele[0];
                            const columnName = ele[1];
                            const columnType = ele[2];
                            // other info seems to not be needed, unsure what flag is representing or if repeat names are aliases etc
                            const columnBoolean = ele[3];
                            const columnName2 = ele[4];
                            const tableName2 = ele[4];

                            if (!acc[tableName]) acc[tableName] = [];
                            acc[tableName].push({
                                tableName,
                                columnName,
                                columnType,
                                columnBoolean,
                                columnName2,
                                tableName2,
                                userAlias: columnName, // user editable in Edit Columns
                                checked: true,
                            });

                            return acc;
                        },
                        {},
                    );
                    setTableColumnsObject(newTableColumnsObject);
                    setTableNames(tableNames);
                } else {
                    console.error('Error retrieving database tables');
                }

                // make and populate new edges dict
                // ### NEED TO...
                // store columns used for join
                // these will get displayed in the Key1 and Key2

                if (isResponseTableEdgesStructureGood) {
                    const newEdgesDict =
                        responseTableEdgesStructure.edges.reduce((acc, ele) => {
                            const source = ele.source;
                            const target = ele.target;
                            const sourceColumn = ele.sourceColumn;
                            const targetColumn = ele.targetColumn;

                            if (!acc[source]) {
                                acc[source] = {
                                    [target]: {
                                        sourceColumn,
                                        targetColumn,
                                    },
                                };
                            } else {
                                acc[source][target] = {
                                    sourceColumn,
                                    targetColumn,
                                };
                            }

                            if (!acc[target]) {
                                acc[target] = {
                                    [source]: {
                                        sourceColumn: targetColumn,
                                        targetColumn: sourceColumn,
                                    },
                                };
                            } else {
                                acc[target][source] = {
                                    sourceColumn: targetColumn,
                                    targetColumn: sourceColumn,
                                };
                            }
                            return acc;
                        }, {});

                    setTableEdgesObject(newEdgesDict);
                } else {
                    console.error('Error retrieving database edges');
                }

                setIsDatabaseLoading(false);
            });
        };

        // const retrieveDatabaseTables = async (databaseId) => {
        //     setIsDatabaseLoading(true);
        //     const pixelString = `META | GetDatabaseTableStructure ( database = [ \"${databaseId}\" ] ) ;`;

        //     monolithStore.runQuery(pixelString).then((response) => {
        //         const type = response.pixelReturn[0].operationType;
        //         const pixelResponse = response.pixelReturn[0].output;

        //         if (type.indexOf('ERROR') === -1) {
        //             const tableNames = [
        //                 ...pixelResponse.reduce((set, ele) => {
        //                     set.add(ele[0]);
        //                     return set;
        //                 }, new Set()),
        //             ];

        //             const newTableColumnsObject = pixelResponse.reduce(
        //                 (acc, ele, idx) => {
        //                     const tableName = ele[0];
        //                     const columnName = ele[1];
        //                     const columnType = ele[2];
        //                     // other info seems to not be needed, unsure what flag is representing or if repeat names are aliases etc
        //                     const columnBoolean = ele[3];
        //                     const columnName2 = ele[4];
        //                     const tableName2 = ele[4];

        //                     if (!acc[tableName]) acc[tableName] = [];
        //                     acc[tableName].push({
        //                         tableName,
        //                         columnName,
        //                         columnType,
        //                         columnBoolean,
        //                         columnName2,
        //                         tableName2,
        //                         userAlias: columnName, // user editable in Edit Columns
        //                         checked: true,
        //                     });

        //                     return acc;
        //                 },
        //                 {},
        //             );

        //             setTableColumnsObject(newTableColumnsObject);
        //             setTableNames(tableNames);
        //         } else {
        //             console.error('Error retrieving database tables');
        //         }

        //         setIsDatabaseLoading(false);
        //     });
        // };

        const selectTableHandler = (tableName) => {
            setSelectedTable(tableName);
            retrieveTableRows(tableName);
        };

        const retrieveTableRows = async (tableName) => {
            setIsDatabaseLoading(true);
            const selectStringArray = tableColumnsObject[tableName].map(
                (ele) => `${ele.tableName}__${ele.columnName}`,
            );

            const selectString = selectStringArray.join(', ');
            const aliasString = tableColumnsObject[tableName]
                .map(
                    (ele) => `${ele.columnName}`, // may need to switch to ele.columnName2 but they seem to be identical
                )
                .join(', ');

            const limit = 10; // may want this to be a changeable useState variable
            const pixelString = `Database(database=[\"${selectedDatabaseId}\"])|Select(${selectString}).as([${aliasString}])|Distinct(false)|Limit(${limit})|Import(frame=[CreateFrame(frameType=[GRID],override=[true]).as([\"consolidated_settings_FRAME961853__Preview\"])]); META | Frame() | QueryAll() | Limit(${limit}) | Collect(500);`;

            await monolithStore.runQuery(pixelString).then((response) => {
                const type = response.pixelReturn[0].operationType;
                const tableHeadersData =
                    response.pixelReturn[1].output.data.headers;
                const tableRawHeadersData =
                    response.pixelReturn[1].output.data.rawHeaders;
                const tableRowsData =
                    response.pixelReturn[1].output.data.values;

                console.log({
                    tableHeadersData,
                    tableRawHeadersData,
                    tableRowsData,
                });

                setDatabaseTableHeaders(tableHeadersData);
                setDatabaseTableRawHeaders(tableRawHeadersData);
                setDatabaseTableRows(tableRowsData);

                if (type.indexOf('ERROR') != -1) {
                    console.error('Error retrieving database tables');
                }

                setIsDatabaseLoading(false);
            });
        };

        return (
            <Stack direction={'row'} alignItems={'center'} gap={1}>
                <StyledDivider />
                <StyledBorderDiv>
                    {Object.entries(AddCellOptions).map((add, i) => {
                        const value = add[1];
                        return (
                            <StyledButton
                                key={i}
                                title={`${value.display}`}
                                variant="contained"
                                size="small"
                                disabled={query.isLoading || value.disabled}
                                startIcon={value.icon}
                                onClick={(e) => {
                                    if (value.options) {
                                        setAnchorEl(e.currentTarget);
                                        setSelectedAddCell(add[0]);
                                    } else {
                                        appendCell(value.defaultCellType);
                                    }
                                }}
                                endIcon={
                                    Array.isArray(value.options) &&
                                    (selectedAddCell == add[0] && open ? (
                                        <KeyboardArrowDown />
                                    ) : (
                                        <KeyboardArrowUp />
                                    ))
                                }
                            >
                                {value.display}
                            </StyledButton>
                        );
                    })}
                </StyledBorderDiv>
                <StyledDivider />
                <StyledMenu
                    anchorEl={anchorEl}
                    open={
                        open &&
                        !!AddCellOptions[selectedAddCell]?.options?.length
                    }
                    onClose={() => {
                        setAnchorEl(null);
                    }}
                >
                    {selectedAddCell === 'transformation' &&
                        Array.from(
                            AddCellOptions[selectedAddCell]?.options || [],
                            ({ display, defaultCellType }, index) => {
                                return (
                                    <StyledMenuItem
                                        key={index}
                                        value={display}
                                        onClick={() => {
                                            appendCell(defaultCellType);
                                            setAnchorEl(null);
                                        }}
                                    >
                                        {display}
                                    </StyledMenuItem>
                                );
                            },
                        )}

                    {selectedAddCell === 'import-data' && (
                        <>
                            {Array.from(
                                AddCellOptions[selectedAddCell]?.options || [],
                                ({ display }, index) => {
                                    return (
                                        <StyledMenuItem
                                            key={index}
                                            value={display}
                                            disabled={display == 'From CSV'} // temporary
                                            onClick={() => {
                                                // loadDatabaseStructure();
                                                setImportModalPixelWidth(
                                                    IMPORT_MODAL_WIDTHS.small,
                                                );
                                                setIsDataImportModalOpen(true);
                                                if (
                                                    display ==
                                                    'From Data Catalog'
                                                ) {
                                                    setImportModalType(display);
                                                } else {
                                                    // open seperate modal / form for From CSV
                                                }
                                                setAnchorEl(null);
                                            }}
                                        >
                                            {display}
                                        </StyledMenuItem>
                                    );
                                },
                            )}
                        </>
                    )}
                </StyledMenu>

                {/* New Import Data Modal */}
                <Modal open={isDataImportModalOpen} maxWidth="lg">
                    <Modal.Content sx={{ width: importModalPixelWidth }}>
                        <form onSubmit={handleSubmit(onImportDataSubmit)}>
                            <StyledModalTitleWrapper>
                                <div
                                    style={{
                                        width: 'fit-content',
                                        blockSize: 'fit-content',
                                        display: 'flex',
                                    }}
                                >
                                    <StyledModalTitle variant="h6">
                                        Import Data from
                                    </StyledModalTitle>
                                    <Controller
                                        name={'databaseSelect'}
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                onChange={(e) => {
                                                    field.onChange(
                                                        e.target.value,
                                                    );
                                                    setSelectedDatabaseId(
                                                        e.target.value,
                                                    );
                                                    // old load delete later
                                                    // retrieveDatabaseTables(
                                                    //     e.target.value,
                                                    // );
                                                    // new load covers old one with edges added
                                                    retrieveDatabaseTablesAndEdges(
                                                        e.target.value,
                                                    );
                                                    setShowEditColumns(false);
                                                    setShowTablePreview(false);
                                                    setSelectedTable(null);
                                                    setHiddenColumnIdsSet(
                                                        new Set(),
                                                    );
                                                    setImportModalPixelWidth(
                                                        IMPORT_MODAL_WIDTHS.medium,
                                                    );
                                                }}
                                                label={'Select Database'}
                                                value={field.value || null}
                                                size={'small'}
                                                sx={{
                                                    minWidth: '220px',
                                                }}
                                            >
                                                {userDatabases?.map((ele) => (
                                                    <Menu.Item
                                                        value={ele.database_id}
                                                    >
                                                        {ele.app_name}
                                                    </Menu.Item>
                                                ))}
                                            </Select>
                                        )}
                                    />
                                </div>
                                <IconButton disabled={true}>
                                    <KeyboardArrowDown />
                                </IconButton>
                            </StyledModalTitleWrapper>
                            <div style={{ width: '100%', display: 'flex' }}>
                                <div
                                    style={{
                                        width: '50%',
                                        height: '250px',
                                        border: '1px solid lightgray',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'left',
                                        padding: '0px 24px',
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        color="secondary"
                                        sx={{ fontStyle: 'italic' }}
                                    >
                                        First, select a datasource
                                    </Typography>
                                    <IconButton
                                        sx={{ barder: '1px solid #666' }}
                                        color="secondary"
                                    >
                                        {/* <AccountTree/> */}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <g clipPath="url(#clip0_2378_103062)">
                                                <path
                                                    fillRule="evenodd"
                                                    clipRule="evenodd"
                                                    d="M12 3C7.58 3 4 4.79 4 7V17C4 19.21 7.59 21 12 21C16.41 21 20 19.21 20 17V7C20 4.79 16.42 3 12 3ZM18 17C18 17.5 15.87 19 12 19C8.13 19 6 17.5 6 17V14.77C7.61 15.55 9.72 16 12 16C14.28 16 16.39 15.55 18 14.77V17ZM18 12.45C16.7 13.4 14.42 14 12 14C9.58 14 7.3 13.4 6 12.45V9.64C7.47 10.47 9.61 11 12 11C14.39 11 16.53 10.47 18 9.64V12.45ZM12 9C8.13 9 6 7.5 6 7C6 6.5 8.13 5 12 5C15.87 5 18 6.5 18 7C18 7.5 15.87 9 12 9Z"
                                                    fill="#666666"
                                                ></path>
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_2378_103062">
                                                    <rect
                                                        width="24"
                                                        height="24"
                                                        fill="#666666"
                                                    ></rect>
                                                </clipPath>
                                            </defs>
                                        </svg>
                                    </IconButton>
                                </div>
                                <div
                                    style={{
                                        width: '50%',
                                        height: '250px',
                                        border: '1px solid lightgray',
                                        borderLeft: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'left',
                                    }}
                                >
                                    test
                                </div>
                            </div>
                            {!!tableNames.length && (
                                <Stack
                                    spacing={1}
                                    direction="column"
                                    sx={{
                                        backgroundColor: '#FAFAFA',
                                        padding: '16px 16px 16px 16px',
                                        marginBottom: '15px',
                                    }}
                                >
                                    <StyledModalTitleWrapper2>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    marginRight: '15px',
                                                    marginBottom: '-1.5px',
                                                }}
                                                variant="h6"
                                            >
                                                Data
                                            </Typography>
                                            <Controller
                                                name={'tableSelect'}
                                                control={control}
                                                render={({ field }) => (
                                                    <Select
                                                        onChange={(e) => {
                                                            field.onChange(
                                                                e.target.value,
                                                            );
                                                            selectTableHandler(
                                                                e.target.value,
                                                            );
                                                            setHiddenColumnIdsSet(
                                                                new Set(),
                                                            );
                                                            if (
                                                                !showTablePreview &&
                                                                !showEditColumns
                                                            ) {
                                                                setShowTablePreview(
                                                                    true,
                                                                );
                                                            }
                                                            setImportModalPixelWidth(
                                                                IMPORT_MODAL_WIDTHS.large,
                                                            );
                                                        }}
                                                        label={'Select Table'}
                                                        value={field.value}
                                                        size={'small'}
                                                        color="primary"
                                                        disabled={
                                                            !tableNames.length
                                                        }
                                                        variant="outlined"
                                                        sx={{
                                                            minWidth: '150px',
                                                        }}
                                                    >
                                                        {tableNames?.map(
                                                            (ele) => (
                                                                <Menu.Item
                                                                    value={ele}
                                                                >
                                                                    {ele}
                                                                </Menu.Item>
                                                            ),
                                                        )}
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <Button
                                                variant="text"
                                                color="primary"
                                                size="medium"
                                                sx={{
                                                    marginRight: '15px',
                                                }}
                                                onClick={() => {
                                                    setShowEditColumns(
                                                        !showEditColumns,
                                                    );
                                                    setShowTablePreview(false);
                                                }}
                                            >
                                                Edit Columns
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="medium"
                                                onClick={() => {
                                                    setShowTablePreview(
                                                        !showTablePreview,
                                                    );
                                                    setShowEditColumns(false);
                                                }}
                                            >
                                                Preview
                                            </Button>
                                        </div>
                                    </StyledModalTitleWrapper2>

                                    {showEditColumns && (
                                        <Table.Container
                                            sx={{
                                                backgroundColor: '#fff',
                                                marginBottom: '20px',
                                                padding: '0px 20px 25px',
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    marginTop: '15px',
                                                    marginLeft: '15px',
                                                    marginBottom: '20px',
                                                }}
                                            >
                                                Edit Columns
                                            </Typography>

                                            <Table stickyHeader size={'small'}>
                                                {/* table header with uncontrolled checkbox for all */}
                                                <Table.Body>
                                                    <Table.Row>
                                                        <Table.Cell>
                                                            <IconButton
                                                                onClick={() => {
                                                                    setCheckAllColumns(
                                                                        !checkAllColumns,
                                                                    );
                                                                    const hiddenColumnIdsSetDup =
                                                                        new Set();
                                                                    if (
                                                                        checkAllColumns ==
                                                                        false
                                                                    ) {
                                                                        editableColumnFields.forEach(
                                                                            (
                                                                                field,
                                                                                index,
                                                                            ) => {
                                                                                // not working need to use setValue
                                                                                field.checked =
                                                                                    true;
                                                                                console.log(
                                                                                    {
                                                                                        index,
                                                                                        field,
                                                                                    },
                                                                                );
                                                                                hiddenColumnIdsSetDup.add(
                                                                                    index,
                                                                                );
                                                                            },
                                                                        );
                                                                    } else {
                                                                        editableColumnFields.forEach(
                                                                            (
                                                                                field,
                                                                                index,
                                                                            ) => {
                                                                                // not working need to use setValue
                                                                                field.checked =
                                                                                    false;
                                                                                console.log(
                                                                                    {
                                                                                        index,
                                                                                        field,
                                                                                    },
                                                                                );
                                                                                hiddenColumnIdsSetDup.delete(
                                                                                    index,
                                                                                );
                                                                            },
                                                                        );
                                                                    }
                                                                    setHiddenColumnIdsSet(
                                                                        hiddenColumnIdsSetDup,
                                                                    );
                                                                }}
                                                                color={
                                                                    checkAllColumns
                                                                        ? 'primary'
                                                                        : 'secondary'
                                                                }
                                                                sx={{
                                                                    marginLeft:
                                                                        '-10px',
                                                                }}
                                                            >
                                                                <IndeterminateCheckBox />
                                                            </IconButton>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight:
                                                                        'bold',
                                                                }}
                                                            >
                                                                Fields
                                                            </Typography>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight:
                                                                        'bold',
                                                                }}
                                                            >
                                                                Alias
                                                            </Typography>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight:
                                                                        'bold',
                                                                }}
                                                            >
                                                                Field Type
                                                            </Typography>
                                                        </Table.Cell>
                                                    </Table.Row>

                                                    {/* show checkboxes and text fields for all columns */}
                                                    {editableColumnFields?.map(
                                                        (field, index) => (
                                                            <Table.Row
                                                                key={field.id}
                                                            >
                                                                <Table.Cell>
                                                                    <Controller
                                                                        name={`columns.${index}.checked`}
                                                                        control={
                                                                            control
                                                                        }
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <Checkbox
                                                                                checked={
                                                                                    field.value
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    field.onChange(
                                                                                        e,
                                                                                    );
                                                                                    const hiddenColumnIdsSetDup =
                                                                                        new Set(
                                                                                            [
                                                                                                ...hiddenColumnIdsSet,
                                                                                            ],
                                                                                        );
                                                                                    if (
                                                                                        field.value ==
                                                                                        true
                                                                                    ) {
                                                                                        hiddenColumnIdsSetDup.add(
                                                                                            index,
                                                                                        );
                                                                                    } else {
                                                                                        hiddenColumnIdsSetDup.delete(
                                                                                            index,
                                                                                        );
                                                                                    }

                                                                                    console.log(
                                                                                        {
                                                                                            hiddenColumnIdsSetDup,
                                                                                            editableColumnFields,
                                                                                        },
                                                                                    );

                                                                                    if (
                                                                                        hiddenColumnIdsSetDup.size ==
                                                                                        0
                                                                                    ) {
                                                                                        setCheckAllColumns(
                                                                                            true,
                                                                                        );
                                                                                    } else {
                                                                                        setCheckAllColumns(
                                                                                            false,
                                                                                        );
                                                                                    }

                                                                                    setHiddenColumnIdsSet(
                                                                                        hiddenColumnIdsSetDup,
                                                                                    );
                                                                                }}
                                                                            />
                                                                        )}
                                                                    />
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    {
                                                                        field.columnName
                                                                    }
                                                                    {field.columnName ==
                                                                        'ID' && (
                                                                        <div
                                                                            style={{
                                                                                backgroundColor:
                                                                                    '#F1E9FB',
                                                                                padding:
                                                                                    '3px, 4px, 3px, 4px',
                                                                                width: '37px',
                                                                                height: '24px',
                                                                                borderRadius:
                                                                                    '3px',
                                                                                display:
                                                                                    'inline-block',
                                                                                marginLeft:
                                                                                    '7px',
                                                                                paddingTop:
                                                                                    '3px',
                                                                                textAlign:
                                                                                    'center',
                                                                            }}
                                                                        >
                                                                            PK
                                                                        </div>
                                                                    )}
                                                                    {field.columnName.includes(
                                                                        '_ID',
                                                                    ) && (
                                                                        <div
                                                                            style={{
                                                                                backgroundColor:
                                                                                    '#EBEBEB', //Secondary/Selected
                                                                                padding:
                                                                                    '3px, 4px, 3px, 4px',
                                                                                width: '37px',
                                                                                height: '24px',
                                                                                borderRadius:
                                                                                    '3px',
                                                                                display:
                                                                                    'inline-block',
                                                                                marginLeft:
                                                                                    '7px',
                                                                                paddingTop:
                                                                                    '3px',
                                                                                textAlign:
                                                                                    'center',
                                                                            }}
                                                                        >
                                                                            FK
                                                                        </div>
                                                                    )}
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <Controller
                                                                        name={`columns.${index}.userAlias`}
                                                                        control={
                                                                            control
                                                                        }
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <TextField
                                                                                type="text"
                                                                                variant="outlined"
                                                                                size="small"
                                                                                value={
                                                                                    field.value
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    field.onChange(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    );
                                                                                    const newTableHeaders =
                                                                                        [
                                                                                            ...databaseTableHeaders,
                                                                                        ];
                                                                                    newTableHeaders[
                                                                                        index
                                                                                    ] =
                                                                                        e.target.value;
                                                                                    setDatabaseTableHeaders(
                                                                                        newTableHeaders,
                                                                                    );
                                                                                }}
                                                                            />
                                                                        )}
                                                                    />
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <Controller
                                                                        name={`columns.${index}.columnType`}
                                                                        control={
                                                                            control
                                                                        }
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <Select
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    field.onChange(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    );
                                                                                    // unclear what desired effect is
                                                                                }}
                                                                                value={
                                                                                    field.value ||
                                                                                    null
                                                                                }
                                                                                size={
                                                                                    'small'
                                                                                }
                                                                                sx={{
                                                                                    minWidth:
                                                                                        '220px',
                                                                                }}
                                                                            >
                                                                                {SQL_COLUMN_TYPES.map(
                                                                                    (
                                                                                        ele,
                                                                                    ) => (
                                                                                        <Menu.Item
                                                                                            value={
                                                                                                ele
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                ele
                                                                                            }
                                                                                        </Menu.Item>
                                                                                    ),
                                                                                )}
                                                                            </Select>
                                                                        )}
                                                                    />
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        ),
                                                    )}
                                                </Table.Body>
                                            </Table>
                                            <Modal.Actions
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    // padding: '0px',
                                                }}
                                            >
                                                <Button
                                                    variant="text"
                                                    color="secondary"
                                                    size="small"
                                                    onClick={() => {
                                                        // closeImportModalHandler();
                                                        setShowEditColumns(
                                                            false,
                                                        );
                                                    }}
                                                >
                                                    Close
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                >
                                                    Save
                                                </Button>
                                            </Modal.Actions>
                                        </Table.Container>
                                    )}

                                    {showTablePreview && (
                                        <Table.Container
                                            sx={{
                                                backgroundColor: '#fff',
                                                marginBottom: '20px',
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    marginTop: '15px',
                                                    marginLeft: '15px',
                                                    marginBottom: '20px',
                                                }}
                                            >
                                                Preview
                                            </Typography>
                                            <Table stickyHeader size={'small'}>
                                                <Table.Body>
                                                    <Table.Row>
                                                        {databaseTableHeaders
                                                            .filter(
                                                                (v, colIdx) => {
                                                                    return !hiddenColumnIdsSet.has(
                                                                        colIdx,
                                                                    );
                                                                },
                                                            )
                                                            .map((h, hIdx) => (
                                                                <Table.Cell
                                                                    key={hIdx}
                                                                >
                                                                    <strong>
                                                                        {h}
                                                                    </strong>
                                                                </Table.Cell>
                                                            ))}
                                                    </Table.Row>
                                                    {databaseTableRows.map(
                                                        (r, rIdx) => (
                                                            <Table.Row
                                                                key={rIdx}
                                                            >
                                                                {r
                                                                    .filter(
                                                                        (
                                                                            v,
                                                                            colIdx,
                                                                        ) => {
                                                                            return !hiddenColumnIdsSet.has(
                                                                                colIdx,
                                                                            );
                                                                        },
                                                                    )
                                                                    .map(
                                                                        (
                                                                            v,
                                                                            vIdx,
                                                                        ) => (
                                                                            <Table.Cell
                                                                                key={`${rIdx}-${vIdx}`}
                                                                            >
                                                                                {
                                                                                    v
                                                                                }
                                                                            </Table.Cell>
                                                                        ),
                                                                    )}
                                                            </Table.Row>
                                                        ),
                                                    )}
                                                </Table.Body>
                                            </Table>
                                        </Table.Container>
                                    )}
                                </Stack>
                            )}

                            {/* stack for user-added joins filters and summaries */}
                            {stackFields.map((stack, stackIndex) => (
                                <Stack
                                    spacing={1}
                                    direction="column"
                                    sx={{
                                        backgroundColor: '#FAFAFA',
                                        padding: '16px 16px 16px 16px',
                                        marginBottom: '15px',
                                    }}
                                >
                                    <StyledModalTitleWrapper2>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    marginRight: '15px',
                                                    marginBottom: '-1.5px',
                                                }}
                                                variant="h6"
                                            >
                                                {stack.queryType}
                                            </Typography>
                                            {/* <Controller

                                            // ADD TO USEFORM CONTROL ASAP
                                            // DELETE STATE VARS

                                            name={'tableSelect'}
                                            control={control}
                                            render={({ field }) => ( */}
                                            <Select
                                                onChange={(e) => {
                                                    // field.onChange(
                                                    //     e.target.value,
                                                    // );
                                                    // selectTableHandler(
                                                    //     e.target.value,
                                                    // );
                                                    // setHiddenColumnIdsSet(
                                                    //     new Set(),
                                                    // );
                                                    // if (
                                                    //     !showTablePreview &&
                                                    //     !showEditColumns
                                                    // ) {
                                                    //     setShowTablePreview(
                                                    //         true,
                                                    //     );
                                                    // }
                                                    // setImportModalPixelWidth(
                                                    //     IMPORT_MODAL_WIDTHS.large,
                                                    // );
                                                    console.log({
                                                        selectedTable,
                                                    });
                                                    setSelectedLeftTable(
                                                        e.target.value,
                                                    );
                                                }}
                                                // label={'Left Table'}
                                                // value={selectedLeftTable}
                                                value={selectedTable}
                                                size={'small'}
                                                color="primary"
                                                // disabled={!tableNames.length}
                                                disabled={true}
                                                variant="outlined"
                                                sx={{
                                                    width: '125px',
                                                }}
                                            >
                                                {tableNames?.map((ele) => (
                                                    <Menu.Item value={ele}>
                                                        {ele}
                                                    </Menu.Item>
                                                ))}
                                            </Select>
                                            {/* )}
                                        /> */}
                                            <Tooltip title={`${'Inner Join'}`}>
                                                <IconButton
                                                    size="small"
                                                    color="secondary"
                                                    sx={{
                                                        marginLeft: '7.5px',
                                                        marginRight: '7.5px',
                                                    }}
                                                >
                                                    <JoinInner />
                                                </IconButton>
                                            </Tooltip>
                                            {/* <Controller

                                            // ADD TO USEFORM CONTROL ASAP
                                            // DELETE STATE VARS

                                            name={'tableSelect'}
                                            control={control}
                                            render={({ field }) => ( */}
                                            <Select
                                                onChange={(e) => {
                                                    // field.onChange(
                                                    //     e.target.value,
                                                    // );
                                                    // selectTableHandler(
                                                    //     e.target.value,
                                                    // );
                                                    // setHiddenColumnIdsSet(
                                                    //     new Set(),
                                                    // );
                                                    // if (
                                                    //     !showTablePreview &&
                                                    //     !showEditColumns
                                                    // ) {
                                                    //     setShowTablePreview(
                                                    //         true,
                                                    //     );
                                                    // }
                                                    // setImportModalPixelWidth(
                                                    //     IMPORT_MODAL_WIDTHS.large,
                                                    // );
                                                    console.log({
                                                        selectedTable,
                                                    });
                                                    setSelectedRightTable(
                                                        e.target.value,
                                                    );
                                                    setSelectedLeftKey(
                                                        tableEdgesObject[
                                                            selectedTable
                                                        ][e.target.value]
                                                            .sourceColumn,
                                                    );
                                                    setSelectedRightKey(
                                                        tableEdgesObject[
                                                            selectedTable
                                                        ][e.target.value]
                                                            .targetColumn,
                                                    );
                                                }}
                                                // label={'Right Table'}
                                                label={'Join Table'}
                                                value={selectedRightTable}
                                                size={'small'}
                                                color="primary"
                                                // disabled={!tableNames.length}
                                                disabled={
                                                    !(
                                                        tableEdgesObject[
                                                            selectedTable
                                                        ] &&
                                                        Object.values(
                                                            tableEdgesObject[
                                                                selectedTable
                                                            ],
                                                        ).length
                                                    )
                                                }
                                                variant="outlined"
                                                sx={{
                                                    width: '125px',
                                                }}
                                            >
                                                {tableNames
                                                    ?.filter(
                                                        (ele) =>
                                                            // ### NEED TO...
                                                            // key into this differently, they wont be sets
                                                            tableEdgesObject[
                                                                selectedTable
                                                            ] &&
                                                            tableEdgesObject[
                                                                selectedTable
                                                            ][ele],
                                                    )
                                                    .map((ele) => (
                                                        <Menu.Item value={ele}>
                                                            {ele}
                                                        </Menu.Item>
                                                    ))}
                                            </Select>
                                            {/* )}
                                        /> */}
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    marginLeft: '7.5px',
                                                    marginRight: '7.5px',
                                                    color: 'gray', // temp color
                                                }}
                                            >
                                                where
                                            </Typography>
                                            {/* <Controller
                                            name={'tableSelect'}
                                            control={control}
                                            render={({ field }) => ( */}
                                            <Select
                                                onChange={(e) => {
                                                    // field.onChange(
                                                    //     e.target.value,
                                                    // );
                                                    // selectTableHandler(
                                                    //     e.target.value,
                                                    // );
                                                    // setHiddenColumnIdsSet(
                                                    //     new Set(),
                                                    // );
                                                    // if (
                                                    //     !showTablePreview &&
                                                    //     !showEditColumns
                                                    // ) {
                                                    //     setShowTablePreview(
                                                    //         true,
                                                    //     );
                                                    // }
                                                    // setImportModalPixelWidth(
                                                    //     IMPORT_MODAL_WIDTHS.large,
                                                    // );
                                                    setSelectedLeftKey(
                                                        e.target.value,
                                                    );
                                                }}
                                                // label={'Left Key'}
                                                // value={field.value}
                                                value={selectedLeftKey}
                                                size={'small'}
                                                color="primary"
                                                // disabled={!selectedLeftTable}
                                                disabled={true}
                                                variant="outlined"
                                                sx={{
                                                    width: '120px',
                                                }}
                                            >
                                                <Menu.Item
                                                    value={selectedLeftKey}
                                                >
                                                    {selectedLeftKey}
                                                </Menu.Item>

                                                {/* {tableColumnsObject[
                                                    selectedLeftTable
                                                ]?.map((colObj, idx) => (
                                                    <Menu.Item
                                                        value={
                                                            colObj.columnName
                                                        }
                                                        key={idx}
                                                    >
                                                        {colObj.columnName}
                                                    </Menu.Item>
                                                ))} */}
                                            </Select>
                                            {/* )}
                                        /> */}
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    marginLeft: '7.5px',
                                                    marginRight: '7.5px',
                                                    color: 'gray', // temp color
                                                }}
                                            >
                                                =
                                            </Typography>
                                            {/* <Controller
                                            name={'tableSelect'}
                                            control={control}
                                            render={({ field }) => ( */}
                                            <Select
                                                onChange={(e) => {
                                                    // field.onChange(
                                                    //     e.target.value,
                                                    // );
                                                    // selectTableHandler(
                                                    //     e.target.value,
                                                    // );
                                                    // setHiddenColumnIdsSet(
                                                    //     new Set(),
                                                    // );
                                                    // if (
                                                    //     !showTablePreview &&
                                                    //     !showEditColumns
                                                    // ) {
                                                    //     setShowTablePreview(
                                                    //         true,
                                                    //     );
                                                    // }
                                                    // setImportModalPixelWidth(
                                                    //     IMPORT_MODAL_WIDTHS.large,
                                                    // );
                                                    setSelectedRightKey(
                                                        e.target.value,
                                                    );
                                                }}
                                                // label={'Right Key'}
                                                // value={field.value}
                                                value={selectedRightKey}
                                                size={'small'}
                                                color="primary"
                                                // disabled={!selectedRightTable}
                                                disabled={true}
                                                variant="outlined"
                                                sx={{
                                                    width: '120px',
                                                }}
                                            >
                                                <Menu.Item
                                                    value={selectedRightKey}
                                                >
                                                    {selectedRightKey}
                                                </Menu.Item>
                                                {/* {tableColumnsObject[
                                                    selectedRightTable
                                                ]?.map((colObj, idx) => (
                                                    <Menu.Item
                                                        value={
                                                            colObj.columnName
                                                        }
                                                        key={idx}
                                                    >
                                                        {colObj.columnName}
                                                    </Menu.Item>
                                                ))} */}
                                            </Select>
                                            {/* )}
                                        /> */}
                                        </div>
                                        <div>
                                            <IconButton
                                                size="small"
                                                color="secondary"
                                                onClick={() => {
                                                    removeStack(stackIndex);
                                                }}
                                            >
                                                <Close />
                                            </IconButton>

                                            <Button
                                                variant="text"
                                                color="primary"
                                                size="medium"
                                                sx={{
                                                    marginRight: '15px',
                                                }}
                                                onClick={() => {
                                                    // setShowEditColumns(
                                                    //     !showEditColumns,
                                                    // );
                                                    // setShowTablePreview(false);
                                                }}
                                            >
                                                Edit Columns
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                size="medium"
                                                // onClick={() => {
                                                //     setShowTablePreview(
                                                //         !showTablePreview,
                                                //     );
                                                //     setShowEditColumns(false);
                                                // }}
                                            >
                                                Preview
                                            </Button>
                                        </div>
                                    </StyledModalTitleWrapper2>

                                    {/* {showEditColumns && ( */}
                                    {false && (
                                        <Table.Container
                                            sx={{
                                                backgroundColor: '#fff',
                                                marginBottom: '20px',
                                                padding: '0px 20px 25px',
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    marginTop: '15px',
                                                    marginLeft: '15px',
                                                    marginBottom: '20px',
                                                }}
                                            >
                                                Edit Columns
                                            </Typography>

                                            <Table stickyHeader size={'small'}>
                                                {/* table header with uncontrolled checkbox for all */}
                                                <Table.Body>
                                                    <Table.Row>
                                                        <Table.Cell>
                                                            <IconButton
                                                                onClick={() => {
                                                                    setCheckAllColumns(
                                                                        !checkAllColumns,
                                                                    );
                                                                    const hiddenColumnIdsSetDup =
                                                                        new Set();
                                                                    if (
                                                                        checkAllColumns ==
                                                                        false
                                                                    ) {
                                                                        editableColumnFields.forEach(
                                                                            (
                                                                                field,
                                                                                index,
                                                                            ) => {
                                                                                // not working need to use setValue
                                                                                field.checked =
                                                                                    true;
                                                                                console.log(
                                                                                    {
                                                                                        index,
                                                                                        field,
                                                                                    },
                                                                                );
                                                                                hiddenColumnIdsSetDup.add(
                                                                                    index,
                                                                                );
                                                                            },
                                                                        );
                                                                    } else {
                                                                        editableColumnFields.forEach(
                                                                            (
                                                                                field,
                                                                                index,
                                                                            ) => {
                                                                                // not working need to use setValue
                                                                                field.checked =
                                                                                    false;
                                                                                console.log(
                                                                                    {
                                                                                        index,
                                                                                        field,
                                                                                    },
                                                                                );
                                                                                hiddenColumnIdsSetDup.delete(
                                                                                    index,
                                                                                );
                                                                            },
                                                                        );
                                                                    }
                                                                    setHiddenColumnIdsSet(
                                                                        hiddenColumnIdsSetDup,
                                                                    );
                                                                }}
                                                                color={
                                                                    checkAllColumns
                                                                        ? 'primary'
                                                                        : 'secondary'
                                                                }
                                                                sx={{
                                                                    marginLeft:
                                                                        '-10px',
                                                                }}
                                                            >
                                                                <IndeterminateCheckBox />
                                                            </IconButton>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight:
                                                                        'bold',
                                                                }}
                                                            >
                                                                Fields
                                                            </Typography>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight:
                                                                        'bold',
                                                                }}
                                                            >
                                                                Alias
                                                            </Typography>
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    fontWeight:
                                                                        'bold',
                                                                }}
                                                            >
                                                                Field Type
                                                            </Typography>
                                                        </Table.Cell>
                                                    </Table.Row>

                                                    {/* show checkboxes and text fields for all columns */}
                                                    {editableColumnFields?.map(
                                                        (field, index) => (
                                                            <Table.Row
                                                                key={field.id}
                                                            >
                                                                <Table.Cell>
                                                                    <Controller
                                                                        name={`columns.${index}.checked`}
                                                                        control={
                                                                            control
                                                                        }
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <Checkbox
                                                                                checked={
                                                                                    field.value
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    field.onChange(
                                                                                        e,
                                                                                    );
                                                                                    const hiddenColumnIdsSetDup =
                                                                                        new Set(
                                                                                            [
                                                                                                ...hiddenColumnIdsSet,
                                                                                            ],
                                                                                        );
                                                                                    if (
                                                                                        field.value ==
                                                                                        true
                                                                                    ) {
                                                                                        hiddenColumnIdsSetDup.add(
                                                                                            index,
                                                                                        );
                                                                                    } else {
                                                                                        hiddenColumnIdsSetDup.delete(
                                                                                            index,
                                                                                        );
                                                                                    }

                                                                                    console.log(
                                                                                        {
                                                                                            hiddenColumnIdsSetDup,
                                                                                            editableColumnFields,
                                                                                        },
                                                                                    );

                                                                                    if (
                                                                                        hiddenColumnIdsSetDup.size ==
                                                                                        0
                                                                                    ) {
                                                                                        setCheckAllColumns(
                                                                                            true,
                                                                                        );
                                                                                    } else {
                                                                                        setCheckAllColumns(
                                                                                            false,
                                                                                        );
                                                                                    }

                                                                                    setHiddenColumnIdsSet(
                                                                                        hiddenColumnIdsSetDup,
                                                                                    );
                                                                                }}
                                                                            />
                                                                        )}
                                                                    />
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    {
                                                                        field.columnName
                                                                    }
                                                                    {field.columnName ==
                                                                        'ID' && (
                                                                        <div
                                                                            style={{
                                                                                backgroundColor:
                                                                                    '#F1E9FB',
                                                                                padding:
                                                                                    '3px, 4px, 3px, 4px',
                                                                                width: '37px',
                                                                                height: '24px',
                                                                                borderRadius:
                                                                                    '3px',
                                                                                display:
                                                                                    'inline-block',
                                                                                marginLeft:
                                                                                    '7px',
                                                                                paddingTop:
                                                                                    '3px',
                                                                                textAlign:
                                                                                    'center',
                                                                            }}
                                                                        >
                                                                            PK
                                                                        </div>
                                                                    )}
                                                                    {field.columnName.includes(
                                                                        '_ID',
                                                                    ) && (
                                                                        <div
                                                                            style={{
                                                                                backgroundColor:
                                                                                    '#EBEBEB', //Secondary/Selected
                                                                                padding:
                                                                                    '3px, 4px, 3px, 4px',
                                                                                width: '37px',
                                                                                height: '24px',
                                                                                borderRadius:
                                                                                    '3px',
                                                                                display:
                                                                                    'inline-block',
                                                                                marginLeft:
                                                                                    '7px',
                                                                                paddingTop:
                                                                                    '3px',
                                                                                textAlign:
                                                                                    'center',
                                                                            }}
                                                                        >
                                                                            FK
                                                                        </div>
                                                                    )}
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <Controller
                                                                        name={`columns.${index}.userAlias`}
                                                                        control={
                                                                            control
                                                                        }
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <TextField
                                                                                type="text"
                                                                                variant="outlined"
                                                                                size="small"
                                                                                value={
                                                                                    field.value
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    field.onChange(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    );
                                                                                    const newTableHeaders =
                                                                                        [
                                                                                            ...databaseTableHeaders,
                                                                                        ];
                                                                                    newTableHeaders[
                                                                                        index
                                                                                    ] =
                                                                                        e.target.value;
                                                                                    setDatabaseTableHeaders(
                                                                                        newTableHeaders,
                                                                                    );
                                                                                }}
                                                                            />
                                                                        )}
                                                                    />
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <Controller
                                                                        name={`columns.${index}.columnType`}
                                                                        control={
                                                                            control
                                                                        }
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <Select
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    field.onChange(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    );
                                                                                    // unclear what desired effect is
                                                                                }}
                                                                                value={
                                                                                    field.value ||
                                                                                    null
                                                                                }
                                                                                size={
                                                                                    'small'
                                                                                }
                                                                                sx={{
                                                                                    minWidth:
                                                                                        '220px',
                                                                                }}
                                                                            >
                                                                                {SQL_COLUMN_TYPES.map(
                                                                                    (
                                                                                        ele,
                                                                                    ) => (
                                                                                        <Menu.Item
                                                                                            value={
                                                                                                ele
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                ele
                                                                                            }
                                                                                        </Menu.Item>
                                                                                    ),
                                                                                )}
                                                                            </Select>
                                                                        )}
                                                                    />
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        ),
                                                    )}
                                                </Table.Body>
                                            </Table>
                                            <Modal.Actions
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    // padding: '0px',
                                                }}
                                            >
                                                <Button
                                                    variant="text"
                                                    color="secondary"
                                                    size="small"
                                                    onClick={() => {
                                                        // closeImportModalHandler();
                                                        setShowEditColumns(
                                                            false,
                                                        );
                                                    }}
                                                >
                                                    Close
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                >
                                                    Save
                                                </Button>
                                            </Modal.Actions>
                                        </Table.Container>
                                    )}

                                    {/* {showTablePreview && ( */}
                                    {false && (
                                        <Table.Container
                                            sx={{
                                                backgroundColor: '#fff',
                                                marginBottom: '20px',
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    marginTop: '15px',
                                                    marginLeft: '15px',
                                                    marginBottom: '20px',
                                                }}
                                            >
                                                Preview
                                            </Typography>
                                            <Table stickyHeader size={'small'}>
                                                <Table.Body>
                                                    <Table.Row>
                                                        {databaseTableHeaders
                                                            .filter(
                                                                (v, colIdx) => {
                                                                    return !hiddenColumnIdsSet.has(
                                                                        colIdx,
                                                                    );
                                                                },
                                                            )
                                                            .map((h, hIdx) => (
                                                                <Table.Cell
                                                                    key={hIdx}
                                                                >
                                                                    <strong>
                                                                        {h}
                                                                    </strong>
                                                                </Table.Cell>
                                                            ))}
                                                    </Table.Row>
                                                    {databaseTableRows.map(
                                                        (r, rIdx) => (
                                                            <Table.Row
                                                                key={rIdx}
                                                            >
                                                                {r
                                                                    .filter(
                                                                        (
                                                                            v,
                                                                            colIdx,
                                                                        ) => {
                                                                            return !hiddenColumnIdsSet.has(
                                                                                colIdx,
                                                                            );
                                                                        },
                                                                    )
                                                                    .map(
                                                                        (
                                                                            v,
                                                                            vIdx,
                                                                        ) => (
                                                                            <Table.Cell
                                                                                key={`${rIdx}-${vIdx}`}
                                                                            >
                                                                                {
                                                                                    v
                                                                                }
                                                                            </Table.Cell>
                                                                        ),
                                                                    )}
                                                            </Table.Row>
                                                        ),
                                                    )}
                                                </Table.Body>
                                            </Table>
                                        </Table.Container>
                                    )}
                                </Stack>
                                // <Stack spacing={1} direction="column" sx={{
                                //     display: 'flex',
                                //     border: '1px solid red',
                                // }}>
                                //     <span>{stack.queryType}</span>
                                //     <Button
                                //         sx={{
                                //             display: 'inline-block',
                                //             width: '40px',
                                //         }}
                                //         variant="contained"
                                //         color="error"
                                //         size="small"
                                //         onClick={() => {
                                //             removeStack(stackIndex);
                                //         }}
                                //     >
                                //         delete
                                //     </Button>
                                // </Stack>
                            ))}

                            <Modal.Actions
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    padding: '0px',
                                    marginTop: '15px',
                                    marginBottom: '15px',
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    size="medium"
                                    disabled={
                                        !selectedDatabaseId ||
                                        !selectedTable ||
                                        !(
                                            tableEdgesObject[selectedTable] &&
                                            Object.values(
                                                tableEdgesObject[selectedTable],
                                            ).length
                                        )
                                    }
                                    // disabled={!(tableEdgesObject[selectedTable] && Object.values(tableEdgesObject[selectedTable]).length)}

                                    onClick={() => {
                                        setQueryElementCounter(
                                            queryElementCounter + 1,
                                        );
                                        console.log({
                                            selectedDatabaseId,
                                            selectedTable,
                                        });
                                        // set the modal width to large
                                        setImportModalPixelWidth(
                                            IMPORT_MODAL_WIDTHS.large,
                                        );
                                        appendStack({
                                            // queryType: `Join ${queryElementCounter}`,
                                            queryType: `Join`,
                                            queryChildren: [
                                                // this should probably be a dict
                                                // it can be mostly empty for this appendStack
                                                // columns will need to be added after table2 is selected
                                                // the dict will need...
                                                // table1 = table selected in Data
                                                // table2
                                                // joinType
                                                // key1
                                                // key2
                                            ],
                                        });
                                    }}
                                    startIcon={<JoinLeftRounded />}
                                >
                                    Join
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    size="medium"
                                    disabled
                                    startIcon={<FilterListRounded />}
                                    onClick={() => {
                                        setQueryElementCounter(
                                            queryElementCounter + 1,
                                        );
                                        appendStack({
                                            queryType: `Filter ${queryElementCounter}`,
                                            queryChildren: [],
                                        });
                                    }}
                                >
                                    Add Filter
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    size="medium"
                                    disabled
                                    startIcon={<ControlPointDuplicateRounded />}
                                    onClick={() => {
                                        setQueryElementCounter(
                                            queryElementCounter + 1,
                                        );
                                        appendStack({
                                            queryType: `Summarization  ${queryElementCounter}`,
                                            queryChildren: [],
                                        });
                                    }}
                                >
                                    Summarize
                                </Button>
                            </Modal.Actions>
                            <Modal.Actions
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    padding: '0px',
                                }}
                            >
                                <Button
                                    variant="text"
                                    color="secondary"
                                    onClick={() => {
                                        closeImportModalHandler();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                >
                                    Import
                                </Button>
                            </Modal.Actions>
                        </form>
                    </Modal.Content>
                </Modal>
            </Stack>
        );
    },
);
