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

import { DataImportFormModal } from './DataImportFormModal';

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
    marginTop: '25px',
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
    backgroundColor: theme.palette.primary.selected,
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

const StyledJoinDiv = styled('div')(({ theme }) => ({
    border: 'none',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    color: 'black',
    cursor: 'default',
    backgroundColor: theme.palette.primary.selected,
}));

const StyledJoinTypography = styled(Typography)(({ theme }) => ({
    marginLeft: '12.5px',
    marginRight: '12.5px',
    color: theme.palette.secondary.dark,
    cursor: 'default',
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

type JoinElement = {
    leftTable: string;
    rightTable: string;
    joinType: string;
    leftKey: string;
    rightKey: string;
};

type FormValues = {
    queryStackElements: QueryStackElement[];
    joinElements: JoinElement[];
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
    joins: JoinElement[];
    // filters: FilterElement[];
    // summaries: SummaryElement[];
    // calculations: CalculationElement[];
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
        const [showPreview, setShowTablePreview] = useState<boolean>(false);
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
        const [selectedTableNames, setSelectedTableNames] = useState(new Set());
        const [joinsSet, setJoinsSet] = useState(new Set()); // Set({ "USERS_TABLE:VISNS_TABLE" })

        const [pixelString, setPixelString] = useState('');
        const pixelStringRef = useRef<string>('');
        const pixelStringRefPart1 = useRef<string>('');

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

        const {
            fields: joinElements,
            append: appendJoinElement,
            remove: removeJoinElement,
        } = useFieldArray({
            control: newControl,
            name: 'joins',
        });

        // endregion

        // region --- useEffects

        useEffect(() => {
            console.log({ joinElements });
        }, [joinElements]);

        useEffect(() => {
            setSelectedLeftKey(null);
            setSelectedRightKey(null);
            removeEditableColumns();
            removeStack();
        }, [selectedDatabaseId, selectedTable]);

        useEffect(() => {
            removeEditableColumns();
            removeStack();
            setShowTablePreview(false);
            setShowEditColumns(true);
        }, [selectedDatabaseId]);

        useEffect(() => {
            removeEditableColumns();
            tableColumnsObject[selectedTable]?.forEach((tableObject, idx) => {
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
            updateSelectedTables();
        }, [checkedColumnsCount]);

        useEffect(() => {
            if (showPreview) {
                retrievePreviewData();
            }
        }, [
            aliasesCountObj,
            checkedColumnsCount,
            showPreview,
            selectedDatabaseId,
        ]);

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
                        // selectQuery: importDataSQLStringRef.current, // construct query based on useForm inputs
                        // selectQuery: pixelStringRef.current, // construct query based on useForm inputs
                        selectQuery: pixelStringRefPart1.current, // construct query based on useForm inputs
                        joins: joinElements,
                        tableNames: Array.from(selectedTableNames),
                        selectedColumns: getSelectedColumnNames(),
                        columnAliases: getColumnAliases(),
                        rootTable: rootTable,
                        // filters: filters,
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
        // const constructSQLString = ({ submitData }) => {
        //     console.log({ submitData });
        //     let newSQLString = 'SELECT ';

        //     newSQLString += submitData.columns
        //         .filter((ele) => ele.checked)
        //         .map((colObj) => {
        //             if (colObj.columnName === colObj.userAlias) {
        //                 return colObj.columnName;
        //             } else {
        //                 return `${colObj.columnName} AS \"${colObj.userAlias}\"`;
        //             }
        //         })
        //         .join(', ');

        //     newSQLString += ` FROM ${submitData.tableSelect}`;
        //     newSQLString += ';';

        //     if (
        //         selectedLeftTable &&
        //         selectedRightTable &&
        //         selectedLeftKey &&
        //         selectedRightKey
        //     ) {
        //         newSQLString = `SELECT ${'*'} FROM ${selectedLeftTable} INNER JOIN ${selectedRightTable} ON ${selectedLeftTable}.${selectedLeftKey}=${selectedRightTable}.${selectedRightKey};`;
        //     }

        //     importDataSQLStringRef.current = newSQLString;
        // };

        /** Construct Submit Pixel for Data Import --- remove? */
        // const constructDataBasePixel = ({ submitData }) => {
        //     // mimic this pixel structure instead of constructing raw SQL ?
        //     // or have join autoselect keys and add columns to edit
        //     // that makes sense with new pixel structure
        //     // show all tables and selectable rows in edit columns view
        //     // find way of showing alerts for un joinable columns
        //     // add form structure to json state (?)
        //     // make basic non SQL view for notebook cell
        //     // make edit window

        //     // "pixelExpression": "Database ( database = [ \"f9b656cc-06e7-4cce-bae8-b5f92075b6da\" ] ) |

        //     // Select (
        //     //     STATION_SETTINGS__ROLE ,
        //     //     USER_SETTINGS__DATE_CREATED ,
        //     //     VISN_SETTINGS__EMAIL ,
        //     //     VISN_SETTINGS__USER ,
        //     //     VISN_SETTINGS__VISN )
        //     // .as ( [
        //     //     ROLE ,
        //     //     DATE_CREATED ,
        //     //     EMAIL ,
        //     //     USER ,
        //     //     VISN
        //     // ] ) |

        //     // Join ( (
        //     //     USER_SETTINGS ,
        //     //     inner.join ,
        //     //     STATION_SETTINGS
        //     // ) , (
        //     //     USER_SETTINGS ,
        //     //     inner.join ,
        //     //     VISN_SETTINGS
        //     // ) ) |

        //     // Distinct ( false ) |

        //     // QueryRowCount ( ) ;",
        //     console.log({ submitData });
        //     let newSQLString = 'SELECT ';

        //     newSQLString += submitData.columns
        //         .filter((ele) => ele.checked)
        //         .map((colObj) => {
        //             if (colObj.columnName === colObj.userAlias) {
        //                 return colObj.columnName;
        //             } else {
        //                 return `${colObj.columnName} AS \"${colObj.userAlias}\"`;
        //             }
        //         })
        //         .join(', ');

        //     newSQLString += ` FROM ${submitData.tableSelect}`;
        //     newSQLString += ';';

        //     if (
        //         selectedLeftTable &&
        //         selectedRightTable &&
        //         selectedLeftKey &&
        //         selectedRightKey
        //     ) {
        //         newSQLString = `SELECT ${'*'} FROM ${selectedLeftTable} INNER JOIN ${selectedRightTable} ON ${selectedLeftTable}.${selectedLeftKey}=${selectedRightTable}.${selectedRightKey};`;
        //     }

        //     importDataSQLStringRef.current = newSQLString;
        // };

        /** Add all the columns from a Table */
        const addAllTableColumnsHandler = (event) => {
            alert('add all');
            // TODO: check all columns from table
        };

        /** New Submit for Import Data --- empty */
        const onImportDataSubmit = (data: NewFormData) => {
            // constructSQLString({ submitData });
            retrievePreviewData();
            appendCell('data-import');
            setIsDataImportModalOpen(false);
            // closeImportModalHandler();
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

        const updateSelectedTables = () => {
            // const databaseId = selectedDatabaseId;
            const pixelTables = new Set();
            const pixelColumnNames = [];
            const pixelColumnAliases = [];
            // const pixelJoins = [];

            watchedTables?.forEach((tableObject) => {
                const currTableName = tableObject.name;
                const currTableColumns = tableObject.columns;

                currTableColumns.forEach((columnObject) => {
                    if (columnObject.checked) {
                        pixelTables.add(columnObject.tableName);
                        pixelColumnNames.push(
                            `${columnObject.tableName}__${columnObject.columnName}`,
                        );
                        pixelColumnAliases.push(columnObject.userAlias);
                    }
                });
            });

            setSelectedTableNames(pixelTables);
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

        const getSelectedColumnNames = () => {
            const pixelTables = new Set();
            const pixelColumnNames = [];

            watchedTables.forEach((tableObject) => {
                const currTableColumns = tableObject.columns;

                currTableColumns.forEach((columnObject) => {
                    if (columnObject.checked) {
                        pixelTables.add(columnObject.tableName);
                        pixelColumnNames.push(
                            `${columnObject.tableName}__${columnObject.columnName}`,
                        );
                    }
                });
            });

            return pixelColumnNames;
        };

        const getColumnAliases = () => {
            const pixelTables = new Set();
            const pixelColumnAliases = [];

            watchedTables.forEach((tableObject) => {
                const currTableColumns = tableObject.columns;

                currTableColumns.forEach((columnObject) => {
                    if (columnObject.checked) {
                        pixelTables.add(columnObject.tableName);
                        pixelColumnAliases.push(columnObject.userAlias);
                    }
                });
            });

            return pixelColumnAliases;
        };

        const retrievePreviewData = async () => {
            setIsDatabaseLoading(true);

            // run database rows reactor
            const databaseId = selectedDatabaseId;
            const pixelTables = new Set();
            const pixelColumnNames = getSelectedColumnNames();
            const pixelColumnAliases = getColumnAliases();
            // const pixelColumnNames = [];
            // const pixelColumnAliases = [];
            const pixelJoins = [];

            // watchedTables.forEach((tableObject) => {
            //     const currTableName = tableObject.name;
            //     const currTableColumns = tableObject.columns;

            //     currTableColumns.forEach((columnObject) => {
            //         if (columnObject.checked) {
            //             pixelTables.add(columnObject.tableName);
            //             pixelColumnNames.push(
            //                 `${columnObject.tableName}__${columnObject.columnName}`,
            //             );
            //             pixelColumnAliases.push(columnObject.userAlias);
            //         }
            //     });
            // });

            Array.from(joinsSet).forEach((joinEle: string) => {
                console.log({ joinEle });
                const splitJoinsString = joinEle.split(':');
                pixelJoins.push(
                    `( ${splitJoinsString[0]} , inner.join , ${splitJoinsString[1]} )`,
                );
            });

            // when constructing final pixel string seperate all these with '|'
            let pixelStringPart1 = `Database ( database = [ \"${databaseId}\" ] )`;
            pixelStringPart1 += ` | Select ( ${pixelColumnNames.join(' , ')} )`;
            pixelStringPart1 += `.as ( [ ${pixelColumnAliases.join(' , ')} ] )`;
            if (pixelJoins.length > 0) {
                pixelStringPart1 += ` | Join ( ${pixelJoins.join(' , ')} ) `;
            }
            pixelStringPart1 += ` | Distinct ( false ) | Limit ( 20 )`;

            // seperated Import out so frame can construct this independently from preview
            const pixelStringPart2 = ` | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ \"consolidated_settings_FRAME932867__Preview\" ] ) ] )`;
            const pixelStringPart3 = ` ; META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

            const combinedPixelString =
                pixelStringPart1 + pixelStringPart2 + ' ; ' + pixelStringPart3;

            // const joinsPixelString = pixelJoins.length > 0 ? `Join ( ${pixelJoins.join(' , ')} ) ` : null;
            // const distinctPixelString = `Distinct ( false ) | Limit ( 20 )`;
            // const importPixelString = `Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ \"consolidated_settings_FRAME932867__Preview\" ] ) ] )`;
            // // when constructing string seperate META with ';'
            // const metaPixelString = `META | Frame() | QueryAll() | Limit(50) | Collect(500)`
            // // add ';' at end of final pixel string

            // const pixelStringObject = {
            //     databasePixelString,
            //     selectPixelString,
            //     aliasPixelString,
            //     joinsPixelString,
            //     distinctPixelString,
            //     limitPixelString,
            //     importPixelString,
            //     metaPixelString,
            // }

            const combinedJoinString =
                pixelJoins.length > 0
                    ? `| Join ( ${pixelJoins.join(' , ')} ) `
                    : '';

            // const testReactorPixel =
            //     'Database ( database = [ "f9b656cc-06e7-4cce-bae8-b5f92075b6da" ] ) | Select ( STATION_SETTINGS__EMAIL , USER_SETTINGS__PHONE ) .as ( [ EMAIL , PHONE ] ) | Join ( ( USER_SETTINGS , inner.join , STATION_SETTINGS ) ) | Distinct ( false ) | Limit ( 20 ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "consolidated_settings_FRAME932867__Preview" ] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);';
            const reactorPixel = `Database ( database = [ \"${databaseId}\" ] ) | Select ( ${pixelColumnNames.join(
                ' , ',
            )} ) .as ( [ ${pixelColumnAliases.join(
                ' , ',
                // )} ] ) ${combinedJoinString}| Distinct ( false ) | Limit ( 20 ) | `; // end of reactor string is added in cell-defaults/data-import/config.ts to incorporate correct frame variable name
            )} ] ) ${combinedJoinString}| Distinct ( false ) | Limit ( 20 ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ \"consolidated_settings_FRAME932867__Preview\" ] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);`;
            // )} ] ) ${combinedJoinString}| Distinct ( false ) | Limit ( 20 );  META | Frame() | QueryAll() | Limit(50) | Collect(500);`;
            // ## TODO fix variable import pixel syntax, currently including db name for some reason

            // these might not be needed with new part1 ref
            setPixelString(reactorPixel);
            pixelStringRef.current = reactorPixel;

            // this ref is for the form submit
            pixelStringRefPart1.current = pixelStringPart1 + ';';

            await monolithStore.runQuery(reactorPixel).then((response) => {
                const type = response.pixelReturn[0]?.operationType;
                const tableHeadersData =
                    response.pixelReturn[1]?.output?.data?.headers;
                const tableRawHeadersData =
                    response.pixelReturn[1]?.output?.data?.rawHeaders;
                const tableRowsData =
                    response.pixelReturn[1]?.output?.data?.values;

                setDatabaseTableHeaders(tableHeadersData);
                setDatabaseTableRawHeaders(tableRawHeadersData);
                setDatabaseTableRows(tableRowsData);

                if (type.indexOf('ERROR') != -1) {
                    console.error('Error retrieving database tables');
                }

                setIsDatabaseLoading(false);
            });
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
                removeJoinElement();
                setJoinsSet(new Set());
            } else {
                const leftTable = rootTable;
                const rightTables =
                    tableEdgesObject[rootTable] &&
                    tableEdgesObject &&
                    Object.entries(tableEdgesObject[rootTable]);

                // addresses crash for dbs with only one table / no edges
                rightTables?.forEach((entry, joinIdx) => {
                    const rightTable = entry[0];
                    const leftKey = entry[1]['sourceColumn'];
                    const rightKey = entry[1]['targetColumn'];

                    const leftTableContainsCheckedColumns =
                        checkTableForSelectedColumns(leftTable);
                    const rightTableContainsCheckedColumns =
                        checkTableForSelectedColumns(rightTable);

                    const defaultJoinType = 'Inner Join';

                    const joinsSetString = `${leftTable}:${rightTable}`;
                    if (
                        leftTableContainsCheckedColumns &&
                        rightTableContainsCheckedColumns &&
                        joinsSet.has(joinsSetString) == false
                    ) {
                        appendJoinElement({
                            leftTable: leftTable,
                            rightTable: rightTable,
                            joinType: defaultJoinType,
                            leftKey: leftKey,
                            rightKey: rightKey,
                        });
                        addToJoinsSetHelper(joinsSetString);
                    } else if (
                        leftTableContainsCheckedColumns == false ||
                        (rightTableContainsCheckedColumns == false &&
                            joinsSet.has(joinsSetString))
                    ) {
                        joinsSet.delete(joinsSetString);
                        joinElements.some((ele, idx) => {
                            if (
                                leftTable == ele.leftTable &&
                                rightTable == ele.rightTable &&
                                defaultJoinType == ele.joinType &&
                                leftKey == ele.leftKey &&
                                rightKey == ele.rightKey
                            ) {
                                removeJoinElement(idx);
                                return true;
                            } else {
                                return false;
                            }
                        });
                    }
                });
            }
        };

        const addToJoinsSetHelper = (newJoinSet) => {
            const joinsSetCopy = new Set(joinsSet);
            joinsSetCopy.add(newJoinSet);
            setJoinsSet(joinsSetCopy);
            console.log({ joinsSetCopy });
        };

        return (
            <>
                {/* Dropdown for All Add Cell Option Sets */}

                <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <StyledDivider />
                    <StyledBorderDiv>
                        {AddCellOptions &&
                            Object.entries(AddCellOptions).map((add, i) => {
                                const value = add[1];
                                return (
                                    <StyledButton
                                        key={i}
                                        title={`${value.display}`}
                                        variant="contained"
                                        size="small"
                                        disabled={
                                            query.isLoading || value.disabled
                                        }
                                        startIcon={value.icon}
                                        onClick={(e) => {
                                            if (value.options) {
                                                setAnchorEl(e.currentTarget);
                                                setSelectedAddCell(add[0]);
                                            } else {
                                                appendCell(
                                                    value.defaultCellType,
                                                );
                                            }
                                        }}
                                        endIcon={
                                            Array.isArray(value.options) &&
                                            (selectedAddCell == add[0] &&
                                            open ? (
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

                {isDataImportModalOpen && (
                    <DataImportFormModal
                        // isDataImportModalOpen={isDataImportModalOpen}
                        setIsDataImportModalOpen={setIsDataImportModalOpen}
                        query={query}
                        previousCellId={previousCellId}
                        cell={null}
                        editMode={false}
                    />
                )}
            </>
        );
    },
);
