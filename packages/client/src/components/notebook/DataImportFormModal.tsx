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
    FilterListRounded,
    AddBox,
    JoinInner,
    JoinRight,
    JoinLeft,
    JoinFull,
    Warning,
    Close,
} from '@mui/icons-material';
import { DefaultCells } from '@/components/cell-defaults';
import { DataImportCellConfig } from '../cell-defaults/data-import-cell';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { CodeCellConfig } from '../cell-defaults/code-cell';
import { TableContainer } from '@mui/material';
import { LoadingScreen } from '@/components/ui';

// region --- Styled Elements

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
    minHeight: '7.5px',
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

// endregion

// region --- useForm Types & Interfaces

/**
 * Represents a column in a db table for useForm.
 * */
interface ColumnInterface {
    id: number;
    tableName: string;
    columnName: string;
    columnType: string;
    userAlias: string;
    checked: boolean;
}

/**
 * Represents a table containing multiple columns for useForm.
 */
interface TableInterface {
    id: number;
    columns: ColumnInterface[];
    name: string;
}

/**
 * Represents a join element between two tables for useForm.
 */
type JoinElement = {
    leftTable: string;
    rightTable: string;
    joinType: string;
    leftKey: string;
    rightKey: string;
};

/**
 * Represents the form values
 * used in a database join operation.
 */
type FormValues = {
    databaseSelect: string;
    joins: JoinElement[];
    tables: TableInterface[];
};

/**
 * Interface representing a table edge entry
 * used in setJoinsStackHandler function.
 */
interface SetJoinsStackHandlerTableEdgeEntry {
    sourceColumn: string;
    targetColumn: string;
}

/**
 * Interface representing a join element
 * used in setJoinsStackHandler function.
 */
interface SetJoinsStackHandlerJoinElement {
    leftTable: string;
    rightTable: string;
    joinType: string;
    leftKey: string;
    rightKey: string;
}

/**
 * Interface representing a column object
 * used in checkTableForSelectedColumns function.
 */
interface CheckForSelectedColumn {
    checked: boolean;
}

/**
 * Interface representing a table object
 * used in checkTableForSelectedColumns function.
 */
interface CheckForSelectedTable {
    name: string;
    columns: CheckForSelectedColumn[];
}

/**
 * Interface representing a column object
 * used in checkBoxHandler function.
 */
interface CheckBoxHandlerColumn {
    userAlias: string;
    checked: boolean;
}

/**
 * Type representing the alias count object
 * specific to updateAliasCountObj function.
 */
type AliasCountObject = Record<string, number>;

/**
 * Interface representing a column object
 * used in retrievePreviewData function.
 */
interface RetrievePreviewDataColumn {
    tableName: string;
    columnName: string;
    userAlias: string;
    checked: boolean;
}

/**
 * Interface representing a table object
 * used in retrievePreviewData function.
 */
interface RetrievePreviewDataTable {
    columns: RetrievePreviewDataColumn[];
}

/**
 * Interface representing a column object
 * used in updateSelectedTables function.
 */
interface UpdateSelectedTablesColumn {
    tableName: string;
    columnName: string;
    userAlias: string;
    checked: boolean;
}

/**
 * Interface representing a table object
 * used in updateSelectedTables function.
 */
interface UpdateSelectedTablesTable {
    columns: UpdateSelectedTablesColumn[];
}

/**
 * Interface representing a column object
 * used in retrieveSelectedColumnNames function.
 */
interface RetrieveSelectedColumnNamesColumn {
    tableName: string;
    columnName: string;
    userAlias: string;
    checked: boolean;
}

/**
 * Interface representing a table object
 * used in retrieveSelectedColumnNames function.
 */
interface RetrieveSelectedColumnNamesTable {
    columns: RetrieveSelectedColumnNamesColumn[];
}

/**
 * Interface representing a column object
 * used in retrieveColumnAliasNames function.
 */
interface RetrieveColumnAliasNamesColumn {
    tableName: string;
    columnName: string;
    userAlias: string;
    checked: boolean;
}

/**
 * Interface representing a table object
 * used in retrieveColumnAliasNames function.
 */
interface RetrieveColumnAliasNamesTable {
    columns: RetrieveColumnAliasNamesColumn[];
}

/**
 * Type representing the structure of a table column
 * specific to retrieveDatabaseTablesAndEdges function.
 */
interface RetrieveDatabaseTableColumn {
    tableName: string;
    columnName: string;
    columnType: string;
    columnBoolean: boolean;
    userAlias: string;
    checked: boolean;
}

/**
 * Type representing a table with columns
 * specific to retrieveDatabaseTablesAndEdges function.
 */
interface RetrieveDatabaseTable {
    id: number;
    name: string;
    columns: RetrieveDatabaseTableColumn[];
}

/**
 * Type representing the structure of an edge
 * specific to retrieveDatabaseTablesAndEdges function.
 */
interface RetrieveDatabaseEdge {
    source: string;
    target: string;
    sourceColumn: string;
    targetColumn: string;
    relation: string;
}

/**
 * Interface representing the payload for an update cell action
 * specific to updateSubmitDispatches function.
 */
interface UpdateCellPayload {
    queryId: string;
    cellId: string;
    path: string;
    value: any;
}

/**
 * Interface representing a column object
 * used in retrieveSelectedTableNames function.
 */
interface RetrieveSelectedTableNamesColumn {
    tableName: string;
    columnName: string;
    userAlias: string;
    checked: boolean;
}

/**
 * Interface representing a table object
 * used in retrieveSelectedTableNames function.
 */
interface RetrieveSelectedTableNamesTable {
    columns: RetrieveSelectedTableNamesColumn[];
}

/**
 * Interface for adding new cell action
 * for appendCell function.
 */
interface AppendNewCellAction {
    payload: {
        config: {
            widget: string;
            parameters: Record<string, any>;
        };
    };
}

/**
 * Interface for column object
 * for getColumnAliases function.
 */
interface GetColumnAliasesColumn {
    tableName: string;
    columnName: string;
    userAlias: string;
    checked: boolean;
}

/**
 * Interface for table object
 * for getColumnAliases function.
 */
interface GetColumnAliasesTable {
    columns: GetColumnAliasesColumn[];
}

/**
 * Interface representing a column object
 * for the getSelectedColumnNames function.
 */
interface getSelectedColumnNamesColumn {
    tableName: string;
    columnName: string;
    checked: boolean;
}

/**
 * Interface representing a table object
 * for the getSelectedColumnNames function.
 */
interface getSelectedColumnNamesTable {
    columns: getSelectedColumnNamesColumn[];
}

// endregion

// region --- Constants

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

// endregion

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

        // region --- state / useForm / watched elements

        const { state, notebook } = useBlocks();

        const {
            control: formControl,
            setValue: formSetValue,
            handleSubmit: formHandleSubmit,
            watch: dataImportwatch,
            reset: formReset,
        } = useForm<FormValues>();

        const watchedTables = dataImportwatch('tables');
        const watchedJoins = dataImportwatch('joins');

        // endregion

        // region --- useStates / useRefs

        const getDatabases = usePixel('META | GetDatabaseList ( ) ;'); // making repeat network calls, move to load data modal open
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const [joinTypeSelectIndex, setJoinTypeSelectIndex] = useState(-1);
        const [tableNames, setTableNames] = useState<string[]>([]);
        const [showPreview, setShowTablePreview] = useState<boolean>(false);
        const [showEditColumns, setShowEditColumns] = useState<boolean>(true);
        const [databaseTableHeaders, setDatabaseTableHeaders] = useState([]);
        const [databaseTableRows, setDatabaseTableRows] = useState([]);
        const [tableEdgesObject, setTableEdgesObject] = useState(null);
        const [aliasesCountObj, setAliasesCountObj] = useState({});
        const [userDatabases, setUserDatabases] = useState(null);
        const { monolithStore } = useRootStore();
        const aliasesCountObjRef = useRef({});
        const [tableEdges, setTableEdges] = useState({});
        const [checkedColumnsCount, setCheckedColumnsCount] = useState(0);
        const [selectedTableNames, setSelectedTableNames] = useState(new Set());
        const [shownTables, setShownTables] = useState(new Set());
        const [joinsSet, setJoinsSet] = useState(new Set());
        const pixelStringRef = useRef<string>('');
        const pixelPartialRef = useRef<string>('');
        const [isInitLoadComplete, setIsInitLoadComplete] = useState(false);
        const [isJoinSelectOpen, setIsJoinSelectOpen] = useState(false);
        const [isDatabaseLoading, setIsDatabaseLoading] =
            useState<boolean>(false);
        const [rootTable, setRootTable] = useState(
            cell ? cell.parameters.rootTable : null,
        );
        const [importModalPixelWidth, setImportModalPixelWidth] =
            useState<string>(IMPORT_MODAL_WIDTHS.small);
        const [selectedDatabaseId, setSelectedDatabaseId] = useState(
            cell ? cell.parameters.databaseId : null,
        );
        const [initEditPrepopulateComplete, setInitEditPrepopulateComplete] =
            useState(editMode ? false : true);

        // endregion

        // region --- Import Data New useFieldArray

        const { fields: formTableFields } = useFieldArray({
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

        // endregion

        // region --- useEffects

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
                formTableFields.length &&
                !initEditPrepopulateComplete
            ) {
                prepoulateFormForEdit(cell);
            }
        }, [formTableFields]);

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

        /**
         * Retrieves the names of selected columns from watched tables.
         *
         * Iterates over a watchedTables checks each column in each table
         * and collects names of columns that are marked as checked.
         *
         * @returns {string[]} Array of strings, each representing selected column names formatted as `tableName__columnName`.
         */
        const getSelectedColumnNames = (): string[] => {
            const pixelTables: Set<string> = new Set();
            const pixelColumnNames: string[] = [];

            watchedTables.forEach(
                (tableObject: getSelectedColumnNamesTable) => {
                    const currTableColumns = tableObject.columns;

                    currTableColumns.forEach((columnObject) => {
                        if (columnObject.checked) {
                            pixelTables.add(columnObject.tableName);
                            pixelColumnNames.push(
                                `${columnObject.tableName}__${columnObject.columnName}`,
                            );
                        }
                    });
                },
            );

            return pixelColumnNames;
        };

        /**
         * Retrieves the user-defined aliases of selected columns from watchedTables from useForm.
         *
         * Function iterates over a global `watchedTables` array, checks each column in each table,
         * and collects the user-defined aliases of columns that are marked as checked.
         *
         * @returns {string[]} An array of strings, each for user-defined alias of a selected column.
         */
        const getColumnAliases = (): string[] => {
            const pixelTables: Set<string> = new Set();
            const pixelColumnAliases: string[] = [];

            watchedTables.forEach((tableObject: GetColumnAliasesTable) => {
                const currTableColumns: GetColumnAliasesColumn[] =
                    tableObject.columns;

                currTableColumns.forEach(
                    (columnObject: GetColumnAliasesColumn) => {
                        if (columnObject.checked) {
                            pixelTables.add(columnObject.tableName);
                            pixelColumnAliases.push(columnObject.userAlias);
                        }
                    },
                );
            });

            return pixelColumnAliases;
        };

        /**
         * Appends new cell to notebook with specified widget configuration.
         *
         * Function generates new cell ID, configures cell based on provided widget,
         * and dispatches action to add new cell to state. Also handles specific widget
         * configurations such as DataImportCellConfig CodeCellConfig etc.
         *
         * @param {string} widget - Widget type to used for new cell.
         */
        const appendCell = (widget: string): void => {
            try {
                const newCellId = `${Math.floor(Math.random() * 100000)}`;

                const config: AppendNewCellAction['payload']['config'] = {
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

        /**
         * Retrieves the names of tables with selected columns from watched tables.
         *
         * This function iterates over a global `watchedTables` array, checks each column in each table,
         * and collects the names of tables that have columns marked as checked.
         *
         * @returns {Set<string>} A set of strings, each representing the name of a table with selected columns.
         */
        const retrieveSelectedTableNames = (): Set<string> => {
            const pixelTables: Set<string> = new Set();
            const pixelColumnNames: string[] = [];
            const pixelColumnAliases: string[] = [];

            watchedTables?.forEach(
                (tableObject: RetrieveSelectedTableNamesTable) => {
                    const currTableColumns: RetrieveSelectedTableNamesColumn[] =
                        tableObject.columns;
                    currTableColumns.forEach(
                        (columnObject: RetrieveSelectedTableNamesColumn) => {
                            if (columnObject.checked) {
                                pixelTables.add(columnObject.tableName);
                                pixelColumnNames.push(
                                    `${columnObject.tableName}__${columnObject.columnName}`,
                                );
                                pixelColumnAliases.push(columnObject.userAlias);
                            }
                        },
                    );
                },
            );

            return pixelTables;
        };

        /**
         * Updates the parameters of the current cell with the latest selected table names, columns, and other configurations.
         *
         * This function retrieves the current selections and configurations, then dispatches multiple update actions
         * to update the parameters of the current cell in the state.
         */
        const updateSubmitDispatches = (): void => {
            const currTableNamesSet: Set<string> = retrieveSelectedTableNames();
            const currTableNames: string[] = Array.from(currTableNamesSet);
            const currSelectedColumns: string[] = retrieveSelectedColumnNames();
            const currColumnAliases: string[] = retrieveColumnAliasNames();

            const dispatchUpdate = (path: string, value: any) => {
                state.dispatch({
                    message: ActionMessages.UPDATE_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                        path: path,
                        value: value,
                    } as UpdateCellPayload,
                });
            };

            dispatchUpdate('parameters.tableNames', currTableNames);
            dispatchUpdate('parameters.selectedColumns', currSelectedColumns);
            dispatchUpdate('parameters.columnAliases', currColumnAliases);
            dispatchUpdate('parameters.joins', joinElements);
            dispatchUpdate('parameters.rootTable', rootTable);
            dispatchUpdate('parameters.selectQuery', pixelPartialRef.current);
            dispatchUpdate('parameters.databaseId', selectedDatabaseId);
            dispatchUpdate('parameters.joins', watchedJoins);
        };

        /**
         * Handles the submission of import data.
         *
         * This function performs different actions based on whether the application is in edit mode.
         * It retrieves preview data, updates or appends a cell, closes the import modal, and updates the modal state.
         *
         * @param {FormValues} data - The data submitted from the import form.
         */
        const onImportDataSubmit = (_data: FormValues): void => {
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

        /**
         * Closes the data import modal.
         *
         * This function sets the state to close the data import modal by setting `setIsDataImportModalOpen` to `false`.
         */
        const closeImportModalHandler = (): void => {
            setIsDataImportModalOpen(false);
        };

        /**
         * Retrieves database tables and edges for the data import modal.
         *
         * This function retrieves the structure of tables and edges from a specified database,
         * processes the response, and updates the state accordingly.
         *
         * @param {string} databaseId - The ID of the database to retrieve information from.
         */
        const retrieveDatabaseTablesAndEdges = async (
            databaseId: string,
        ): Promise<void> => {
            setIsDatabaseLoading(true);
            const pixelString = `META|GetDatabaseTableStructure(database=[ \"${databaseId}\" ]);META|GetDatabaseMetamodel( database=[ \"${databaseId}\" ], options=["dataTypes","positions"]);`;

            try {
                const pixelResponse = await monolithStore.runQuery(pixelString);

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

                let newTableNames: string[] = [];

                if (isResponseTableStructureGood) {
                    newTableNames = [
                        ...responseTableStructure.reduce(
                            (set: Set<string>, ele: any[]) => {
                                set.add(ele[0]);
                                return set;
                            },
                            new Set<string>(),
                        ),
                    ];

                    const tableColumnsObject = responseTableStructure.reduce(
                        (
                            acc: Record<string, RetrieveDatabaseTableColumn[]>,
                            ele: any[],
                        ) => {
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
                                userAlias: columnName,
                                checked: true,
                            });

                            return acc;
                        },
                        {},
                    );

                    const newTableColumnsObject: RetrieveDatabaseTable[] =
                        tableColumnsObject
                            ? Object.keys(tableColumnsObject).map(
                                  (tableName, tableIdx) => ({
                                      id: tableIdx,
                                      name: tableName,
                                      columns: tableColumnsObject[
                                          tableName
                                      ].map((colObj, colIdx) => ({
                                          id: colIdx,
                                          tableName: tableName,
                                          columnName: colObj.columnName,
                                          columnType: colObj.columnType,
                                          userAlias: colObj.userAlias,
                                          checked: false,
                                      })),
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
                        responseTableEdgesStructure.edges.reduce(
                            (
                                acc: Record<
                                    string,
                                    Record<
                                        string,
                                        {
                                            sourceColumn: string;
                                            targetColumn: string;
                                        }
                                    >
                                >,
                                ele: RetrieveDatabaseEdge,
                            ) => {
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
                            },
                            {},
                        );

                    setTableEdgesObject(newEdgesDict);
                } else {
                    console.error('Error retrieving database edges');
                    notification.add({
                        color: 'error',
                        message: `Error retrieving database edges`,
                    });
                }

                const edges = pixelResponse.pixelReturn[1].output.edges;
                const newTableEdges: Record<
                    string,
                    Record<string, string>
                > = {};
                edges.forEach((edge: RetrieveDatabaseEdge) => {
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
            } catch (error) {
                console.error('Error running pixel query', error);
                notification.add({
                    color: 'error',
                    message: `Error running pixel query`,
                });
            } finally {
                if (!editMode) {
                    setAliasesCountObj({});
                    aliasesCountObjRef.current = {};
                    removeJoinElement();
                }
                setIsInitLoadComplete(true);
            }
        };

        /**
         * Retrieves the alias names of columns from watched tables.
         *
         * This function iterates over a global `watchedTables` array, checks each column in each table,
         * and collects the alias names of columns that are marked as checked.
         *
         * @returns {string[]} An array of strings, each representing the alias name of a selected column.
         */
        const retrieveColumnAliasNames = (): string[] => {
            const pixelTables: Set<string> = new Set();
            const pixelColumnNames: string[] = [];
            const pixelColumnAliases: string[] = [];

            watchedTables?.forEach(
                (tableObject: RetrieveColumnAliasNamesTable) => {
                    const currTableColumns: RetrieveColumnAliasNamesColumn[] =
                        tableObject.columns;
                    currTableColumns.forEach(
                        (columnObject: RetrieveColumnAliasNamesColumn) => {
                            if (columnObject.checked) {
                                pixelTables.add(columnObject.tableName);
                                pixelColumnNames.push(
                                    `${columnObject.tableName}__${columnObject.columnName}`,
                                );
                                pixelColumnAliases.push(columnObject.userAlias);
                            }
                        },
                    );
                },
            );

            return pixelColumnAliases;
        };

        /**
         * Retrieves the selected column names from watched tables.
         *
         * This function iterates over a global `watchedTables` array, checks each column in each table,
         * and collects the names of columns that are marked as checked.
         *
         * @returns {string[]} An array of strings, each representing the name of a selected column.
         */
        const retrieveSelectedColumnNames = (): string[] => {
            const pixelTables: Set<string> = new Set();
            const pixelColumnNames: string[] = [];
            const pixelColumnAliases: string[] = [];

            watchedTables?.forEach(
                (tableObject: RetrieveSelectedColumnNamesTable) => {
                    const currTableColumns: RetrieveSelectedColumnNamesColumn[] =
                        tableObject.columns;
                    currTableColumns.forEach(
                        (columnObject: RetrieveSelectedColumnNamesColumn) => {
                            if (columnObject.checked) {
                                pixelTables.add(columnObject.tableName);
                                pixelColumnNames.push(
                                    `${columnObject.tableName}__${columnObject.columnName}`,
                                );
                                pixelColumnAliases.push(columnObject.userAlias);
                            }
                        },
                    );
                },
            );

            return pixelColumnNames;
        };

        /**
         * Updates the selected table names based on the checked columns in watched tables.
         *
         * This function iterates over a global `watchedTables` array, checks each column in each table,
         * and collects the names of tables that have at least one column marked as checked.
         * It then updates the state with the set of selected table names.
         */
        const updateSelectedTables = (): void => {
            const pixelTables: Set<string> = new Set();
            const pixelColumnNames: string[] = [];
            const pixelColumnAliases: string[] = [];

            watchedTables?.forEach((tableObject: UpdateSelectedTablesTable) => {
                const currTableColumns: UpdateSelectedTablesColumn[] =
                    tableObject.columns;
                currTableColumns.forEach(
                    (columnObject: UpdateSelectedTablesColumn) => {
                        if (columnObject.checked) {
                            pixelTables.add(columnObject.tableName);
                            pixelColumnNames.push(
                                `${columnObject.tableName}__${columnObject.columnName}`,
                            );
                            pixelColumnAliases.push(columnObject.userAlias);
                        }
                    },
                );
            });

            setSelectedTableNames(pixelTables);
        };

        /**
         * Retrieves preview data from the database.
         *
         * This function constructs a query string based on selected tables, columns, and joins,
         * runs the query, and updates the state with the retrieved data.
         */
        const retrievePreviewData = async (): Promise<void> => {
            setIsDatabaseLoading(true);

            const databaseId = selectedDatabaseId;
            const pixelTables: Set<string> = new Set();
            const pixelColumnNames: string[] = [];
            const pixelColumnAliases: string[] = [];
            const pixelJoins: string[] = [];

            watchedTables.forEach((tableObject: RetrievePreviewDataTable) => {
                const currTableColumns: RetrievePreviewDataColumn[] =
                    tableObject.columns;
                currTableColumns.forEach(
                    (columnObject: RetrievePreviewDataColumn) => {
                        if (columnObject.checked) {
                            pixelTables.add(columnObject.tableName);
                            pixelColumnNames.push(
                                `${columnObject.tableName}__${columnObject.columnName}`,
                            );
                            pixelColumnAliases.push(columnObject.userAlias);
                        }
                    },
                );
            });

            watchedJoins.forEach((joinEle) => {
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

            try {
                const response = await monolithStore.runQuery(reactorPixel);
                const type = response.pixelReturn[0]?.operationType;
                const tableHeadersData =
                    response.pixelReturn[1]?.output?.data?.headers;
                const tableRowsData =
                    response.pixelReturn[1]?.output?.data?.values;

                if (type.indexOf('ERROR') !== -1) {
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
            } catch (error) {
                console.error('Error running pixel query', error);
                notification.add({
                    color: 'error',
                    message: `Error running pixel query`,
                });
            } finally {
                setIsDatabaseLoading(false);
            }
        };

        /**
         * Helper function to update the alias tracker object.
         *
         * This function updates the alias count object based on whether an alias is being added or removed.
         * It also handles updating the count for an old alias if provided.
         *
         * @param {boolean} isBeingAdded - Indicates whether the alias is being added (true) or removed (false).
         * @param {string} newAlias - The new alias to be added or removed.
         * @param {string | null} [oldAlias=null] - The old alias to be decremented, if applicable.
         */
        const updateAliasCountObj = (
            isBeingAdded: boolean,
            newAlias: string,
            oldAlias: string | null = null,
        ): void => {
            const newAliasesCountObj: AliasCountObject = { ...aliasesCountObj };

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

            if (oldAlias !== null) {
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

        /**
         * Finds all joinable tables for a given root table.
         *
         * This function retrieves all tables that can be joined with the specified root table
         * and updates the state with the set of joinable tables.
         *
         * @param {string} rootTableName - The name of the root table to find joinable tables for.
         */
        const findAllJoinableTables = (rootTableName: string): void => {
            const joinableTables: string[] = tableEdges[rootTableName]
                ? Object.keys(tableEdges[rootTableName])
                : [];
            const newShownTables: Set<string> = new Set([
                ...joinableTables,
                rootTableName,
            ]);
            setShownTables(newShownTables);
        };

        /**
         * Handles the checkbox state change for a given table and column.
         *
         * This function updates the alias count object, manages the state of checked columns,
         * and updates the set of shown tables based on the checkbox state.
         *
         * @param {number} tableIndex - The index of the table in the watchedTables array.
         * @param {number} columnIndex - The index of the column in the table's columns array.
         * @param {boolean} [checkAll=false] - Indicates whether to check all columns.
         */
        const checkBoxHandler = (
            tableIndex: number,
            columnIndex: number,
            checkAll: boolean = false,
        ): void => {
            const columnObject: CheckBoxHandlerColumn =
                watchedTables[tableIndex].columns[columnIndex];
            updateAliasCountObj(columnObject?.checked, columnObject.userAlias);

            // if (checkAll) {
            //     formSetValue(
            //         `tables.${tableIndex}.columns.${columnIndex}.checked`,
            //         true,
            //     );
            // }

            if (columnObject?.checked) {
                if (checkedColumnsCount === 0) {
                    // if (!checkAll || columnIndex === 1) {
                    //     findAllJoinableTables(watchedTables[tableIndex].name);
                    // }
                    findAllJoinableTables(watchedTables[tableIndex].name);
                    setRootTable(watchedTables[tableIndex].name);
                }
                setCheckedColumnsCount(checkedColumnsCount + 1);
            } else if (columnObject?.checked === false) {
                if (checkedColumnsCount === 1) {
                    setShownTables(new Set(tableNames));
                    setRootTable(null);
                }
                setCheckedColumnsCount(checkedColumnsCount - 1);
            }
            setJoinsStackHandler();
        };

        /**
         * Pre-populates the form for editing based on the provided cell data.
         *
         * This function sets up the form state by marking the appropriate columns as checked,
         * setting their aliases, and configuring the joins based on the cell data.
         *
         * @param {Cell} cell - The cell object containing parameters for pre-populating the form.
         */
        const prepoulateFormForEdit = (cell): void => {
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

            if (formTableFields) {
                formTableFields.forEach((newTableObj, tableIdx) => {
                    if (tablesWithCheckedBoxes.has(newTableObj.name)) {
                        const watchedTableColumns =
                            watchedTables[tableIdx].columns;
                        watchedTableColumns.forEach(
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

        /**
         * Checks if the specified table has any selected columns.
         *
         * This function iterates through the watched tables and their columns to determine
         * if any column in the specified table is checked.
         *
         * @param {string} tableName - The name of the table to check for selected columns.
         * @returns {boolean} - Returns true if any column in the specified table is checked, otherwise false.
         */
        const checkTableForSelectedColumns = (tableName: string): boolean => {
            for (let i = 0; i < watchedTables.length; i++) {
                const currTable: CheckForSelectedTable = watchedTables[i];
                if (currTable.name === tableName) {
                    const currTableColumns: CheckForSelectedColumn[] =
                        currTable.columns;
                    for (let j = 0; j < currTableColumns.length; j++) {
                        const currColumn: CheckForSelectedColumn =
                            currTableColumns[j];
                        if (currColumn.checked === true) return true;
                    }
                }
            }
            return false;
        };

        /**
         * Handles the stack of joins based on the count of checked columns.
         *
         * This function manages the join elements by adding or removing them based on the
         * checked columns in the tables. It ensures that the joins are correctly set up
         * when there are at least two checked columns.
         */
        const setJoinsStackHandler = (): void => {
            if (checkedColumnsCount < 2) {
                removeJoinElement();
                setJoinsSet(new Set());
            } else {
                const leftTable: string = rootTable;
                const rightTables:
                    | [string, SetJoinsStackHandlerTableEdgeEntry][]
                    | undefined =
                    tableEdgesObject[rootTable] &&
                    tableEdgesObject &&
                    Object.entries(tableEdgesObject[rootTable]);

                rightTables?.forEach((entry) => {
                    const rightTable: string = entry[0];
                    const leftKey: string = entry[1]['sourceColumn'];
                    const rightKey: string = entry[1]['targetColumn'];

                    const leftTableContainsCheckedColumns: boolean =
                        checkTableForSelectedColumns(leftTable);
                    const rightTableContainsCheckedColumns: boolean =
                        checkTableForSelectedColumns(rightTable);

                    const defaultJoinType: string = 'inner';

                    const joinsSetString: string = `${leftTable}:${rightTable}`;
                    if (
                        leftTableContainsCheckedColumns &&
                        rightTableContainsCheckedColumns &&
                        !joinsSet.has(joinsSetString)
                    ) {
                        const joinElement: SetJoinsStackHandlerJoinElement = {
                            leftTable: leftTable,
                            rightTable: rightTable,
                            joinType: defaultJoinType,
                            leftKey: leftKey,
                            rightKey: rightKey,
                        };
                        appendJoinElement(joinElement);
                        addToJoinsSetHelper(joinsSetString);
                    } else if (
                        !leftTableContainsCheckedColumns ||
                        (!rightTableContainsCheckedColumns &&
                            joinsSet.has(joinsSetString))
                    ) {
                        joinsSet.delete(joinsSetString);
                        joinElements.some((ele, idx) => {
                            if (
                                leftTable === ele.leftTable &&
                                rightTable === ele.rightTable &&
                                defaultJoinType === ele.joinType &&
                                leftKey === ele.leftKey &&
                                rightKey === ele.rightKey
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

        /**
         * Adds a new join set string to the joins set.
         *
         * This function creates a copy of the current joins set, adds the new join set string to it,
         * and updates the state with the new set.
         *
         * @param {string} newJoinSet - The new join set string to add to the joins set.
         */
        const addToJoinsSetHelper = (newJoinSet: string): void => {
            const joinsSetCopy = new Set(joinsSet);
            joinsSetCopy.add(newJoinSet);
            setJoinsSet(joinsSetCopy);
        };

        /** TODO Finish function to add all the columns from a Table */
        const addAllTableColumnsHandler = (table, tableIndex) => {
            table.columns.forEach((column, columnIndex) => {
                // causing bugg behavior in joins stack
                // checkBoxHandler(parseInt(tableIndex), parseInt(columnIndex), true)
            });
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
                            <IconButton onClick={closeImportModalHandler}>
                                <Close />
                            </IconButton>
                        </StyledModalTitleWrapper>

                        {isDatabaseLoading && (
                            <LoadingScreen.Trigger description="Awaiting database response..." />
                        )}

                        {(isDatabaseLoading || !selectedDatabaseId) && (
                            <StyledPaddedStack spacing={1} direction="column">
                                {!selectedDatabaseId && (
                                    <Typography
                                        variant="subtitle2"
                                        color="secondary"
                                    >
                                        Select a Database for Import
                                    </Typography>
                                )}
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
                                            {formTableFields.map(
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
                                                                                    onClick={() => {
                                                                                        addAllTableColumnsHandler(
                                                                                            table,
                                                                                            tableIndex,
                                                                                        );
                                                                                    }}
                                                                                    color="primary"
                                                                                    // disabled={
                                                                                    //     true
                                                                                    // }
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
                            <StyledPaddedStack spacing={1} direction="column">
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
                            {/* <Button
                                variant="outlined"
                                color="primary"
                                size="medium"
                                disabled
                                startIcon={<ControlPointDuplicateRounded />}
                                onClick={() => {
                                    // create addSummaryHandler
                                }}
                            >
                                Summarize
                            </Button> */}
                            <Button
                                variant="outlined"
                                color="primary"
                                size="medium"
                                disabled
                                startIcon={<ControlPointDuplicateRounded />}
                                onClick={() => {
                                    // create addCalculationHandler
                                }}
                            >
                                Add Calculation
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
