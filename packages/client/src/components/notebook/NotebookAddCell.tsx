import { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import {
    styled,
    Button,
    Divider,
    MenuProps,
    Typography,
    Menu,
    Stack,
    Modal,
    Checkbox,
    TextField,
    IconButton,
    Tooltip,
    Select,
    Table,
    Grid,
} from '@semoss/ui';

import { useBlocks, usePixel, useRootStore } from '@/hooks';
import {
    ActionMessages,
    CellStateConfig,
    NewCellAction,
    QueryState,
} from '@/stores';
import {
    ArrowDownwardRounded,
    ControlPointDuplicateRounded,
    ChangeCircleOutlined,
    IndeterminateCheckBox,
    AddCircleOutline,
    AccountTree,
    Functions,
    Storage,
    Add,
    Code,
    ImportExport,
    KeyboardArrowDown,
    FilterListRounded,
    JoinLeftRounded,
    KeyboardArrowUp,
    TextFields,
    TableRows,
    Label,
    CheckBox,
    AddCircle,
    AddBox,
    Close,
    JoinInner,
    Warning,
    WarningAmber,
    TableView,
    TableChart,
    CalendarViewMonth,
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
import { TableContainer, alertTitleClasses } from '@mui/material';

// region --- Styled Elements

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

const ScrollTableSetContainer = styled(TableContainer)(({ theme }) => ({
    maxHeight: '350px',
    overflowY: 'scroll',
}));

const StyledTableSetWrapper = styled('div')(({ theme }) => ({
    backgroundColor: '#fff',
    marginBottom: '20px',
}));

const StyledTableTitle = styled(Typography)(({ theme }) => ({
    marginTop: '15px',
    marginLeft: '15px',
    marginBottom: '20px',
}));

const StyledTableTitleGreenBubble = styled(Typography)(({ theme }) => ({
    marginTop: '20px',
    marginLeft: '15px',
    marginBottom: '20px',
    backgroundColor: '#E7F4E5x`', // primary 4
    width: 'fit-content',
    padding: '7.5px 17.5px',
    borderRadius: '10px',
}));

const FlexWrapper = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '0px',
    marginTop: '15px',
}));

const FlexTableCell = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    // padding: '0px',
    // marginTop: '15px',
}));

const StyledTableTitleBlueBubble = styled(Typography)(({ theme }) => ({
    marginTop: '0px',
    marginLeft: '0px',
    marginBottom: '15px',
    backgroundColor: '#E2F2FF', // primary 4
    width: 'fit-content',
    padding: '7.5px 17.5px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
}));

const SingleTableWrapper = styled('div')(({ theme }) => ({
    marginBottom: '60px',
    marginLeft: '12.5px',
    marginRight: '12.5px',
}));

const CheckAllIconButton = styled(IconButton)(({ theme }) => ({
    marginLeft: '-10px',
}));

const AliasWarningIcon = styled(Tooltip)(({ theme }) => ({
    color: 'goldenrod',
    marginLeft: '10px',
}));

const TableIconButton = styled(Tooltip)(({ theme }) => ({
    marginLeft: '-3px',
    marginRight: '7px',
    color: theme.palette.primary.main,
}));

const ColumnNameText = styled(Typography)(({ theme }) => ({
    fontWeight: 'bold',
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

// endregion

// region --- Old Data Import useForm Types & Interfaces

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
    tables: Table[];
};

// endregion

// region --- New Data Import useForm Types & Interfaces

interface Column {
    id: number;
    tableName: string;
    columnName: string;
    columnType: string;
    userAlias: string;
    checked: boolean;
}

interface Table {
    id: number;
    name: string;
    columns: Column[];
}

interface NewFormData {
    databaseSelect: string;
    tables: Table[];
}

// ### is this needed?
type NewFormValues = {
    databaseSelect: string;
    tables: Table[];
};

// endregion

// region --- Transformations / Options / Constants

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
        icon: <TextFields />,
        disabled: true,
    },
};

const IMPORT_MODAL_WIDTHS = {
    small: '600px',
    medium: '1150px',
    large: '1150px',
};

const SQL_COLUMN_TYPES = ['DATE', 'NUMBER', 'STRING', 'TIMESTAMP'];

// endregion

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

        // Old useForm for Data Import --- remove
        const { control, handleSubmit, reset, watch, setValue, getValues } =
            useForm<FormValues>({
                defaultValues: {
                    queryStackElements: [],
                    databaseSelect: '',
                    tableSelect: '',
                },
            });

        //  New useForm for Data Import
        const {
            control: newControl,
            handleSubmit: newHandleSubmit,
            reset: newReset,
            getValues: _newGetValues,
            setValue: _newSetValue,
            watch: dataImportwatch,
        } = useForm<NewFormValues>();

        const watchedTables = dataImportwatch('tables');

        // region --- useStates / useRefs

        const [userDatabases, setUserDatabases] = useState(null);
        const [queryElementCounter, setQueryElementCounter] = useState(0);
        const [databaseTableRawHeaders, setDatabaseTableRawHeaders] = useState(
            [],
        );
        const [importModalPixelWidth, setImportModalPixelWidth] =
            useState<string>(IMPORT_MODAL_WIDTHS.small);
        const [hiddenColumnIdsSet, setHiddenColumnIdsSet] = useState(new Set());
        const [databaseTableHeaders, setDatabaseTableHeaders] = useState([]);
        const [selectedDatabaseId, setSelectedDatabaseId] = useState(null);
        const [tableColumnsObject, setTableColumnsObject] = useState({});
        const [databaseTableRows, setDatabaseTableRows] = useState([]);
        const [tableNames, setTableNames] = useState<string[]>([]);
        const [selectedTable, setSelectedTable] = useState(null);
        const importDataSQLStringRef = useRef<string>('');
        const getDatabases = usePixel('META | GetDatabaseList ( ) ;'); // making repeat network calls, move to load data modal open
        const [isDatabaseLoading, setIsDatabaseLoading] =
            useState<boolean>(false);
        const [showTablePreview, setShowTablePreview] =
            useState<boolean>(false);
        const [showEditColumns, setShowEditColumns] = useState<boolean>(true); // ### change back to false
        const [checkAllColumns, setCheckAllColumns] = useState<boolean>(true);
        const { configStore, monolithStore } = useRootStore();

        // State Vars for Old useForm --- all uneeded / deletable
        const [selectedLeftTable, setSelectedLeftTable] =
            useState<string>(null);
        const [selectedRightTable, setSelectedRightTable] =
            useState<string>(null);
        const [selectedRightKey, setSelectedRightKey] = useState<string>(null);
        const [columnDataTypesDict, setColumnDataTypesDict] = useState(null);
        const [selectedLeftKey, setSelectedLeftKey] = useState<string>(null);
        const [tableEdgesObject, setTableEdgesObject] = useState(null);

        // State Vars for new useForm Structure
        // checkedColumnsSet
        const [checkedColumnsSet, setCheckedColumnsSet] = useState(new Set());
        const [hiddenTablesSet, setHiddenTablesSet] = useState({});
        const [aliasesCountObj, setAliasesCountObj] = useState({}); // { emailAlias: 1, phoneAlias: 2 }
        const [tableEdges, setTableEdges] = useState({}); //
        const [rootTable, setRootTable] = useState(null);

        const [checkedColumnsCount, setCheckedColumnsCount] = useState(0);
        const [shownTables, setShownTables] = useState(new Set());

        // track to manage joinable tables

        // endregion

        // region --- Import Data Old useFieldArrays

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

        const {
            fields: tableFields,
            append: appendEditableTableColumns,
            remove: removeEditableTableColumns,
        } = useFieldArray({
            control,
            name: 'tables',
        });

        // endregion

        // region --- Import Data New useFieldArray

        // ### only one field array is necessary?
        // do each of these need a field array for the columns?

        const {
            fields: newTableFields,
            append: newTableAppend,
            remove: newTableRemove,
        } = useFieldArray({
            control: newControl,
            name: 'tables',
        });

        // endregion

        // region --- useEffects

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

        useEffect(() => {
            // if any change occurs with checkboxes reassess all joins to display
            setJoinsStackHandler();
        }, [checkedColumnsCount]);

        // endregion

        // region --- cellTypeOptions unused / remove?
        // const cellTypeOptions = computed(() => {
        //     alert("test23")
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
        // endregion

        /** Create a New Cell and Add to Notebook */
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

        /** Construct a Raw SQL String for Data Import --- remove */
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

        /** Construct Submit Pixel for Data Import --- remove? */
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

        /** Add all the columns from a Table */
        const addAllTableColumnsHandler = (event) => {
            alert('add all');
            // TODO: check all columns from table
        };

        /** New Submit for Import Data --- empty */
        const onImportDataSubmit = (data: NewFormData) => {
            // constructSQLString({ submitData });
            // appendCell('data-import');
            // setIsDataImportModalOpen(false);
            // closeImportModalHandler();
            console.log({ data });
        };

        /** Close and Reset Import Data Form Modal */
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

        /** Get Database Information for Data Import Modal */
        const retrieveDatabaseTablesAndEdges = async (databaseId) => {
            setIsDatabaseLoading(true);
            const pixelString = `META|GetDatabaseTableStructure(database=[ \"${databaseId}\" ]);META|GetDatabaseMetamodel( database=[ \"${databaseId}\" ], options=["dataTypes","positions"]);`;

            // const pixelResponse = await runPixel(pixelString);
            monolithStore.runQuery(pixelString).then((pixelResponse) => {
                console.log({ pixelResponse });
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

                let newTableNames = [];

                // populate database structure
                if (isResponseTableStructureGood) {
                    console.log({ responseTableStructure });
                    newTableNames = [
                        ...responseTableStructure.reduce((set, ele) => {
                            set.add(ele[0]);
                            return set;
                        }, new Set()),
                    ];

                    const tableColumnsObject = responseTableStructure.reduce(
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

                    const newTableColumnsObject: Table[] = Object.keys(
                        tableColumnsObject,
                    ).map((tableName, tableIdx) => ({
                        id: tableIdx,
                        name: tableName,
                        columns: tableColumnsObject[tableName].map(
                            (colObj, colIdx) => ({
                                id: colIdx,
                                tableName: tableName,
                                columnName: colObj.columnName,
                                columnType: colObj.columnType,
                                userAlias: colObj.userAlias,
                                checked: false,
                            }),
                        ),
                    }));

                    newReset({
                        databaseSelect: databaseId,
                        tables: newTableColumnsObject,
                    });
                } else {
                    console.error('Error retrieving database tables');
                }

                // set visible tables set to all tables
                setTableNames(newTableNames);
                setShownTables(new Set(newTableNames));

                // make and populate new edges dict
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

                // store edges in useState
                const edges = pixelResponse.pixelReturn[1].output.edges;
                const newTableEdges = {};
                edges.forEach((edge) => {
                    // add edge from source direction
                    if (newTableEdges[edge.source]) {
                        newTableEdges[edge.source][edge.target] = edge.relation;
                    } else {
                        newTableEdges[edge.source] = {
                            [edge.target]: edge.relation,
                        };
                    }
                    // add edge from target direction
                    if (newTableEdges[edge.target]) {
                        newTableEdges[edge.target][edge.source] = edge.relation;
                    } else {
                        newTableEdges[edge.target] = {
                            [edge.source]: edge.relation,
                        };
                    }
                });
                setTableEdges(newTableEdges);
                setIsDatabaseLoading(false);
            });
        };

        /** Old Get All Database Tables for Import Data --- remove? */
        const retrieveDatabaseTables = async (databaseId) => {
            setIsDatabaseLoading(true);
            const pixelString = `META | GetDatabaseTableStructure ( database = [ \"${databaseId}\" ] ) ;`;

            monolithStore.runQuery(pixelString).then((response) => {
                const type = response.pixelReturn[0].operationType;
                const pixelResponse = response.pixelReturn[0].output;

                if (type.indexOf('ERROR') === -1) {
                    const tableNames = [
                        ...pixelResponse.reduce((set, ele) => {
                            set.add(ele[0]);
                            return set;
                        }, new Set()),
                    ];

                    const newTableColumnsObject = pixelResponse.reduce(
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

                setIsDatabaseLoading(false);
            });
        };

        /** Old Select Tables for Import Data --- remove? */
        const selectTableHandler = (tableName) => {
            setSelectedTable(tableName);
            retrieveTableRows(tableName);
        };

        /** Old Select Tables for Import Data --- unused / remove? */
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

        /** Helper Function Update Alias Tracker Object*/
        const updateAliasCountObj = (
            isBeingAdded,
            newAlias,
            oldAlias = null,
        ) => {
            const newAliasesCountObj = { ...aliasesCountObj };

            console.log({ isBeingAdded, newAlias, oldAlias });

            if (isBeingAdded) {
                if (newAliasesCountObj[newAlias]) {
                    newAliasesCountObj[newAlias] =
                        newAliasesCountObj[newAlias] + 1;
                } else {
                    newAliasesCountObj[newAlias] = 1;
                }
            } else {
                if (newAliasesCountObj[newAlias]) {
                    newAliasesCountObj[newAlias] =
                        newAliasesCountObj[newAlias] - 1;
                } else {
                    newAliasesCountObj[newAlias] = 0;
                }
            }

            if (newAliasesCountObj[newAlias] < 1) {
                delete newAliasesCountObj[newAlias];
            }

            if (oldAlias) {
                if (newAliasesCountObj[oldAlias]) {
                    newAliasesCountObj[oldAlias] =
                        newAliasesCountObj[newAlias] - 1;
                } else {
                    newAliasesCountObj[oldAlias] = 0;
                }
                if (newAliasesCountObj[oldAlias] < 1) {
                    delete newAliasesCountObj[oldAlias];
                }
            }

            console.log({ newAliasesCountObj });
            setAliasesCountObj(newAliasesCountObj);
        };

        /** Find Joinable Tables */
        const findAllJoinableTables = (rootTableName) => {
            const joinableTables = tableEdges[rootTableName]
                ? Object.keys(tableEdges[rootTableName])
                : [];
            console.log({
                rootTableName,
                tableEdges,
                joinableTables,
                'tableEdges[rootTableName]': tableEdges[rootTableName],
            });
            const newShownTables = new Set([...joinableTables, rootTableName]);
            // debugger;
            setShownTables(newShownTables);
        };

        /** Checkbox Handler */
        const checkBoxHandler = (tableIndex, columnIndex) => {
            const columnObject = watchedTables[tableIndex].columns[columnIndex];
            console.log({ columnObject });
            updateAliasCountObj(columnObject?.checked, columnObject.userAlias);
            if (columnObject?.checked) {
                if (checkedColumnsCount == 0) {
                    findAllJoinableTables(watchedTables[tableIndex].name);
                    setRootTable(watchedTables[tableIndex].name);
                }
                setCheckedColumnsCount(checkedColumnsCount + 1);
            } else if (columnObject?.checked == false) {
                if (checkedColumnsCount == 1) {
                    setShownTables(new Set(tableNames));
                    setRootTable(null);
                }
                setCheckedColumnsCount(checkedColumnsCount - 1);
            }
        };

        const checkTableForSelectedColumns = (tableName) => {
            for (let i = 0; i < watchedTables.length; i++) {
                const currTable = watchedTables[i];
                if (currTable.name == tableName) {
                    const currTableColumns = currTable.columns;
                    for (let j = 0; j < currTableColumns.length; j++) {
                        const currColumn = currTableColumns[j];
                        if (currColumn.checked == true) return true;
                    }
                }
            }
            return false;
        };

        const setJoinsStackHandler = () => {
            if (checkedColumnsCount < 2) {
                // do nothing
            } else {
                const leftTable = rootTable;
                const rightTables = Object.entries(tableEdgesObject[rootTable]);

                rightTables.forEach((entry, joinIdx) => {
                    const rightTable = entry[0];
                    const leftKey = entry[1]['sourceColumn'];
                    const rightKey = entry[1]['targetColumn'];
                    console.log({
                        joinIdx,
                        leftTable,
                        rightTable,
                        leftKey,
                        rightKey,
                    });

                    const leftTableContainsCheckedColumns =
                        checkTableForSelectedColumns(leftTable);
                    const rightTableContainsCheckedColumns =
                        checkTableForSelectedColumns(rightTable);

                    if (
                        leftTableContainsCheckedColumns &&
                        rightTableContainsCheckedColumns
                    ) {
                        // alert(`${leftTable} :: ${rightTable} || ${leftKey} :: ${rightKey}`);
                        alert('join being added');
                        setQueryElementCounter(queryElementCounter + 1);
                        appendStack({
                            queryType: `Join`,
                            queryChildren: [],
                        });
                    }
                    // check leftTable and rightTable for checks
                });

                console.log({ leftTable, rightTables, tableEdges });

                removeStack();
                // remove all join stacks?
                // left table will always be the root table
                // get right tables from tableEdges
                // check right tables for checked columns
                // if 1+ are found add append join stack
                // if 0 are found remove specific join stack?

                // Array.from(shownTables).forEach((shownTable: string, shownTableIndex, foo) => {
                //     console.log({ shownTableIndex, shownTable, foo });
                //     if (shownTableIndex == 0) {
                //         const leftTable = shownTable;
                //         const rightTables = Object.entries(tableEdgesObject[leftTable]);
                //         for (const [rightTable, keysObject] of rightTables) {
                //             console.log({ leftTable, rightTable, joinColumn: keysObject["sourceColumn"] })
                //         }
                //     }
                // });
            }
            console.log({ tableEdges, shownTables, tableEdgesObject });
        };

        return (
            <>
                {/* Dropdown for All Add Cell Option Sets */}

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
                                    AddCellOptions[selectedAddCell]?.options ||
                                        [],
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
                                                    setIsDataImportModalOpen(
                                                        true,
                                                    );
                                                    if (
                                                        display ==
                                                        'From Data Catalog'
                                                    ) {
                                                        setImportModalType(
                                                            display,
                                                        );
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
                </Stack>

                {/* New Import Data Modal --- stand-alone component? */}

                <Modal open={isDataImportModalOpen} maxWidth="lg">
                    <Modal.Content sx={{ width: importModalPixelWidth }}>
                        <form onSubmit={newHandleSubmit(onImportDataSubmit)}>
                            {/* Import Data from Database Selector */}
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
                                        control={newControl}
                                        render={({ field }) => (
                                            <Select
                                                onChange={(e) => {
                                                    field.onChange(
                                                        e.target.value,
                                                    );
                                                    setSelectedDatabaseId(
                                                        e.target.value,
                                                    );
                                                    retrieveDatabaseTablesAndEdges(
                                                        e.target.value,
                                                    );
                                                    setShowEditColumns(true);
                                                    setShowTablePreview(false);
                                                    setImportModalPixelWidth(
                                                        IMPORT_MODAL_WIDTHS.medium,
                                                    );
                                                }}
                                                label={'Select Database'}
                                                value={field.value || ''}
                                                size={'small'}
                                                sx={{
                                                    minWidth: '220px',
                                                }}
                                            >
                                                {userDatabases?.map(
                                                    (ele, dbIndex) => (
                                                        <Menu.Item
                                                            value={
                                                                ele.database_id
                                                            }
                                                            key={dbIndex}
                                                        >
                                                            {ele.app_name}
                                                        </Menu.Item>
                                                    ),
                                                )}
                                            </Select>
                                        )}
                                    />
                                </div>
                                <IconButton disabled={true}>
                                    <KeyboardArrowDown />
                                </IconButton>
                            </StyledModalTitleWrapper>
                            {selectedDatabaseId && (
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
                                                disabled={Object.values(
                                                    aliasesCountObj,
                                                ).some(
                                                    (key: number) => key > 1,
                                                )}
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
                                        <StyledTableSetWrapper>
                                            <StyledTableTitle variant="h6">
                                                Available Tables / Columns
                                            </StyledTableTitle>
                                            <ScrollTableSetContainer>
                                                {newTableFields.map(
                                                    (table, tableIndex) => (
                                                        <div
                                                            key={`${table.name}-${tableIndex}`}
                                                        >
                                                            {/* using conditional rendering for each table but if bugs persists set state for showntables in checkbox handler */}
                                                            {shownTables.has(
                                                                table.name,
                                                            ) && (
                                                                <SingleTableWrapper
                                                                    key={`${table.name}-${tableIndex}`}
                                                                >
                                                                    <FlexWrapper>
                                                                        <StyledTableTitleBlueBubble variant="body1">
                                                                            <TableIconButton
                                                                                title={
                                                                                    'Table'
                                                                                }
                                                                                placement="top"
                                                                            >
                                                                                <CalendarViewMonth />
                                                                            </TableIconButton>
                                                                            {
                                                                                table.name
                                                                            }
                                                                        </StyledTableTitleBlueBubble>
                                                                    </FlexWrapper>
                                                                    <Table size="small">
                                                                        <Table.Body>
                                                                            <Table.Row>
                                                                                <Table.Cell>
                                                                                    <CheckAllIconButton
                                                                                        onClick={
                                                                                            addAllTableColumnsHandler
                                                                                        }
                                                                                        color="primary"
                                                                                    >
                                                                                        <AddBox />
                                                                                    </CheckAllIconButton>
                                                                                </Table.Cell>
                                                                                <Table.Cell>
                                                                                    <ColumnNameText variant="body1">
                                                                                        Fields
                                                                                    </ColumnNameText>
                                                                                </Table.Cell>
                                                                                <Table.Cell>
                                                                                    <ColumnNameText variant="body1">
                                                                                        Alias
                                                                                    </ColumnNameText>
                                                                                </Table.Cell>
                                                                                <Table.Cell>
                                                                                    <ColumnNameText variant="body1">
                                                                                        Field
                                                                                        Type
                                                                                    </ColumnNameText>
                                                                                </Table.Cell>
                                                                            </Table.Row>

                                                                            {table.columns.map(
                                                                                (
                                                                                    column,
                                                                                    columnIndex,
                                                                                ) => (
                                                                                    <Table.Row
                                                                                        key={`${column.columnName}-${columnIndex}`}
                                                                                    >
                                                                                        <Table.Cell>
                                                                                            <Controller
                                                                                                name={`tables.${tableIndex}.columns.${columnIndex}.checked`}
                                                                                                control={
                                                                                                    newControl
                                                                                                }
                                                                                                render={({
                                                                                                    field,
                                                                                                }) => (
                                                                                                    <Checkbox
                                                                                                        checked={
                                                                                                            field.value
                                                                                                        }
                                                                                                        id={`checkbox-${column.columnName}-${columnIndex}`}
                                                                                                        onChange={(
                                                                                                            e,
                                                                                                        ) => {
                                                                                                            field.onChange(
                                                                                                                e,
                                                                                                            );
                                                                                                            checkBoxHandler(
                                                                                                                tableIndex,
                                                                                                                columnIndex,
                                                                                                            );
                                                                                                        }}
                                                                                                    />
                                                                                                )}
                                                                                            />
                                                                                        </Table.Cell>
                                                                                        <Table.Cell>
                                                                                            {
                                                                                                column.columnName
                                                                                            }
                                                                                            {column.columnName ==
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
                                                                                            {column.columnName.includes(
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
                                                                                            <FlexTableCell>
                                                                                                <Controller
                                                                                                    name={`tables.${tableIndex}.columns.${columnIndex}.userAlias`}
                                                                                                    control={
                                                                                                        newControl
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
                                                                                                                if (
                                                                                                                    watchedTables[
                                                                                                                        tableIndex
                                                                                                                    ]
                                                                                                                        .columns[
                                                                                                                        columnIndex
                                                                                                                    ]
                                                                                                                        .checked
                                                                                                                ) {
                                                                                                                    updateAliasCountObj(
                                                                                                                        true,
                                                                                                                        e
                                                                                                                            .target
                                                                                                                            .value,
                                                                                                                        field.value,
                                                                                                                    );
                                                                                                                }
                                                                                                                field.onChange(
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value,
                                                                                                                );
                                                                                                            }}
                                                                                                        />
                                                                                                    )}
                                                                                                />
                                                                                                {watchedTables[
                                                                                                    tableIndex
                                                                                                ]
                                                                                                    .columns[
                                                                                                    columnIndex
                                                                                                ]
                                                                                                    .checked &&
                                                                                                    aliasesCountObj[
                                                                                                        watchedTables[
                                                                                                            tableIndex
                                                                                                        ]
                                                                                                            .columns[
                                                                                                            columnIndex
                                                                                                        ]
                                                                                                            .userAlias
                                                                                                    ] >
                                                                                                        1 && (
                                                                                                        <AliasWarningIcon title="Duplicate Alias Name">
                                                                                                            <Warning />
                                                                                                        </AliasWarningIcon>
                                                                                                    )}
                                                                                            </FlexTableCell>
                                                                                        </Table.Cell>

                                                                                        <Table.Cell>
                                                                                            <Controller
                                                                                                name={`tables.${tableIndex}.columns.${columnIndex}.columnType`}
                                                                                                control={
                                                                                                    newControl
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
                                                                                                            ''
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
                                                                </SingleTableWrapper>
                                                            )}
                                                        </div>
                                                    ),
                                                )}

                                                {/* <SingleTableWrapper>
                                                <StyledTableTitleBlueBubble variant='body1'>
                                                    Table B
                                                </StyledTableTitleBlueBubble>
                                                <Table size="small">
                                                    <Table.Body>
                                                        <Table.Row>
                                                            <Table.Cell>Column 1</Table.Cell>
                                                            <Table.Cell>Column 2</Table.Cell>
                                                            <Table.Cell>Column 3</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Row 1</Table.Cell>
                                                            <Table.Cell>Row 2</Table.Cell>
                                                            <Table.Cell>Row 3</Table.Cell>
                                                        </Table.Row>
                                                    </Table.Body>
                                                </Table>
                                            </SingleTableWrapper> */}

                                                {/* <SingleTableWrapper>
                                                <StyledTableTitleBlueBubble variant='body1'>
                                                    Table C
                                                </StyledTableTitleBlueBubble>
                                                <Table size="small">
                                                    <Table.Body>
                                                        <Table.Row>
                                                            <Table.Cell>Column 1</Table.Cell>
                                                            <Table.Cell>Column 2</Table.Cell>
                                                            <Table.Cell>Column 3</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Row 1</Table.Cell>
                                                            <Table.Cell>Row 2</Table.Cell>
                                                            <Table.Cell>Row 3</Table.Cell>
                                                        </Table.Row>
                                                    </Table.Body>
                                                </Table>
                                            </SingleTableWrapper> */}
                                            </ScrollTableSetContainer>
                                        </StyledTableSetWrapper>
                                    )}

                                    {/* {showEditColumns && ( */}
                                    {/* old edit columns */}
                                    {false && (
                                        <StyledTableSetWrapper>
                                            <StyledTableTitle variant="h6">
                                                Edit Columns
                                            </StyledTableTitle>
                                            <ScrollTableSetContainer>
                                                <Table
                                                    stickyHeader
                                                    size={'small'}
                                                >
                                                    {/* table header with uncontrolled checkbox for all */}
                                                    <Table.Body>
                                                        {/* Column Headers */}
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
                                                                    key={
                                                                        field.id
                                                                    }
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
                                            </ScrollTableSetContainer>
                                            <Modal.Actions
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
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
                                        </StyledTableSetWrapper>
                                    )}

                                    {showTablePreview && (
                                        <StyledTableSetWrapper>
                                            <StyledTableTitle variant="h6">
                                                Preview
                                            </StyledTableTitle>
                                            <ScrollTableSetContainer>
                                                <Table
                                                    stickyHeader
                                                    size={'small'}
                                                >
                                                    <Table.Body>
                                                        <Table.Row>
                                                            {databaseTableHeaders
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
                                                                        h,
                                                                        hIdx,
                                                                    ) => (
                                                                        <Table.Cell
                                                                            key={
                                                                                hIdx
                                                                            }
                                                                        >
                                                                            <strong>
                                                                                {
                                                                                    h
                                                                                }
                                                                            </strong>
                                                                        </Table.Cell>
                                                                    ),
                                                                )}
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
                                            </ScrollTableSetContainer>
                                        </StyledTableSetWrapper>
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

                                            {/* <Button
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
                                            </Button> */}
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
                                        !selectedDatabaseId
                                        // !selectedDatabaseId ||
                                        // !selectedTable ||
                                        // !(
                                        //     tableEdgesObject[selectedTable] &&
                                        //     Object.values(
                                        //         tableEdgesObject[selectedTable],
                                        //     ).length
                                        // )
                                    }
                                    onClick={() => {
                                        alert('join button clicked');
                                        setQueryElementCounter(
                                            queryElementCounter + 1,
                                        );
                                        console.log({
                                            selectedDatabaseId,
                                            selectedTable,
                                        });
                                        setImportModalPixelWidth(
                                            IMPORT_MODAL_WIDTHS.large,
                                        );
                                        appendStack({
                                            queryType: `Join`,
                                            queryChildren: [],
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
                                            queryType: `Calculate  ${queryElementCounter}`,
                                            queryChildren: [],
                                        });
                                    }}
                                >
                                    Calculate
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
                                    disabled={Object.values(
                                        aliasesCountObj,
                                    ).some((key: number) => key > 1)}
                                >
                                    Import
                                </Button>
                            </Modal.Actions>
                        </form>
                    </Modal.Content>
                </Modal>
            </>
        );
    },
);
