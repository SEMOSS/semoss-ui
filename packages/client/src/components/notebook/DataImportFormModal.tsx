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
    useNotification,
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
    JoinRight,
    JoinLeft,
    JoinFull,
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
import { debug } from 'console';

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

type NewFormValues = {
    databaseSelect: string;
    tables: Table[];
    joins: JoinElement[];
};

// endregion

// region --- Transformations / Options / Constants

const IMPORT_MODAL_WIDTHS = {
    small: '600px',
    medium: '1150px',
    large: '1150px',
};

const SQL_COLUMN_TYPES = ['DATE', 'NUMBER', 'STRING', 'TIMESTAMP'];

const JOIN_ICONS = {
    inner: <JoinInner />,
    'right.outer': <JoinRight />,
    'left.outer': <JoinLeft />,
    outer: <JoinFull />,
};

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
        // options: Transformations,
        options: [],
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

// endregion

export const DataImportFormModal = observer(
    (props: {
        query?: QueryState;
        previousCellId?: string;
        editMode?: boolean;
        setIsDataImportModalOpen?;
        cell?;
    }): JSX.Element => {
        const {
            query,
            previousCellId,
            setIsDataImportModalOpen,
            editMode,
            cell,
        } = props;
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        // const [selectedAddCell, setSelectedAddCell] = useState<string>('');
        // const [importModalType, setImportModalType] = useState<string>('');

        const open = Boolean(anchorEl);
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
            setValue: newSetValue,
            watch: dataImportwatch,
        } = useForm<NewFormValues>();

        const watchedTables = dataImportwatch('tables');
        const watchedJoins = dataImportwatch('joins');

        // region --- useStates / useRefs

        const [userDatabases, setUserDatabases] = useState(null);
        const [queryElementCounter, setQueryElementCounter] = useState(0);
        const [importModalPixelWidth, setImportModalPixelWidth] =
            useState<string>(IMPORT_MODAL_WIDTHS.small);
        const [databaseTableHeaders, setDatabaseTableHeaders] = useState([]);
        const [selectedDatabaseId, setSelectedDatabaseId] = useState(
            cell ? cell.parameters.databaseId : null,
        );
        const [databaseTableRows, setDatabaseTableRows] = useState([]);
        const [tableNames, setTableNames] = useState<string[]>([]);
        const getDatabases = usePixel('META | GetDatabaseList ( ) ;'); // making repeat network calls, move to load data modal open
        const [isDatabaseLoading, setIsDatabaseLoading] =
            useState<boolean>(false);
        const [showPreview, setShowTablePreview] = useState<boolean>(false);
        const [showEditColumns, setShowEditColumns] = useState<boolean>(true);
        const { monolithStore } = useRootStore();
        const [tableEdgesObject, setTableEdgesObject] = useState(null);
        const [aliasesCountObj, setAliasesCountObj] = useState({});
        const aliasesCountObjRef = useRef({});
        const [tableEdges, setTableEdges] = useState({}); //
        const [rootTable, setRootTable] = useState(
            cell ? cell.parameters.rootTable : null,
        );

        const [checkedColumnsCount, setCheckedColumnsCount] = useState(0);
        const [shownTables, setShownTables] = useState(new Set());
        const [selectedTableNames, setSelectedTableNames] = useState(new Set());
        const [joinsSet, setJoinsSet] = useState(new Set());

        const [pixelString, setPixelString] = useState('');
        const pixelStringRef = useRef<string>('');
        const pixelStringRefPart1 = useRef<string>('');

        const [isInitLoadComplete, setIsInitLoadComplete] = useState(false);
        const [initEditPrepopulateComplete, setInitEditPrepopulateComplete] =
            useState(editMode ? false : true);

        const [isJoinSelectOpen, setIsJoinSelectOpen] = useState(false);

        // endregion

        // region --- Import Data Old useFieldArrays

        const {
            fields: _stackFields,
            append: appendStack,
            remove: removeStack,
        } = useFieldArray({
            control,
            name: 'queryStackElements',
        });

        const {
            fields: _editableColumnFields,
            append: appendEditableColumns,
            remove: removeEditableColumns,
        } = useFieldArray({
            control,
            name: 'columns',
        });

        const {
            fields: _tableFields,
            append: _appendEditableTableColumns,
            remove: _removeEditableTableColumns,
        } = useFieldArray({
            control,
            name: 'tables',
        });

        // endregion

        // region --- Import Data New useFieldArray

        const {
            fields: newTableFields,
            append: _newTableAppend,
            remove: _newTableRemove,
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

        const notification = useNotification();

        // endregion

        // region --- useEffects

        useEffect(() => {
            if (editMode)
                retrieveDatabaseTablesAndEdges(cell.parameters.databaseId);
        }, []);

        useEffect(() => {
            removeEditableColumns();
            removeStack();
        }, [selectedDatabaseId]);

        useEffect(() => {
            removeEditableColumns();
            removeStack();
            setShowTablePreview(false);
            setShowEditColumns(true);
        }, [selectedDatabaseId]);

        useEffect(() => {
            if (
                editMode &&
                checkedColumnsCount == 0 &&
                cell.parameters.databaseId == selectedDatabaseId &&
                newTableFields.length &&
                !initEditPrepopulateComplete
            ) {
                prepoulateFormForEdit(cell);
            }
        }, [newTableFields]);

        useEffect(() => {
            if (getDatabases.status !== 'SUCCESS') {
                return;
            }
            setUserDatabases(getDatabases.data);
        }, [getDatabases.status, getDatabases.data]);

        useEffect(() => {
            if (!editMode || initEditPrepopulateComplete) {
                setJoinsStackHandler();
                updateSelectedTables();
            }
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

        /** Create a New Cell and Add to Notebook */
        const appendCell = (widget: string) => {
            console.log({
                previousCellId,
                widget,
                DefaultCells,
            });
            try {
                const newCellId = `${Math.floor(Math.random() * 100000)}`;

                const config: NewCellAction['payload']['config'] = {
                    widget: DefaultCells[widget].widget,
                    parameters: DefaultCells[widget].parameters,
                };

                if (widget === DataImportCellConfig.widget) {
                    alert('test555');
                    console.log({
                        'pixelStringRefPart1.current':
                            pixelStringRefPart1.current,
                        [`FRAME_${newCellId}`]: `FRAME_${newCellId}`,
                    });

                    config.parameters = {
                        ...DefaultCells[widget].parameters,
                        frameVariableName: `FRAME_${newCellId}`,
                        databaseId: selectedDatabaseId,
                        selectQuery: pixelStringRefPart1.current, // construct query based on useForm inputs
                        joins: watchedJoins,
                        tableNames: Array.from(selectedTableNames),
                        selectedColumns: getSelectedColumnNames(),
                        columnAliases: getColumnAliases(),
                        rootTable: rootTable,
                        // filters: filters,
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

        /** Add all the columns from a Table */
        const addAllTableColumnsHandler = (event) => {
            // TODO: check all columns from table
        };

        const updateSubmitDispatches = () => {
            const currTableNamesSet = retrieveSelectedTableNames();
            const currTableNames = Array.from(currTableNamesSet);

            const currSelectedColumns = retrieveSelectedColumnNames();
            const currColumnAliases = retrieveColumnAliasNames();

            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.tableNames',
                    value: currTableNames,
                },
            });

            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.selectedColumns',
                    value: currSelectedColumns,
                },
            });

            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.columnAliases',
                    value: currColumnAliases,
                },
            });

            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.joins',
                    value: joinElements,
                },
            });

            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.rootTable',
                    value: rootTable,
                },
            });

            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.selectQuery',
                    value: pixelStringRefPart1.current,
                },
            });

            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.databaseId',
                    value: selectedDatabaseId,
                },
            });

            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.joins',
                    value: watchedJoins,
                },
            });
        };

        /** New Submit for Import Data --- empty */
        const onImportDataSubmit = (data: NewFormData) => {
            if (editMode) {
                retrievePreviewData();
                updateSubmitDispatches();
            } else {
                retrievePreviewData();
                appendCell('data-import');
            }

            closeImportModalHandler();
            setIsDataImportModalOpen(false);
        };

        /** Close and Reset Import Data Form Modal */
        const closeImportModalHandler = () => {
            // setImportModalPixelWidth(IMPORT_MODAL_WIDTHS.small);
            // setHiddenColumnIdsSet(new Set());
            setIsDataImportModalOpen(false);
            // setDatabaseTableHeaders([]);
            // setSelectedDatabaseId(null);
            // setShowTablePreview(false);
            // setTableColumnsObject({});
            // setDatabaseTableRows([]);
            // setSelectedTable(null);
            // setTableNames([]);
            // reset();
        };

        /** Get Database Information for Data Import Modal */
        const retrieveDatabaseTablesAndEdges = async (databaseId) => {
            setIsDatabaseLoading(true);
            const pixelString = `META|GetDatabaseTableStructure(database=[ \"${databaseId}\" ]);META|GetDatabaseMetamodel( database=[ \"${databaseId}\" ], options=["dataTypes","positions"]);`;

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

                let newTableNames = [];

                if (isResponseTableStructureGood) {
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
                                userAlias: columnName,
                                checked: true,
                            });

                            return acc;
                        },
                        {},
                    );

                    const newTableColumnsObject: Table[] = tableColumnsObject
                        ? Object.keys(tableColumnsObject).map(
                              (tableName, tableIdx) => ({
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
                              }),
                          )
                        : [];

                    newReset({
                        databaseSelect: databaseId,
                        tables: newTableColumnsObject,
                    });
                } else {
                    console.error('Error retrieving database tables');
                    notification.add({
                        color: 'error',
                        message: `Error retrieving database tables`,
                    });
                }

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
                    notification.add({
                        color: 'error',
                        message: `Error retrieving database tables`,
                    });
                }

                const edges = pixelResponse.pixelReturn[1].output.edges;
                const newTableEdges = {};
                edges.forEach((edge) => {
                    if (newTableEdges[edge.source]) {
                        newTableEdges[edge.source][edge.target] = edge.relation;
                    } else {
                        newTableEdges[edge.source] = {
                            [edge.target]: edge.relation,
                        };
                    }
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
                setImportModalPixelWidth(IMPORT_MODAL_WIDTHS.large);

                setTableNames(newTableNames);

                // shown tables filtered only on init load of edit mode
                if (editMode && !isInitLoadComplete) {
                    const newEdges = [
                        rootTable,
                        ...(newTableEdges[rootTable]
                            ? Object.keys(newTableEdges[rootTable])
                            : []),
                    ];
                    setShownTables(new Set(newEdges));
                } else {
                    setShownTables(new Set(newTableNames));
                }

                if (!editMode || isInitLoadComplete) {
                    setAliasesCountObj({});
                    aliasesCountObjRef.current = {};
                    removeJoinElement();
                    setJoinsSet(new Set());
                }
            });

            setAliasesCountObj({});
            aliasesCountObjRef.current = {};
            removeJoinElement();
            setIsInitLoadComplete(true);
        };

        const retrieveColumnAliasNames = () => {
            const pixelTables = new Set();
            const pixelColumnNames = [];
            const pixelColumnAliases = [];

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

            return pixelColumnAliases;
        };

        const retrieveSelectedColumnNames = () => {
            const pixelTables = new Set();
            const pixelColumnNames = [];
            const pixelColumnAliases = [];

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

            return pixelColumnNames;
        };

        const retrieveSelectedTableNames = () => {
            const pixelTables = new Set();
            const pixelColumnNames = [];
            const pixelColumnAliases = [];

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

            return pixelTables;
        };

        const updateSelectedTables = () => {
            const pixelTables = new Set();
            const pixelColumnNames = [];
            const pixelColumnAliases = [];

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

        // Unused ---
        // const updateQueryPixelString = async () => {
        //     // setIsDatabaseLoading(true);

        //     const databaseId = selectedDatabaseId;
        //     const pixelTables = new Set();
        //     const pixelColumnNames = [];
        //     const pixelColumnAliases = [];
        //     const pixelJoins = [];

        //     watchedTables.forEach((tableObject) => {
        //         const currTableName = tableObject.name;
        //         const currTableColumns = tableObject.columns;

        //         currTableColumns.forEach((columnObject) => {
        //             if (columnObject.checked) {
        //                 pixelTables.add(columnObject.tableName);
        //                 pixelColumnNames.push(
        //                     `${columnObject.tableName}__${columnObject.columnName}`,
        //                 );
        //                 pixelColumnAliases.push(columnObject.userAlias);
        //             }
        //         });
        //     });

        //     Array.from(joinsSet).forEach((joinEle: string) => {
        //         const splitJoinsString = joinEle.split(':');
        //         pixelJoins.push(
        //             `( ${splitJoinsString[0]} , inner.join , ${splitJoinsString[1]} )`,
        //         );
        //     });

        //     let pixelStringPart1 = `Database ( database = [ \"${databaseId}\" ] )`;
        //     pixelStringPart1 += ` | Select ( ${pixelColumnNames.join(' , ')} )`;
        //     pixelStringPart1 += `.as ( [ ${pixelColumnAliases.join(' , ')} ] )`;

        //     // Joins Reactor apparantly not needed unless non-inner join type is selected
        //     // Join type selector has apparantly been partially dead on legacy, specifically when select all for a table is used

        //     // if (pixelJoins.length > 0) {
        //     //     pixelStringPart1 += ` | Join ( ${pixelJoins.join(' , ')} ) `;
        //     // }

        //     pixelStringPart1 += ` | Distinct ( false ) | Limit ( 20 )`;

        //     // See Join note above
        //     const combinedJoinString = ""
        //     // const combinedJoinString =
        //     //     pixelJoins.length > 0
        //     //         ? `| Join ( ${pixelJoins.join(' , ')} ) `
        //     //         : '';

        //     const reactorPixel = `Database ( database = [ \"${databaseId}\" ] ) | Select ( ${pixelColumnNames.join(
        //         ' , ',
        //     )} ) .as ( [ ${pixelColumnAliases.join(
        //         ' , ',
        //     )} ] ) ${combinedJoinString}| Distinct ( false ) | Limit ( 20 ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ \"consolidated_settings_FRAME932867__Preview\" ] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

        //     setPixelString(reactorPixel);
        //     pixelStringRef.current = reactorPixel;

        //     pixelStringRefPart1.current = pixelStringPart1 + ';';
        // };

        const retrievePreviewData = async () => {
            setIsDatabaseLoading(true);

            const databaseId = selectedDatabaseId;
            const pixelTables = new Set();
            const pixelColumnNames = [];
            const pixelColumnAliases = [];
            const pixelJoins = [];

            watchedTables.forEach((tableObject) => {
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

            // Array.from(joinsSet).forEach((joinEle: string) => {
            //     const splitJoinsString = joinEle.split(':');
            //     pixelJoins.push(
            //         `( ${splitJoinsString[0]} , inner.join , ${splitJoinsString[1]} )`,
            //     );
            // });

            watchedJoins.forEach((joinEle) => {
                // const splitJoinsString = joinEle.split(':');
                pixelJoins.push(
                    `( ${joinEle.leftTable} , ${joinEle.joinType}.join , ${joinEle.rightTable} )`,
                );
            });

            let pixelStringPart1 = `Database ( database = [ \"${databaseId}\" ] )`;
            pixelStringPart1 += ` | Select ( ${pixelColumnNames.join(' , ')} )`;
            pixelStringPart1 += `.as ( [ ${pixelColumnAliases.join(' , ')} ] )`;
            if (pixelJoins.length > 0) {
                pixelStringPart1 += ` | Join ( ${pixelJoins.join(' , ')} ) `;
            }
            pixelStringPart1 += ` | Distinct ( false ) | Limit ( 20 )`;

            // unused
            // const pixelStringPart2 = ` | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ \"consolidated_settings_FRAME932867__Preview\" ] ) ] )`;
            // const pixelStringPart3 = ` ; META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

            const combinedJoinString =
                pixelJoins.length > 0
                    ? `| Join ( ${pixelJoins.join(' , ')} ) `
                    : '';

            const reactorPixel = `Database ( database = [ \"${databaseId}\" ] ) | Select ( ${pixelColumnNames.join(
                ' , ',
            )} ) .as ( [ ${pixelColumnAliases.join(
                ' , ',
            )} ] ) ${combinedJoinString}| Distinct ( false ) | Limit ( 20 ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ \"consolidated_settings_FRAME932867__Preview\" ] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

            setPixelString(reactorPixel);
            pixelStringRef.current = reactorPixel;

            pixelStringRefPart1.current = pixelStringPart1 + ';';

            await monolithStore.runQuery(reactorPixel).then((response) => {
                const type = response.pixelReturn[0]?.operationType;
                const tableHeadersData =
                    response.pixelReturn[1]?.output?.data?.headers;
                const tableRawHeadersData =
                    response.pixelReturn[1]?.output?.data?.rawHeaders;
                const tableRowsData =
                    response.pixelReturn[1]?.output?.data?.values;

                if (type.indexOf('ERROR') != -1) {
                    console.error('Error retrieving database tables');
                    notification.add({
                        color: 'error',
                        message: `Error retrieving database tables`,
                    });
                    setIsDatabaseLoading(false);
                    setShowTablePreview(false);
                    setShowEditColumns(true);
                    return;
                }

                setDatabaseTableHeaders(tableHeadersData);
                // setDatabaseTableRawHeaders(tableRawHeadersData);
                setDatabaseTableRows(tableRowsData);

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
            if (isBeingAdded) {
                if (newAliasesCountObj[newAlias] > 0) {
                    newAliasesCountObj[newAlias] =
                        newAliasesCountObj[newAlias] + 1;
                } else {
                    newAliasesCountObj[newAlias] = 1;
                }
            } else {
                if (newAliasesCountObj[newAlias] > 0) {
                    newAliasesCountObj[newAlias] =
                        newAliasesCountObj[newAlias] - 1;
                } else {
                    newAliasesCountObj[newAlias] = 0;
                }
            }

            if (newAliasesCountObj[newAlias] < 1) {
                delete newAliasesCountObj[newAlias];
            }
            if (oldAlias != null) {
                if (newAliasesCountObj[oldAlias] > 0) {
                    newAliasesCountObj[oldAlias] =
                        newAliasesCountObj[oldAlias] - 1;
                } else {
                    newAliasesCountObj[oldAlias] = 0;
                }

                if (newAliasesCountObj[oldAlias] < 1) {
                    delete newAliasesCountObj[oldAlias];
                }
            }
            setAliasesCountObj(newAliasesCountObj);
            aliasesCountObjRef.current = { ...newAliasesCountObj };
        };

        /** Find Joinable Tables */
        const findAllJoinableTables = (rootTableName) => {
            const joinableTables = tableEdges[rootTableName]
                ? Object.keys(tableEdges[rootTableName])
                : [];
            const newShownTables = new Set([...joinableTables, rootTableName]);
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
            setJoinsStackHandler();
        };

        /** Pre-Populate form For Edit  */
        const prepoulateFormForEdit = (cell) => {
            const tablesWithCheckedBoxes = new Set();
            const checkedColumns = new Set();
            const columnAliasMap = {};
            const newAliasesCountObj = {};

            setCheckedColumnsCount(cell.parameters.selectedColumns.length);

            cell.parameters.selectedColumns.forEach(
                (selectedColumnTableCombinedString, idx) => {
                    const [currTableName, currColumnName] =
                        selectedColumnTableCombinedString.split('__');
                    const currColumnAlias = cell.parameters.columnAliases[idx];
                    tablesWithCheckedBoxes.add(currTableName);
                    checkedColumns.add(selectedColumnTableCombinedString);
                    columnAliasMap[selectedColumnTableCombinedString] =
                        currColumnAlias;
                    newAliasesCountObj[currColumnAlias || currColumnName] = 1;
                },
            );

            setAliasesCountObj({ ...newAliasesCountObj });
            aliasesCountObjRef.current = { ...newAliasesCountObj };

            if (newTableFields) {
                newTableFields.forEach((newTableObj, tableIdx) => {
                    if (tablesWithCheckedBoxes.has(newTableObj.name)) {
                        const watchedTableColumns =
                            watchedTables[tableIdx].columns;
                        watchedTableColumns.forEach(
                            (tableColumnObj, columnIdx) => {
                                const columnName = `${tableColumnObj.tableName}__${tableColumnObj.columnName}`;
                                if (checkedColumns.has(columnName)) {
                                    const columnAlias =
                                        columnAliasMap[columnName];
                                    newSetValue(
                                        `tables.${tableIdx}.columns.${columnIdx}.checked`,
                                        true,
                                    );
                                    newSetValue(
                                        `tables.${tableIdx}.columns.${columnIdx}.userAlias`,
                                        columnAlias,
                                    );
                                }
                            },
                        );
                    }
                });
            }

            const newJoinsSet = new Set();
            cell.parameters.joins.forEach((joinObject) => {
                appendJoinElement(joinObject);
                const joinsSetString1 = `${joinObject.leftTable}:${joinObject.rightTable}`;
                const joinsSetString2 = `${joinObject.rightTable}:${joinObject.leftTable}`;
                newJoinsSet.add(joinsSetString1);
                newJoinsSet.add(joinsSetString2);
            });

            setJoinsSet(newJoinsSet);
            setCheckedColumnsCount(checkedColumns.size);
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

                rightTables?.forEach((entry, joinIdx) => {
                    const rightTable = entry[0];
                    const leftKey = entry[1]['sourceColumn'];
                    const rightKey = entry[1]['targetColumn'];

                    const leftTableContainsCheckedColumns =
                        checkTableForSelectedColumns(leftTable);
                    const rightTableContainsCheckedColumns =
                        checkTableForSelectedColumns(rightTable);

                    const defaultJoinType = 'inner';

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

            setInitEditPrepopulateComplete(true);
        };

        const addToJoinsSetHelper = (newJoinSet) => {
            const joinsSetCopy = new Set(joinsSet);
            joinsSetCopy.add(newJoinSet);
            setJoinsSet(joinsSetCopy);
        };

        return (
            // <Modal open={isDataImportModalOpen} maxWidth="lg">
            <Modal open={true} maxWidth="lg">
                <Modal.Content sx={{ width: importModalPixelWidth }}>
                    <form onSubmit={newHandleSubmit(onImportDataSubmit)}>
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
                                                field.onChange(e.target.value);
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
                                                        value={ele.database_id}
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
                                            disabled={
                                                !checkedColumnsCount ||
                                                Object.values(
                                                    aliasesCountObj,
                                                ).some((key: number) => key > 1)
                                            }
                                            onClick={() => {
                                                setShowTablePreview(
                                                    !showPreview,
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
                                                                                    disabled={
                                                                                        true
                                                                                    }
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
                                        </ScrollTableSetContainer>
                                    </StyledTableSetWrapper>
                                )}

                                {showPreview && (
                                    <StyledTableSetWrapper>
                                        <StyledTableTitle variant="h6">
                                            Preview
                                        </StyledTableTitle>
                                        <ScrollTableSetContainer>
                                            <Table stickyHeader size={'small'}>
                                                <Table.Body>
                                                    <Table.Row>
                                                        {databaseTableHeaders
                                                            // .filter(
                                                            //     (v, colIdx) => {
                                                            //         console.log(!hiddenColumnIdsSet.has(
                                                            //             colIdx,
                                                            //         ));
                                                            //         return !hiddenColumnIdsSet.has(
                                                            //             colIdx,
                                                            //         );
                                                            //     },
                                                            // )
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
                                                                {r.map(
                                                                    (
                                                                        v,
                                                                        vIdx,
                                                                    ) => (
                                                                        <Table.Cell
                                                                            key={`${rIdx}-${vIdx}`}
                                                                        >
                                                                            {v}
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

                        {joinElements.map((join, joinIndex) => (
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
                                            Join
                                        </Typography>

                                        <Tooltip title="Left Table">
                                            <StyledJoinDiv>
                                                {join.leftTable}
                                            </StyledJoinDiv>
                                        </Tooltip>

                                        <Tooltip title={`${'Inner Join'}`}>
                                            <IconButton
                                                size="small"
                                                color="secondary"
                                                sx={{
                                                    marginLeft: '7.5px',
                                                    marginRight: '7.5px',
                                                }}
                                                onClick={(e) => {
                                                    setAnchorEl(
                                                        e.currentTarget,
                                                    );
                                                    setIsJoinSelectOpen(true);
                                                }}
                                            >
                                                {
                                                    JOIN_ICONS[
                                                        watchedJoins[joinIndex]
                                                            .joinType
                                                    ]
                                                }
                                            </IconButton>
                                        </Tooltip>

                                        {/* Join Select Menu */}
                                        <StyledMenu
                                            anchorEl={anchorEl}
                                            open={isJoinSelectOpen}
                                            onClose={() => {
                                                setAnchorEl(null);
                                                setIsJoinSelectOpen(false);
                                            }}
                                        >
                                            <StyledMenuItem
                                                value={'Inner Join'}
                                                onClick={() => {
                                                    setIsJoinSelectOpen(false);
                                                    newSetValue(
                                                        `joins.${joinIndex}.joinType`,
                                                        'inner',
                                                    );
                                                }}
                                            >
                                                Inner Join
                                            </StyledMenuItem>
                                            <StyledMenuItem
                                                value={'Left Join'}
                                                onClick={() => {
                                                    setIsJoinSelectOpen(false);
                                                    newSetValue(
                                                        `joins.${joinIndex}.joinType`,
                                                        'left.outer',
                                                    );
                                                }}
                                            >
                                                Left Join
                                            </StyledMenuItem>
                                            <StyledMenuItem
                                                value={'Right Join'}
                                                onClick={() => {
                                                    setIsJoinSelectOpen(false);
                                                    newSetValue(
                                                        `joins.${joinIndex}.joinType`,
                                                        'right.outer',
                                                    );
                                                }}
                                            >
                                                Right Join
                                            </StyledMenuItem>
                                            <StyledMenuItem
                                                value={'Outer Join'}
                                                onClick={() => {
                                                    setIsJoinSelectOpen(false);
                                                    newSetValue(
                                                        `joins.${joinIndex}.joinType`,
                                                        'outer',
                                                    );
                                                }}
                                            >
                                                Outer Join
                                            </StyledMenuItem>
                                            {/* {selectedAddCell === 'transformation' &&
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
                                            )} */}
                                        </StyledMenu>

                                        <Tooltip title="Right Table">
                                            <StyledJoinDiv>
                                                {join.rightTable}
                                            </StyledJoinDiv>
                                        </Tooltip>

                                        <StyledJoinTypography variant="body1">
                                            where
                                        </StyledJoinTypography>

                                        <Tooltip title="Left Key">
                                            <StyledJoinDiv>
                                                {join.leftKey}
                                            </StyledJoinDiv>
                                        </Tooltip>

                                        <StyledJoinTypography variant="body1">
                                            =
                                        </StyledJoinTypography>

                                        <Tooltip title="Right Key">
                                            <StyledJoinDiv>
                                                {join.rightKey}
                                            </StyledJoinDiv>
                                        </Tooltip>
                                    </div>
                                </StyledModalTitleWrapper2>
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
                                disabled={
                                    !checkedColumnsCount ||
                                    Object.values(aliasesCountObj).some(
                                        (key: number) => key > 1,
                                    ) ||
                                    aliasesCountObj[''] > 0
                                }
                            >
                                {editMode ? 'Update Cell' : 'Import'}
                            </Button>
                        </Modal.Actions>
                    </form>
                </Modal.Content>
            </Modal>
        );
    },
);
