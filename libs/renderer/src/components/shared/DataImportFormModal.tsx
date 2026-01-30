import {
	CropFree,
	DriveFileRenameOutlineRounded,
	KeyboardArrowDown,
} from "@mui/icons-material";
import { Box, TableContainer } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { DATA_FRAME_TYPES, runPixel, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	InputAdornment,
	Menu,
	Modal,
	Select,
	Stack,
	styled,
	Table,
	TextField,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useBlocks } from "../../hooks";
import {
	ActionMessages,
	type CellStateConfig,
	type NewCellAction,
	type QueryState,
} from "../../store";
import { DefaultCells } from "../cell-defaults";
import { CodeCellConfig } from "../cell-defaults/code-cell";
import {
	DataImportCellConfig,
	type DataImportCellDef,
} from "../cell-defaults/data-import-cell";
import { DatabaseAccordions } from "../cell-defaults/query-import-cell/DatabaseAccordions";

const StyledDivFitContent = styled("div")(() => ({
	width: "fit-content",
	blockSize: "fit-content",
	display: "flex",
}));

const StyledSelectMinWidth = styled(Select)(() => ({
	minWidth: "220px",
}));

const StyledModalActionsUnpadded = styled(Modal.Actions)(() => ({
	display: "flex",
	justifyContent: "flex-end",
	padding: "0px",
}));

const StyledPaddedStack = styled(Stack)(() => ({
	backgroundColor: "#FAFAFA",
	padding: "16px 16px 16px 16px",
	marginBottom: "15px",
}));

const StyledModalTitle = styled(Typography)(() => ({
	alignContent: "center",
	marginRight: "15px",
}));

const StyledModalTitleWrapper = styled(Modal.Title)(() => ({
	justifyContent: "space-between",
	alignContent: "center",
	display: "flex",
	padding: "0px",
	marginBottom: "15px",
	marginTop: "25px",
}));

const ScrollTableSetContainer = styled(TableContainer)(() => ({
	maxHeight: "350px",
	overflowY: "scroll",
}));

const StyledTableSetWrapper = styled("div")(() => ({
	backgroundColor: "#fff",
	marginBottom: "20px",
}));

const StyledTableTitle = styled(Typography)(() => ({
	marginTop: "15px",
	marginLeft: "15px",
	marginBottom: "20px",
}));

const StyledEditColumnsWrapper = styled("div")<{ showPreview: boolean }>(
	({ showPreview }) => ({
		height: showPreview ? "65%" : "100%",
		display: "flex",
		flexDirection: "column",
		overflow: "auto",
		transition: "height 0.3s ease",
		paddingRight: "8px",
	}),
);

const StyledPreviewWrapper = styled("div")(() => ({
	height: "35%",
	display: "flex",
	flexDirection: "column",
	overflow: "hidden",
	marginTop: "16px",
}));

const StyledSplitContainer = styled("div")(({ theme }) => ({
	display: "grid",
	gridTemplateColumns: "400px 1fr",
	gap: theme.spacing(2),
	flex: 1,
	overflow: "hidden",
}));

const StyledColumnsSection = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	overflow: "hidden",
	overflowY: "auto",
	borderRight: `1px solid ${theme.palette.divider}`,
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
}));

const StyledEditorSection = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
	overflow: "hidden",
	overflowY: "auto",
	paddingBottom: theme.spacing(2),
}));

const StyledSelect = styled(Select)(({ theme }) => ({
	"& .MuiSelect-select": {
		color: theme.palette.text.secondary,
		display: "flex",
		gap: theme.spacing(1),
		alignItems: "center",
		textOverflow: "ellipsis",
		overflow: "hidden",
		whiteSpace: "nowrap",
		"&:focus": {
			backgroundColor: "inherit !important",
		},
	},
}));

const StyledSelectItem = styled(Select.Item)(({ theme }) => ({
	display: "flex",
	gap: theme.spacing(1),
	color: theme.palette.text.secondary,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
	"& .MuiInputBase-root": {
		color: theme.palette.text.secondary,
		display: "flex",
		gap: theme.spacing(1),
		height: "30px",
	},
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

interface TableInterface {
	id: number;
	columns: Column[];
	name: string;
}

type FormValues = {
	databaseSelect: string;
	joins: JoinElement[];
	tables: TableInterface[];
};

const IMPORT_MODAL_WIDTHS = {
	small: "600px",
	medium: "1550px",
	large: "1550px",
};

export const DataImportFormModal = observer(
	(props: {
		query?: QueryState;
		previousCellId?: string;
		setIsDataImportModalOpen: (open: boolean) => void;
		editMode?: boolean;
		cell?: {
			id: string;
			query: QueryState;
			parameters: DataImportCellDef["parameters"];
		};
	}): JSX.Element => {
		const {
			query,
			previousCellId,
			setIsDataImportModalOpen,
			editMode,
			cell,
		} = props;

		const { state, notebook } = useBlocks();

		const {
			control: formControl,
			reset: formReset,
			handleSubmit: formHandleSubmit,
			watch: dataImportwatch,
		} = useForm<FormValues>();

		const watchedTables = dataImportwatch("tables");
		const [userDatabases, setUserDatabases] = useState<{
			ids: string[];
			display: Record<string, string>;
		}>({ ids: [], display: {} });
		const [importModalPixelWidth, setImportModalPixelWidth] =
			useState<string>(IMPORT_MODAL_WIDTHS.small);
		const [databaseTableHeaders, setDatabaseTableHeaders] = useState<
			string[]
		>([]);
		const [selectedDatabaseId, setSelectedDatabaseId] = useState(
			cell ? cell.parameters.databaseId : null,
		);
		const [databaseTableRows, setDatabaseTableRows] = useState<unknown[][]>(
			[],
		);
		const [_tableNames, setTableNames] = useState<string[]>([]);
		const [isDatabaseLoading, setIsDatabaseLoading] =
			useState<boolean>(false);
		const [showPreview, setShowTablePreview] = useState<boolean>(false);
		const [previewError, setPreviewError] = useState<string | null>(null);
		const [aliasesCountObj, setAliasesCountObj] = useState({});
		const aliasesCountObjRef = useRef({});

		const [rootTable, setRootTable] = useState(
			cell ? cell.parameters.rootTable : null,
		);
		const [dataLimit, setDataLimit] = useState(
			cell && cell.parameters.dataLimit !== -1
				? cell.parameters.dataLimit
				: "",
		);

		// Frame Inputs
		const [frameType, setFrameType] = useState(
			cell?.parameters?.frameType || "GRID",
		);
		const [frameVariableName, setFrameVariableName] = useState(
			cell?.parameters?.frameVariableName || null,
		);

		// Batching Inputs
		const [enableBatching, setEnableBatching] = useState(
			cell?.parameters?.enableBatching ?? false,
		);
		const [batchSize, setBatchSize] = useState<number | "">(
			cell?.parameters?.batchSize ?? 100,
		);

		const [checkedColumnsCount, setCheckedColumnsCount] = useState(0);
		const [_shownTables, setShownTables] = useState(new Set());
		const [selectedColumnsData, setSelectedColumnsData] = useState<{
			[tableName: string]: {
				columnName: string;
				columnType: string;
				alias: string;
			}[];
		}>({});

		const pixelStringRef = useRef<string>("");
		const pixelPartialRef = useRef<string>("");
		const [_isInitLoadComplete, setIsInitLoadComplete] = useState(false);

		const [initEditPrepopulateComplete, setInitEditPrepopulateComplete] =
			useState(false);

		const { fields: newTableFields } = useFieldArray({
			control: formControl,
			name: "tables",
		});

		const notification = useNotification();

		const myDbs = usePixel<{ app_id: string; app_name: string }[]>(
			`MyEngines(engineTypes=['DATABASE']);`,
		);
		// biome-ignore lint/correctness/useExhaustiveDependencies: retrieveDatabaseTablesAndEdges is a function
		useEffect(() => {
			if (editMode && cell?.parameters.databaseId) {
				retrieveDatabaseTablesAndEdges(cell.parameters.databaseId);
			}
		}, [editMode, cell?.parameters.databaseId]);

		useEffect(() => {
			const count = Object.values(selectedColumnsData).reduce(
				(total, columns) => total + columns.length,
				0,
			);
			setCheckedColumnsCount(count);
		}, [selectedColumnsData]);

		useEffect(() => {
			setShowTablePreview(false);
			setPreviewError(null);
		}, []);
		// biome-ignore lint/correctness/useExhaustiveDependencies: prepoulateFormForEdit is a function
		useEffect(() => {
			if (
				editMode &&
				checkedColumnsCount === 0 &&
				cell?.parameters.databaseId === selectedDatabaseId &&
				newTableFields.length &&
				!initEditPrepopulateComplete
			) {
				prepoulateFormForEdit(cell);
			}
		}, [
			editMode,
			checkedColumnsCount,
			cell,
			cell?.parameters.databaseId,
			selectedDatabaseId,
			newTableFields,
			initEditPrepopulateComplete,
		]);

		// After user databases are loaded, set the database ids and names
		// If no database is selected in the cell, set the first database as default
		useEffect(() => {
			if (myDbs.status !== "SUCCESS") {
				return;
			}

			const dbIds: string[] = [];
			const dbDisplay: Record<string, string> = {};
			myDbs.data?.forEach((db) => {
				dbIds.push(db.app_id);
				dbDisplay[db.app_id] = db.app_name;
			});
			setUserDatabases({
				// loading: false,
				ids: dbIds,
				display: dbDisplay,
			});
		}, [myDbs.status, myDbs.data]);
		// biome-ignore lint/correctness/useExhaustiveDependencies: retrievePreviewData is a functions
		useEffect(() => {
			if (showPreview && checkedColumnsCount > 0) {
				retrievePreviewData();
			}
		}, [
			aliasesCountObj,
			checkedColumnsCount,
			showPreview,
			selectedDatabaseId,
		]);

		const handleDataLimitUpdate = (
			e: React.ChangeEvent<HTMLInputElement>,
		) => {
			const inputValue = e.target.value;

			// Handle empty string - set to -1 (no limit)
			if (inputValue === "") {
				setDataLimit("");
				return;
			}

			let value = parseInt(inputValue, 10);
			if (Number.isNaN(value)) {
				return; // Don't update if invalid
			}

			// Clamp value between 1 and 10000
			if (value <= 0) {
				value = 1;
			}
			if (value >= 10000) {
				value = 10000;
			}

			setDataLimit(value);
		};

		const getSelectedColumnNames = () => {
			const pixelColumnNames: string[] = [];

			Object.keys(selectedColumnsData).forEach((tableName) => {
				selectedColumnsData[tableName].forEach((column) => {
					pixelColumnNames.push(`${tableName}__${column.columnName}`);
				});
			});

			return pixelColumnNames;
		};

		const getColumnAliases = () => {
			const pixelColumnAliases: string[] = [];

			Object.keys(selectedColumnsData).forEach((tableName) => {
				selectedColumnsData[tableName].forEach((column) => {
					pixelColumnAliases.push(column.alias);
				});
			});

			return pixelColumnAliases;
		};

		/** Create a New Cell and Add to Notebook */
		const appendCell = async (widget: string) => {
			try {
				const config: NewCellAction["payload"]["config"] = {
					widget: DefaultCells[widget].widget,
					parameters: DefaultCells[widget].parameters,
				};

				if (widget === DataImportCellConfig.widget) {
					const currTableNamesSet = retrieveSelectedTableNames();
					const currTableNames = Array.from(currTableNamesSet);

					config.parameters = {
						...DefaultCells[widget].parameters,
						frameVariableName: frameVariableName,
						frameType: frameType,
						databaseId: selectedDatabaseId,
						selectQuery: pixelPartialRef.current,
						tableNames: currTableNames,
						selectedColumns: getSelectedColumnNames(),
						columnAliases: getColumnAliases(),
						rootTable: rootTable,
						enableBatching: enableBatching,
						batchSize: batchSize,
						currentOffset: 0,
						dataLimit: dataLimit === "" ? -1 : dataLimit,
					};
				}

				if (
					previousCellId &&
					query &&
					state.queries[query.id].cells[previousCellId].widget ===
						widget &&
					widget === CodeCellConfig.widget
				) {
					const previousCellType =
						state.queries[query.id].cells[previousCellId].parameters
							?.type ?? "pixel";
					config.parameters = {
						...DefaultCells[widget].parameters,
						type: previousCellType,
					};
				}

				const newCellId = (await state.dispatch({
					message: ActionMessages.NEW_CELL,
					payload: {
						queryId: query?.id ?? "",
						previousCellId: previousCellId ?? "",
						config: config as Omit<CellStateConfig, "id">,
					},
				})) as string;

				state.dispatch({
					message: ActionMessages.ADD_VARIABLE,
					payload: {
						id: `${query?.id}--${newCellId}`,
						type: "cell",
						to: query?.id,
						cellId: newCellId,
					},
				});

				notebook.selectCell(query?.id ?? "", newCellId);
			} catch (e) {
				console.error(e);
			}
		};

		const updateSubmitDispatches = () => {
			const currTableNamesSet = retrieveSelectedTableNames();
			const currTableNames = Array.from(currTableNamesSet);
			const currSelectedColumns = retrieveSelectedColumnNames();

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.tableNames",
					value: currTableNames,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.selectedColumns",
					value: currSelectedColumns,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.columnAliases",
					value: getColumnAliases(),
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.rootTable",
					value: rootTable,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.selectQuery",
					value: pixelPartialRef.current,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.databaseId",
					value: selectedDatabaseId,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.dataLimit",
					value: dataLimit === "" ? -1 : dataLimit,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.frameType",
					value: frameType,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.frameVariableName",
					value: frameVariableName,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.enableBatching",
					value: enableBatching,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell?.query.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.batchSize",
					value: batchSize,
				},
			});

			// Always reset offset to 0 when importing
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: query?.id ?? "",
					cellId: cell?.id ?? "",
					path: "parameters.currentOffset",
					value: 0,
				},
			});

			// Run the cell
			state.dispatch({
				message: ActionMessages.RUN_CELL,
				payload: {
					queryId: query?.id ?? "",
					cellId: cell?.id ?? "",
				},
			});
		};

		/** Submit handler for data import form */
		const onImportDataSubmit = (data: FormValues) => {
			console.log("submitted data", data);
			if (editMode) {
				retrievePreviewData();
				updatePixelRef();
				updateSubmitDispatches();
			} else {
				retrievePreviewData();
				appendCell("data-import");
			}

			closeImportModalHandler();
			setIsDataImportModalOpen(false);
		};

		/** Close and Reset Import Data Form Modal */
		const closeImportModalHandler = () => {
			setIsDataImportModalOpen(false);
		};

		/** Get Database Information for Data Import Modal */
		const retrieveDatabaseTablesAndEdges = async (databaseId: string) => {
			setIsDatabaseLoading(true);
			const pixelString = `META|GetDatabaseTableStructure(database=[ "${databaseId}" ]);META|GetDatabaseMetamodel( database=[ "${databaseId}" ], options=["dataTypes","positions"]);`;

			runPixel(pixelString).then((pixelResponse) => {
				const responseTableStructure = pixelResponse.pixelReturn[0]
					.output as string[][];
				const isResponseTableStructureGood =
					pixelResponse.pixelReturn[0].operationType.indexOf(
						"ERROR",
					) === -1;

				let newTableNames: string[] = [];

				if (isResponseTableStructureGood) {
					// Extract unique table names without using a Set
					newTableNames = responseTableStructure.reduce(
						(acc, ele) => {
							if (!acc.includes(ele[0])) {
								acc.push(ele[0]);
							}
							return acc;
						},
						[],
					);

					const tableColumnsObject = responseTableStructure.reduce(
						(acc: Record<string, unknown[]>, ele) => {
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

					const newTableColumnsObject: TableInterface[] =
						tableColumnsObject
							? Object.keys(tableColumnsObject).map(
									(tableName, tableIdx) => ({
										id: tableIdx,
										name: tableName,
										columns: (
											tableColumnsObject[
												tableName
											] as Array<{
												columnName: string;
												columnType: string;
												userAlias: string;
											}>
										).map((colObj, colIdx) => ({
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
					console.error("Error retrieving database tables");
					notification.add({
						color: "error",
						message: `Error retrieving database tables`,
					});
				}

				setIsDatabaseLoading(false);
				setImportModalPixelWidth(IMPORT_MODAL_WIDTHS.large);
				setTableNames(newTableNames);
				setShownTables(new Set(newTableNames));
				setAliasesCountObj({});
				aliasesCountObjRef.current = {};
			});

			setAliasesCountObj({});
			aliasesCountObjRef.current = {};
			setIsInitLoadComplete(true);
		};

		/**
		 * Updates pixel without building preview.
		 */
		const updatePixelRef = async (): Promise<void> => {
			try {
				const databaseId = selectedDatabaseId;
				const pixelColumnNames: string[] = [];
				const pixelColumnAliases: string[] = [];

				// Build pixel column names and aliases from selectedColumnsData
				Object.keys(selectedColumnsData).forEach((tableName) => {
					selectedColumnsData[tableName].forEach((column) => {
						pixelColumnNames.push(
							`${tableName}__${column.columnName}`,
						);
						pixelColumnAliases.push(column.alias);
					});
				});

				const limitValue = dataLimit === "" ? -1 : dataLimit;

				let pixelStringPart1 = `Database ( database = [ "${databaseId}" ] )`;
				pixelStringPart1 += ` | Select ( ${pixelColumnNames.join(" , ")} )`;
				pixelStringPart1 += `.as ( [ ${pixelColumnAliases.join(" , ")} ] )`;
				pixelStringPart1 += ` | Distinct ( false ) | Limit ( ${limitValue} )`;

				const reactorPixel = `Database ( database = [ "${databaseId}" ] ) | Select ( ${pixelColumnNames.join(
					" , ",
				)} ) .as ( [ ${pixelColumnAliases.join(
					" , ",
				)} ] ) | Distinct ( false ) | Limit ( ${limitValue} ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "consolidated_settings_FRAME932867__Preview" ] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

				pixelStringRef.current = reactorPixel;
				pixelPartialRef.current = `${pixelStringPart1};`;
			} catch {
				setIsDatabaseLoading(false);
				setShowTablePreview(false);

				notification.add({
					color: "error",
					message: `Error updating Data Import`,
				});
			}
		};

		const retrieveSelectedColumnNames = () => {
			const pixelColumnNames: string[] = [];

			Object.keys(selectedColumnsData).forEach((tableName) => {
				selectedColumnsData[tableName].forEach((column) => {
					pixelColumnNames.push(`${tableName}__${column.columnName}`);
				});
			});

			return pixelColumnNames;
		};

		const retrieveSelectedTableNames = () => {
			const pixelTables = new Set(Object.keys(selectedColumnsData));

			return pixelTables;
		};

		const retrievePreviewData = async () => {
			setIsDatabaseLoading(true);
			setPreviewError(null);
			const databaseId = selectedDatabaseId;
			const pixelColumnNames: string[] = [];
			const pixelColumnAliases: string[] = [];

			try {
				// Build column names and aliases from selectedColumnsData
				Object.keys(selectedColumnsData).forEach((tableName) => {
					selectedColumnsData[tableName].forEach((column) => {
						pixelColumnNames.push(
							`${tableName}__${column.columnName}`,
						);
						pixelColumnAliases.push(column.alias);
					});
				});

				let pixelStringPart1 = `Database ( database = [ "${databaseId}" ] )`;
				pixelStringPart1 += ` | Select ( ${pixelColumnNames.join(" , ")} )`;
				pixelStringPart1 += `.as ( [ ${pixelColumnAliases.join(" , ")} ] )`;

				pixelStringPart1 += ` | Distinct ( false ) | Limit ( -1 )`;

				// Build pixel query for preview (always use -1 for no limit in preview)
				const reactorPixel = `Database ( database = [ "${databaseId}" ] ) | Select ( ${pixelColumnNames.join(
					" , ",
				)} ) .as ( [ ${pixelColumnAliases.join(
					" , ",
				)} ] ) | Distinct ( false ) | Limit ( -1 ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "data_import_preview_frame" ] ) ] ) ; META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

				pixelStringRef.current = reactorPixel;
				pixelPartialRef.current = `${pixelStringPart1};`;

				// Execute the pixel to get preview data
				runPixel(reactorPixel).then((response) => {
					const type = response.pixelReturn[0]?.operationType;

					const o = response.pixelReturn[1]?.output as {
						data: {
							values: unknown[][];
							headers: string[];
						};
					};

					const tableHeadersData = o.data?.headers;
					const tableRowsData = o.data?.values;

					if (type.indexOf("ERROR") !== -1) {
						const error = response.pixelReturn[0]?.output;
						console.error(`${error}`);
						setPreviewError(`${error}`);
						notification.add({
							color: "error",
							message: `${error}`,
						});
						setIsDatabaseLoading(false);
						return;
					}

					setDatabaseTableHeaders(tableHeadersData);
					setDatabaseTableRows(tableRowsData);
					setIsDatabaseLoading(false);
				});
			} catch (error) {
				console.error("Error in preview:", error);
				const errorMessage =
					error instanceof Error
						? error.message
						: "Error retrieving database tables";
				setPreviewError(errorMessage);
				setIsDatabaseLoading(false);

				notification.add({
					color: "error",
					message: errorMessage,
				});
			}
		};

		/** Handler for adding a single column */
		const handleAddColumn = (
			tableName: string,
			columnName: string,
			columnType: string,
		) => {
			// SINGLE TABLE SELECTION: Clear all other tables when selecting from a new table
			const currentSelectedTable = Object.keys(selectedColumnsData)[0];
			let newSelectedColumns = { ...selectedColumnsData };

			// If selecting from a different table, clear existing selections
			if (currentSelectedTable && currentSelectedTable !== tableName) {
				newSelectedColumns = {};
			}

			if (!newSelectedColumns[tableName]) {
				newSelectedColumns[tableName] = [];
			}

			// Check if column already exists
			const exists = newSelectedColumns[tableName].some(
				(col) => col.columnName === columnName,
			);

			if (!exists) {
				newSelectedColumns[tableName].push({
					columnName,
					columnType,
					alias: columnName,
				});
				setSelectedColumnsData(newSelectedColumns);

				// Update rootTable to track the selected table
				if (!rootTable || rootTable !== tableName) {
					setRootTable(tableName);
				}
			}
		};
		const handleAddAllColumns = (
			tableName: string,
			columns: { columnName: string; columnType: string }[],
		) => {
			// SINGLE TABLE SELECTION: Clear all other tables when selecting from a new table
			const newSelectedColumns: {
				[tableName: string]: {
					columnName: string;
					columnType: string;
					alias: string;
				}[];
			} = {};

			newSelectedColumns[tableName] = columns.map((col) => ({
				columnName: col.columnName,
				columnType: col.columnType,
				alias: col.columnName,
			}));

			setSelectedColumnsData(newSelectedColumns);

			// Update rootTable to track the selected table
			setRootTable(tableName);
		};

		/** Handler for removing a column */
		const handleRemoveColumn = (tableName: string, columnName: string) => {
			const newSelectedColumns = { ...selectedColumnsData };
			if (newSelectedColumns[tableName]) {
				newSelectedColumns[tableName] = newSelectedColumns[
					tableName
				].filter((col) => col.columnName !== columnName);
				if (newSelectedColumns[tableName].length === 0) {
					delete newSelectedColumns[tableName];
				}
				setSelectedColumnsData(newSelectedColumns);

				// Reset rootTable if no tables have selected columns
				if (Object.keys(newSelectedColumns).length === 0) {
					setRootTable(null);
				}
			}
		};

		/** Handler for updating a column alias */
		const handleAliasChange = (
			tableName: string,
			columnName: string,
			newAlias: string,
		) => {
			const newSelectedColumns = { ...selectedColumnsData };
			if (newSelectedColumns[tableName]) {
				const column = newSelectedColumns[tableName].find(
					(col) => col.columnName === columnName,
				);
				if (column) {
					column.alias = newAlias;
					setSelectedColumnsData(newSelectedColumns);
				}
			}
		};

		/** Handler for clearing a table */
		const handleClearTable = (tableName: string) => {
			const newSelectedColumns = { ...selectedColumnsData };
			delete newSelectedColumns[tableName];
			setSelectedColumnsData(newSelectedColumns);

			// Reset rootTable if no tables have selected columns
			if (Object.keys(newSelectedColumns).length === 0) {
				setRootTable(null);
			}
		};

		/** Pre-Populate form For Edit  */
		const prepoulateFormForEdit = (cell: {
			id: string;
			query: QueryState;
			parameters: DataImportCellDef["parameters"];
		}) => {
			const newSelectedColumnsData: {
				[tableName: string]: {
					columnName: string;
					columnType: string;
					alias: string;
				}[];
			} = {};
			const newAliasesCountObj: Record<string, number> = {};

			// Build selectedColumnsData from cell parameters
			cell.parameters.selectedColumns?.forEach(
				(selectedColumnTableCombinedString: string, idx: number) => {
					const [currTableName, currColumnName] =
						selectedColumnTableCombinedString.split("__");
					const currColumnAlias = cell.parameters.columnAliases[idx];

					// Find the column type from newTableFields
					let columnType = "STRING"; // default
					const tableField = newTableFields.find(
						(t) => t.name === currTableName,
					);
					if (tableField) {
						const column = watchedTables
							?.find((t) => t.name === currTableName)
							?.columns?.find(
								(c) => c.columnName === currColumnName,
							);
						if (column) {
							columnType = column.columnType;
						}
					}

					// Initialize table array if it doesn't exist
					if (!newSelectedColumnsData[currTableName]) {
						newSelectedColumnsData[currTableName] = [];
					}

					// Add column to selectedColumnsData
					newSelectedColumnsData[currTableName].push({
						columnName: currColumnName,
						columnType: columnType,
						alias: currColumnAlias,
					});

					// Update alias count
					newAliasesCountObj[currColumnAlias || currColumnName] = 1;
				},
			);

			// Set the populated data
			setSelectedColumnsData(newSelectedColumnsData);
			setAliasesCountObj({ ...newAliasesCountObj });
			aliasesCountObjRef.current = { ...newAliasesCountObj };

			// Set rootTable from cell parameters
			if (cell.parameters.rootTable) {
				setRootTable(cell.parameters.rootTable);
			}

			// Set checkedColumnsCount
			setCheckedColumnsCount(cell.parameters.selectedColumns.length);

			// Set pixel ref
			const loadedQueryString = cell.parameters.selectQuery;
			pixelPartialRef.current = loadedQueryString;

			// Mark prepopulation as complete
			setInitEditPrepopulateComplete(true);
		};

		return (
			<Modal open={true} maxWidth="xl">
				<Modal.Content sx={{ width: importModalPixelWidth }}>
					<form onSubmit={formHandleSubmit(onImportDataSubmit)}>
						<StyledModalTitleWrapper>
							<StyledDivFitContent>
								<StyledModalTitle variant="h6">
									Import Data from
								</StyledModalTitle>
								<Controller
									name={"databaseSelect"}
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
												setShowTablePreview(false);
												setImportModalPixelWidth(
													IMPORT_MODAL_WIDTHS.medium,
												);
												// Reset edit mode prepopulation and clear selected columns when changing database
												if (editMode) {
													setInitEditPrepopulateComplete(
														true,
													);
													setSelectedColumnsData({});
													setCheckedColumnsCount(0);
													setRootTable(null);
												}
											}}
											label={"Select Database"}
											value={field.value || ""}
											size={"small"}
										>
											{userDatabases?.ids?.map(
												(databaseId, dbIndex) => (
													<Menu.Item
														value={databaseId}
														key={`${dbIndex}-${databaseId}`}
													>
														{userDatabases.display[
															databaseId
														] ?? ""}
													</Menu.Item>
												),
											)}
										</StyledSelectMinWidth>
									)}
								/>
							</StyledDivFitContent>
						</StyledModalTitleWrapper>

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

						{selectedDatabaseId && (
							<StyledPaddedStack
								spacing={1}
								direction="column"
								sx={{
									height: "600px",
									display: "flex",
									flexDirection: "column",
								}}
							>
								<StyledEditColumnsWrapper
									showPreview={showPreview}
								>
									<StyledTableSetWrapper>
										<StyledSplitContainer>
											<StyledColumnsSection>
												<Typography variant="subtitle2">
													Available Columns
												</Typography>
												<DatabaseAccordions
													databaseId={
														selectedDatabaseId
													}
													mode="data-available"
													onAddColumn={
														handleAddColumn
													}
													onAddAllColumns={
														handleAddAllColumns
													}
													selectedTableName={
														rootTable
													}
												/>
											</StyledColumnsSection>
											<StyledEditorSection>
												<Stack
													spacing={1}
													direction={"row"}
													alignItems="center"
													justifyContent={
														"space-between"
													}
												>
													<Typography
														variant="subtitle2"
														sx={{ mb: 2 }}
													>
														Selected Columns (
														{checkedColumnsCount})
													</Typography>
													<Stack
														spacing={1}
														direction={"row"}
														alignItems="center"
														justifyContent={"end"}
													>
														{!enableBatching && (
															<StyledTextField
																type="number"
																placeholder="Data Limit"
																value={
																	dataLimit
																}
																onChange={
																	handleDataLimitUpdate
																}
																sx={{
																	width: "130px",
																}}
															/>
														)}

														<StyledSelect
															size={"small"}
															title={
																"Select Type"
															}
															value={frameType}
															SelectProps={{
																IconComponent:
																	KeyboardArrowDown,
																style: {
																	height: "30px",
																	width: "140px",
																},
																startAdornment:
																	(
																		<InputAdornment position="start">
																			<CropFree />
																		</InputAdornment>
																	),
															}}
															onChange={(e) =>
																setFrameType(
																	e.target
																		.value as
																		| "NATIVE"
																		| "PY"
																		| "R"
																		| "GRID",
																)
															}
														>
															{Object.values(
																DATA_FRAME_TYPES,
															).map(
																(frame, i) => (
																	<StyledSelectItem
																		key={`${i}-${frame.value}`}
																		value={
																			frame.value
																		}
																	>
																		{
																			frame.display
																		}
																	</StyledSelectItem>
																),
															)}
														</StyledSelect>
														<StyledTextField
															title="Set Frame Variable Name"
															value={
																frameVariableName
															}
															placeholder="Frame Name"
															InputProps={{
																startAdornment:
																	(
																		<DriveFileRenameOutlineRounded />
																	),
															}}
															onChange={(e) =>
																setFrameVariableName(
																	e.target
																		.value,
																)
															}
															sx={{
																width: "160px",
															}}
														/>
														<Box
															sx={{
																display: "flex",
																alignItems:
																	"center",
																minWidth:
																	"180px",
															}}
														>
															<Tooltip
																title={
																	enableBatching
																		? "Disable Batching"
																		: "Enable Batching"
																}
															>
																<Checkbox
																	checked={
																		enableBatching
																	}
																	label={
																		enableBatching
																			? ""
																			: "Enable Batching"
																	}
																	onChange={(
																		_event,
																		checked,
																	) => {
																		setEnableBatching(
																			checked,
																		);
																		setDataLimit(
																			"",
																		);
																	}}
																	sx={{
																		color: "text.secondary",
																	}}
																/>
															</Tooltip>
															{enableBatching && (
																<StyledTextField
																	title="Batch Size"
																	type="number"
																	placeholder="Batch Amount..."
																	value={
																		batchSize
																	}
																	onChange={(
																		e,
																	) => {
																		const inputValue =
																			e
																				.target
																				.value;
																		if (
																			inputValue ===
																			""
																		) {
																			setBatchSize(
																				"",
																			);
																			return;
																		}
																		const value =
																			Number.parseInt(
																				inputValue,
																				10,
																			);
																		if (
																			!Number.isNaN(
																				value,
																			) &&
																			value >=
																				0
																		) {
																			setBatchSize(
																				value,
																			);
																		}
																	}}
																	sx={{
																		width: "130px",
																	}}
																/>
															)}
														</Box>
													</Stack>
												</Stack>
												<DatabaseAccordions
													databaseId={
														selectedDatabaseId
													}
													mode="data-selected"
													selectedColumns={
														selectedColumnsData
													}
													onRemoveColumn={
														handleRemoveColumn
													}
													onAliasChange={
														handleAliasChange
													}
													onClearTable={
														handleClearTable
													}
												/>
											</StyledEditorSection>
										</StyledSplitContainer>
									</StyledTableSetWrapper>
								</StyledEditColumnsWrapper>

								{showPreview && (
									<StyledPreviewWrapper>
										<StyledTableSetWrapper
											style={{
												height: "100%",
												display: "flex",
												flexDirection: "column",
											}}
										>
											<StyledTableTitle variant="h6">
												Preview
											</StyledTableTitle>
											{isDatabaseLoading && (
												<Box
													sx={{
														display: "flex",
														justifyContent:
															"center",
														alignItems: "center",
														minHeight: "200px",
													}}
												>
													<Typography variant="body1">
														LOADING....
													</Typography>
												</Box>
											)}
											{checkedColumnsCount === 0 ? (
												<Box
													sx={{
														padding: "16px",
														backgroundColor:
															"#F5F5F5",
														border: "1px solid #E0E0E0",
														borderRadius: "4px",
														margin: "0 16px 16px 16px",
														textAlign: "center",
													}}
												>
													<Typography
														variant="body2"
														color="textSecondary"
													>
														Select columns to view
														preview
													</Typography>
												</Box>
											) : previewError ? (
												<Box
													sx={{
														padding: "16px",
														backgroundColor:
															"#FEF2F2",
														border: "1px solid #FCA5A5",
														borderRadius: "4px",
														margin: "0 16px 16px 16px",
													}}
												>
													<Typography
														variant="body2"
														color="error"
													>
														<strong>Error:</strong>{" "}
														{previewError}
													</Typography>
												</Box>
											) : (
												<ScrollTableSetContainer
													style={{ flex: 1 }}
												>
													<Table
														stickyHeader
														size={"small"}
													>
														<Table.Body>
															<Table.Row>
																{databaseTableHeaders.map(
																	(
																		h,
																		hIdx,
																	) => (
																		<Table.Cell
																			key={`${hIdx}-${h}`}
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
																		key={`${rIdx}-${r}`}
																	>
																		{r.map(
																			(
																				v,
																				vIdx,
																			) => (
																				<Table.Cell
																					key={`${rIdx}-${r}-${vIdx}-${v}`}
																				>
																					{typeof v ===
																						"object" &&
																					v !==
																						null
																						? JSON.stringify(
																								v,
																							)
																						: String(
																								v ??
																									"",
																							)}
																				</Table.Cell>
																			),
																		)}
																	</Table.Row>
																),
															)}
														</Table.Body>
													</Table>
												</ScrollTableSetContainer>
											)}
										</StyledTableSetWrapper>
									</StyledPreviewWrapper>
								)}
							</StyledPaddedStack>
						)}

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
								variant="outlined"
								color="primary"
								size="medium"
								disabled={
									!checkedColumnsCount ||
									Object.values(aliasesCountObj).some(
										(key) => (key as number) > 1,
									)
								}
								onClick={() => {
									setShowTablePreview(!showPreview);
								}}
							>
								{showPreview ? "Hide Preview" : "Show Preview"}
							</Button>
							<Button
								type="submit"
								variant="contained"
								color="primary"
								disabled={
									!checkedColumnsCount ||
									Object.values(aliasesCountObj).some(
										(key) => (key as number) > 1,
									) ||
									(aliasesCountObj as Record<string, number>)[
										""
									] > 0 ||
									!frameVariableName?.trim()
								}
							>
								{editMode ? "Update Cell" : "Import"}
							</Button>
						</StyledModalActionsUnpadded>
					</form>
				</Modal.Content>
			</Modal>
		);
	},
);
