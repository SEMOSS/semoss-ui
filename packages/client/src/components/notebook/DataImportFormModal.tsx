import { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Checkbox,
    useNotification,
    Typography,
    TextField,
    IconButton,
    MenuProps,
    Tooltip,
    Button,
    Menu,
    Stack,
    Select,
    Modal,
    Table,
    styled,
} from '@semoss/ui';
import { useBlocks, usePixel, useRootStore } from '@/hooks';
import {
    ActionMessages,
    CellStateConfig,
    NewCellAction,
    QueryState,
} from '@/stores';
import {
    ControlPointDuplicateRounded,
    CalendarViewMonth,
    KeyboardArrowDown,
    FilterListRounded,
    AddBox,
    JoinInner,
    JoinRight,
    JoinLeft,
    JoinFull,
    Warning,
} from '@mui/icons-material';
import { DefaultCells } from '@/components/cell-defaults';
import { DataImportCellConfig } from '../cell-defaults/data-import-cell';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { CodeCellConfig } from '../cell-defaults/code-cell';
import { TableContainer } from '@mui/material';
import { LoadingScreen } from '@/components/ui';

const StyledDivSecondaryKeyLabel = styled('div')(() => ({
    backgroundColor: '#EBEBEB',
    padding: '3px, 4px, 3px, 4px',
    width: '37px',
    height: '24px',
    borderRadius: '3px',
    display: 'inline-block',
    marginLeft: '7px',
    paddingTop: '3px',
    textAlign: 'center',
}));

const StyledDivPrimaryKeyLabel = styled('div')(() => ({
    backgroundColor: '#F1E9FB',
    padding: '3px, 4px, 3px, 4px',
    width: '37px',
    height: '24px',
    borderRadius: '3px',
    display: 'inline-block',
    marginLeft: '7px',
    paddingTop: '3px',
    textAlign: 'center',
}));

const StyledDivFitContent = styled('div')(() => ({
    width: 'fit-content',
    blockSize: 'fit-content',
    display: 'flex',
}));

const StyledIconButtonMargins = styled(IconButton)(() => ({
    marginLeft: '7.5px',
    marginRight: '7.5px',
}));

const StyledSelectMinWidth = styled(Select)(() => ({
    minWidth: '220px',
}));

const StyledButtonEditColumns = styled(Button)(() => ({
    marginRight: '15px',
}));

const StyledDivCenterFlex = styled('div')(() => ({
    alignItems: 'center',
    display: 'flex',
}));

const StyledTypographyMarginRight = styled(Typography)(() => ({
    marginBottom: '-1.5px',
    marginRight: '15px',
}));

const StyledModalActionsUnpadded = styled(Modal.Actions)(() => ({
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '0px',
}));

const StyledMarginModalActions = styled(Modal.Actions)(() => ({
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '15px',
    marginTop: '15px',
    padding: '0px',
}));

const StyledPaddedStack = styled(Stack)(() => ({
    backgroundColor: '#FAFAFA',
    padding: '16px 16px 16px 16px',
    marginBottom: '15px',
}));

const StyledModalTitle = styled(Typography)(() => ({
    alignContent: 'center',
    marginRight: '15px',
}));

const StyledModalTitleWrapper = styled(Modal.Title)(() => ({
    justifyContent: 'space-between',
    alignContent: 'center',
    display: 'flex',
    padding: '0px',
    marginBottom: '15px',
    marginTop: '25px',
}));

const StyledModalTitleUnpaddedWrapper = styled(Modal.Title)(() => ({
    justifyContent: 'space-between',
    alignContent: 'center',
    display: 'flex',
    padding: '0px',
}));

const ScrollTableSetContainer = styled(TableContainer)(() => ({
    maxHeight: '350px',
    overflowY: 'scroll',
}));

const StyledTableSetWrapper = styled('div')(() => ({
    backgroundColor: '#fff',
    marginBottom: '20px',
}));

const StyledTableTitle = styled(Typography)(() => ({
    marginTop: '15px',
    marginLeft: '15px',
    marginBottom: '20px',
}));

const FlexWrapper = styled('div')(() => ({
    marginTop: '15px',
    display: 'flex',
    padding: '0px',
}));

const FlexTableCell = styled('div')(() => ({
    alignItems: 'center',
    display: 'flex',
}));

const StyledTableTitleBlueBubble = styled(Typography)(({ theme }) => ({
    backgroundColor: theme.palette.primary.selected,
    padding: '7.5px 17.5px',
    borderRadius: '10px',
    width: 'fit-content',
    display: 'flex',
    marginTop: '0px',
    marginLeft: '0px',
    marginBottom: '15px',
    alignItems: 'center',
}));

const SingleTableWrapper = styled('div')(() => ({
    marginRight: '12.5px',
    marginBottom: '60px',
    marginLeft: '12.5px',
}));

const CheckAllIconButton = styled(IconButton)(() => ({
    marginLeft: '-10px',
}));

const AliasWarningIcon = styled(Tooltip)(() => ({
    marginLeft: '10px',
    color: 'goldenrod',
}));

const TableIconButton = styled(Tooltip)(({ theme }) => ({
    color: theme.palette.primary.main,
    marginLeft: '-3px',
    marginRight: '7px',
}));

const ColumnNameText = styled(Typography)(() => ({
    fontWeight: 'bold',
}));

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        anchorOrigin={{
            horizontal: 'left',
            vertical: 'bottom',
        }}
        transformOrigin={{
            horizontal: 'left',
            vertical: 'top',
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

const StyledJoinDiv = styled('div')(({ theme }) => ({
    borderRadius: '12px',
    padding: '4px 12px',
    fontSize: '14px',
    color: 'black',
    border: 'none',
    cursor: 'default',
    backgroundColor: theme.palette.primary.selected,
}));

const StyledJoinTypography = styled(Typography)(({ theme }) => ({
    cursor: 'default',
    marginLeft: '12.5px',
    marginRight: '12.5px',
    color: theme.palette.secondary.dark,
}));

type JoinElement = {
    leftTable: string;
    rightTable: string;
    joinType: string;
    leftKey: string;
    rightKey: string;
};

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
    columns: Column[];
    name: string;
}

interface NewFormData {
    databaseSelect: string;
    tables: Table[];
}

type FormValues = {
    databaseSelect: string;
    joins: JoinElement[];
    tables: Table[];
};

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

export const DataImportFormModal = observer(
    (props: {
        query?: QueryState;
        previousCellId?: string;
        setIsDataImportModalOpen?;
        editMode?: boolean;
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
        const [joinTypeSelectIndex, setJoinTypeSelectIndex] = useState(-1);
        const { state, notebook } = useBlocks();

        const {
            control: formControl,
            setValue: formSetValue,
            reset: formReset,
            handleSubmit: formHandleSubmit,
            watch: dataImportwatch,
        } = useForm<FormValues>();

        const watchedTables = dataImportwatch('tables');
        const watchedJoins = dataImportwatch('joins');
        const [userDatabases, setUserDatabases] = useState(null);
        const [importModalPixelWidth, setImportModalPixelWidth] =
            useState<string>(IMPORT_MODAL_WIDTHS.small);
        const [databaseTableHeaders, setDatabaseTableHeaders] = useState([]);
        const [selectedDatabaseId, setSelectedDatabaseId] = useState(
            cell ? cell.parameters.databaseId : null,
        );
        const getDatabases = usePixel('META | GetDatabaseList ( ) ;'); // making repeat network calls, move to load data modal open
        const [databaseTableRows, setDatabaseTableRows] = useState([]);
        const [tableNames, setTableNames] = useState<string[]>([]);
        const [isDatabaseLoading, setIsDatabaseLoading] =
            useState<boolean>(false);
        const [showPreview, setShowTablePreview] = useState<boolean>(false);
        const [showEditColumns, setShowEditColumns] = useState<boolean>(true);
        const [tableEdgesObject, setTableEdgesObject] = useState(null);
        const [aliasesCountObj, setAliasesCountObj] = useState({});
        const { monolithStore } = useRootStore();
        const aliasesCountObjRef = useRef({});
        const [tableEdges, setTableEdges] = useState({}); //
        const [rootTable, setRootTable] = useState(
            cell ? cell.parameters.rootTable : null,
        );

        const [checkedColumnsCount, setCheckedColumnsCount] = useState(0);
        const [selectedTableNames, setSelectedTableNames] = useState(new Set());
        const [shownTables, setShownTables] = useState(new Set());
        const [joinsSet, setJoinsSet] = useState(new Set());
        const pixelStringRef = useRef<string>('');
        const pixelPartialRef = useRef<string>('');
        const [isInitLoadComplete, setIsInitLoadComplete] = useState(false);
        const [isJoinSelectOpen, setIsJoinSelectOpen] = useState(false);
        const [initEditPrepopulateComplete, setInitEditPrepopulateComplete] =
            useState(editMode ? false : true);

        const { fields: newTableFields } = useFieldArray({
            control: formControl,
            name: 'tables',
        });

        const {
            fields: joinElements,
            append: appendJoinElement,
            remove: removeJoinElement,
        } = useFieldArray({
            control: formControl,
            name: 'joins',
        });

        const notification = useNotification();

        useEffect(() => {
            if (editMode)
                retrieveDatabaseTablesAndEdges(cell.parameters.databaseId);
        }, []);

        useEffect(() => {
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
                        joins: watchedJoins,
                        selectQuery: pixelPartialRef.current,
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
                    value: getColumnAliases(),
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
                    value: pixelPartialRef.current,
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
                updatePixelRef();
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
            setIsDataImportModalOpen(false);
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
                        (acc, ele) => {
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

                    formReset({
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

        /**
         * Updates pixel without building preview.
         */
        const updatePixelRef = async (): Promise<void> => {
            try {
                const databaseId = selectedDatabaseId;
                const pixelTables: Set<string> = new Set();
                const pixelColumnNames: string[] = [];
                const pixelColumnAliases: string[] = [];
                const pixelJoins: string[] = [];

                watchedTables?.forEach((tableObject) => {
                    const currTableColumns = tableObject.columns;
                    currTableColumns?.forEach((columnObject) => {
                        if (columnObject.checked) {
                            pixelTables.add(columnObject.tableName);
                            pixelColumnNames.push(
                                `${columnObject.tableName}__${columnObject.columnName}`,
                            );
                            pixelColumnAliases.push(columnObject.userAlias);
                        }
                    });
                });

                watchedJoins?.forEach((joinEle) => {
                    pixelJoins.push(
                        `( ${joinEle.leftTable} , ${joinEle.joinType}.join , ${joinEle.rightTable} )`,
                    );
                });

                let pixelStringPart1 = `Database ( database = [ \"${databaseId}\" ] )`;
                pixelStringPart1 += ` | Select ( ${pixelColumnNames.join(
                    ' , ',
                )} )`;
                pixelStringPart1 += `.as ( [ ${pixelColumnAliases.join(
                    ' , ',
                )} ] )`;
                if (pixelJoins.length > 0) {
                    pixelStringPart1 += ` | Join ( ${pixelJoins.join(
                        ' , ',
                    )} ) `;
                }
                pixelStringPart1 += ` | Distinct ( false ) | Limit ( 20 )`;

                const combinedJoinString =
                    pixelJoins.length > 0
                        ? `| Join ( ${pixelJoins.join(' , ')} ) `
                        : '';

                const reactorPixel = `Database ( database = [ \"${databaseId}\" ] ) | Select ( ${pixelColumnNames.join(
                    ' , ',
                )} ) .as ( [ ${pixelColumnAliases.join(
                    ' , ',
                )} ] ) ${combinedJoinString}| Distinct ( false ) | Limit ( 20 ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ \"consolidated_settings_FRAME932867__Preview\" ] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

                pixelStringRef.current = reactorPixel;
                pixelPartialRef.current = pixelStringPart1 + ';';
            } catch {
                setIsDatabaseLoading(false);
                setShowTablePreview(false);
                setShowEditColumns(true);

                notification.add({
                    color: 'error',
                    message: `Error updating Data Import`,
                });
            }
        };

        const retrieveSelectedColumnNames = () => {
            const pixelTables = new Set();
            const pixelColumnNames = [];
            const pixelColumnAliases = [];

            watchedTables?.forEach((tableObject) => {
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

        const retrievePreviewData = async () => {
            setIsDatabaseLoading(true);

            const databaseId = selectedDatabaseId;
            const pixelTables = new Set();
            const pixelColumnNames = [];
            const pixelColumnAliases = [];
            const pixelJoins = [];

            try {
                watchedTables?.forEach((tableObject) => {
                    const currTableColumns = tableObject.columns;
                    currTableColumns?.forEach((columnObject) => {
                        if (columnObject.checked) {
                            pixelTables.add(columnObject.tableName);
                            pixelColumnNames.push(
                                `${columnObject.tableName}__${columnObject.columnName}`,
                            );
                            pixelColumnAliases.push(columnObject.userAlias);
                        }
                    });
                });

                watchedJoins?.forEach((joinEle) => {
                    pixelJoins.push(
                        `( ${joinEle.leftTable} , ${joinEle.joinType}.join , ${joinEle.rightTable} )`,
                    );
                });

                let pixelStringPart1 = `Database ( database = [ \"${databaseId}\" ] )`;
                pixelStringPart1 += ` | Select ( ${pixelColumnNames.join(
                    ' , ',
                )} )`;
                pixelStringPart1 += `.as ( [ ${pixelColumnAliases.join(
                    ' , ',
                )} ] )`;
                if (pixelJoins.length > 0) {
                    pixelStringPart1 += ` | Join ( ${pixelJoins.join(
                        ' , ',
                    )} ) `;
                }
                pixelStringPart1 += ` | Distinct ( false ) | Limit ( 20 )`;

                const combinedJoinString =
                    pixelJoins.length > 0
                        ? `| Join ( ${pixelJoins.join(' , ')} ) `
                        : '';

                const reactorPixel = `Database ( database = [ \"${databaseId}\" ] ) | Select ( ${pixelColumnNames.join(
                    ' , ',
                )} ) .as ( [ ${pixelColumnAliases.join(
                    ' , ',
                )} ] ) ${combinedJoinString}| Distinct ( false ) | Limit ( 20 ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ \"consolidated_settings_FRAME932867__Preview\" ] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

                pixelStringRef.current = reactorPixel;
                pixelPartialRef.current = pixelStringPart1 + ';';

                await monolithStore.runQuery(reactorPixel).then((response) => {
                    const type = response.pixelReturn[0]?.operationType;
                    const tableHeadersData =
                        response.pixelReturn[1]?.output?.data?.headers;
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
                    setDatabaseTableRows(tableRowsData);
                    setIsDatabaseLoading(false);
                });
            } catch {
                setIsDatabaseLoading(false);
                setShowTablePreview(false);
                setShowEditColumns(true);

                notification.add({
                    color: 'error',
                    message: `Error retrieving database tables`,
                });
            }
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

            updatePixelRef(); // may be unnecessary
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

            cell.parameters.selectedColumns?.forEach(
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
                newTableFields?.forEach((newTableObj, tableIdx) => {
                    if (tablesWithCheckedBoxes.has(newTableObj.name)) {
                        const watchedTableColumns =
                            watchedTables[tableIdx].columns;
                        watchedTableColumns?.forEach(
                            (tableColumnObj, columnIdx) => {
                                const columnName = `${tableColumnObj.tableName}__${tableColumnObj.columnName}`;
                                if (checkedColumns.has(columnName)) {
                                    const columnAlias =
                                        columnAliasMap[columnName];
                                    formSetValue(
                                        `tables.${tableIdx}.columns.${columnIdx}.checked`,
                                        true,
                                    );
                                    formSetValue(
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
            cell.parameters.joins?.forEach((joinObject) => {
                appendJoinElement(joinObject);
                const joinsSetString1 = `${joinObject.leftTable}:${joinObject.rightTable}`;
                const joinsSetString2 = `${joinObject.rightTable}:${joinObject.leftTable}`;
                newJoinsSet.add(joinsSetString1);
                newJoinsSet.add(joinsSetString2);
            });

            setJoinsSet(newJoinsSet);
            setCheckedColumnsCount(checkedColumns.size);

            const loadedQueryString = cell.parameters.selectQuery;
            pixelPartialRef.current = loadedQueryString;
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
            <Modal open={true} maxWidth="lg">
                <Modal.Content sx={{ width: importModalPixelWidth }}>
                    <form onSubmit={formHandleSubmit(onImportDataSubmit)}>
                        <StyledModalTitleWrapper>
                            <StyledDivFitContent>
                                <StyledModalTitle variant="h6">
                                    Import Data from
                                </StyledModalTitle>
                                <Controller
                                    name={'databaseSelect'}
                                    control={formControl}
                                    render={({ field }) => (
                                        <StyledSelectMinWidth
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
                                            disabled={editMode}
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
                                        </StyledSelectMinWidth>
                                    )}
                                />
                            </StyledDivFitContent>
                            {/* <IconButton disabled={true}>
                                <KeyboardArrowDown />
                            </IconButton> */}
                        </StyledModalTitleWrapper>

                        {isDatabaseLoading && (
                            <LoadingScreen.Trigger description="Awaiting database response..." />
                        )}

                        {!selectedDatabaseId && (
                            <StyledPaddedStack spacing={1} direction="column">
                                <Typography
                                    variant="subtitle2"
                                    color="secondary"
                                >
                                    Select a Database for Import
                                </Typography>
                            </StyledPaddedStack>
                        )}

                        {selectedDatabaseId && !isDatabaseLoading && (
                            <StyledPaddedStack spacing={1} direction="column">
                                <StyledModalTitleUnpaddedWrapper>
                                    <StyledDivCenterFlex>
                                        <StyledTypographyMarginRight variant="h6">
                                            Data
                                        </StyledTypographyMarginRight>
                                    </StyledDivCenterFlex>
                                    <div>
                                        <StyledButtonEditColumns
                                            variant="text"
                                            color="primary"
                                            size="medium"
                                            onClick={() => {
                                                if (!showEditColumns) {
                                                    setShowEditColumns(true);
                                                    setShowTablePreview(false);
                                                }
                                            }}
                                        >
                                            Edit Columns
                                        </StyledButtonEditColumns>
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
                                                if (!showPreview) {
                                                    setShowTablePreview(true);
                                                    setShowEditColumns(false);
                                                }
                                            }}
                                        >
                                            Preview
                                        </Button>
                                    </div>
                                </StyledModalTitleUnpaddedWrapper>

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
                                                                                                formControl
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
                                                                                            <StyledDivPrimaryKeyLabel>
                                                                                                PK
                                                                                            </StyledDivPrimaryKeyLabel>
                                                                                        )}
                                                                                        {column.columnName.includes(
                                                                                            '_ID',
                                                                                        ) && (
                                                                                            <StyledDivSecondaryKeyLabel>
                                                                                                FK
                                                                                            </StyledDivSecondaryKeyLabel>
                                                                                        )}
                                                                                    </Table.Cell>
                                                                                    <Table.Cell>
                                                                                        <FlexTableCell>
                                                                                            <Controller
                                                                                                name={`tables.${tableIndex}.columns.${columnIndex}.userAlias`}
                                                                                                control={
                                                                                                    formControl
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
                                                                                                formControl
                                                                                            }
                                                                                            render={({
                                                                                                field,
                                                                                            }) => (
                                                                                                <StyledSelectMinWidth
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
                                                                                                    disabled // TODO enable after adding to form and cell config
                                                                                                >
                                                                                                    {SQL_COLUMN_TYPES.map(
                                                                                                        (
                                                                                                            ele,
                                                                                                            eleIdx,
                                                                                                        ) => (
                                                                                                            <Menu.Item
                                                                                                                value={
                                                                                                                    ele
                                                                                                                }
                                                                                                                key={
                                                                                                                    eleIdx
                                                                                                                }
                                                                                                            >
                                                                                                                {
                                                                                                                    ele
                                                                                                                }
                                                                                                            </Menu.Item>
                                                                                                        ),
                                                                                                    )}
                                                                                                </StyledSelectMinWidth>
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
                                                        {databaseTableHeaders.map(
                                                            (h, hIdx) => (
                                                                <Table.Cell
                                                                    key={hIdx}
                                                                >
                                                                    <strong>
                                                                        {h}
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
                            </StyledPaddedStack>
                        )}

                        {joinElements.map((join, joinIndex) => (
                            <StyledPaddedStack
                                spacing={1}
                                direction="column"
                                key={joinIndex}
                            >
                                <StyledModalTitleUnpaddedWrapper>
                                    <StyledDivCenterFlex>
                                        <StyledTypographyMarginRight variant="h6">
                                            Join
                                        </StyledTypographyMarginRight>

                                        <Tooltip title="Left Table">
                                            <StyledJoinDiv>
                                                {join.leftTable}
                                            </StyledJoinDiv>
                                        </Tooltip>

                                        <Tooltip
                                            title={`${'Select Join Type'}`}
                                        >
                                            <StyledIconButtonMargins
                                                size="small"
                                                color="secondary"
                                                onClick={(e) => {
                                                    setAnchorEl(
                                                        e.currentTarget,
                                                    );
                                                    setJoinTypeSelectIndex(
                                                        joinIndex,
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
                                            </StyledIconButtonMargins>
                                        </Tooltip>

                                        {/* Join Select Menu */}
                                        <StyledMenu
                                            anchorEl={anchorEl}
                                            open={isJoinSelectOpen}
                                            onClose={() => {
                                                setAnchorEl(null);
                                                setIsJoinSelectOpen(false);
                                                setJoinTypeSelectIndex(-1);
                                            }}
                                        >
                                            <StyledMenuItem
                                                value={'Inner Join'}
                                                onClick={() => {
                                                    setIsJoinSelectOpen(false);
                                                    formSetValue(
                                                        `joins.${joinTypeSelectIndex}.joinType`,
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
                                                    formSetValue(
                                                        `joins.${joinTypeSelectIndex}.joinType`,
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
                                                    formSetValue(
                                                        `joins.${joinTypeSelectIndex}.joinType`,
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
                                                    formSetValue(
                                                        `joins.${joinTypeSelectIndex}.joinType`,
                                                        'outer',
                                                    );
                                                }}
                                            >
                                                Outer Join
                                            </StyledMenuItem>
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
                                    </StyledDivCenterFlex>
                                </StyledModalTitleUnpaddedWrapper>
                            </StyledPaddedStack>
                        ))}

                        <StyledMarginModalActions>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="medium"
                                disabled
                                startIcon={<FilterListRounded />}
                                onClick={() => {
                                    // create addFilterHandler
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
                                    // create addSummaryHandler
                                }}
                            >
                                Add Summary
                            </Button>
                        </StyledMarginModalActions>
                        <StyledModalActionsUnpadded>
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
                        </StyledModalActionsUnpadded>
                    </form>
                </Modal.Content>
            </Modal>
        );
    },
);
