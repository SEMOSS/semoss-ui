import {
	AlertTriangle,
	ArrowLeftFromLine,
	ArrowRightFromLine,
	CalendarDays,
	CopyPlus,
	Filter,
	Merge,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { runPixel, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useBlocks } from "../../hooks";
import {
	ActionMessages,
	type CellStateConfig,
	type NewCellAction,
	type QueryState,
} from "../../store";
import { DefaultCells } from "../cell-defaults";
import { CodeCellConfig } from "../cell-defaults/code-cell";
import { DataImportCellConfig } from "../cell-defaults/data-import-cell";

const JOIN_ICONS = {
	inner: <Merge className="size-4" />,
	"right.outer": <ArrowRightFromLine className="size-4" />,
	"left.outer": <ArrowLeftFromLine className="size-4" />,
	outer: <Merge className="size-4" />,
};

const SQL_COLUMN_TYPES = ["DATE", "NUMBER", "STRING", "TIMESTAMP"];

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

interface NewFormData {
	databaseSelect: string;
	tables: TableInterface[];
}

type FormValues = {
	databaseSelect: string;
	joins: JoinElement[];
	tables: TableInterface[];
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

		const [joinTypeSelectIndex, setJoinTypeSelectIndex] = useState(-1);
		const { state, notebook } = useBlocks();

		const {
			control: formControl,
			setValue: formSetValue,
			reset: formReset,
			handleSubmit: formHandleSubmit,
			watch: dataImportwatch,
		} = useForm<FormValues>();

		const watchedTables = dataImportwatch("tables");
		const watchedJoins = dataImportwatch("joins");
		const [userDatabases, setUserDatabases] = useState(null);
		const [databaseTableHeaders, setDatabaseTableHeaders] = useState([]);
		const [selectedDatabaseId, setSelectedDatabaseId] = useState(
			cell ? cell.parameters.databaseId : null,
		);
		const getDatabases = usePixel("META | GetDatabaseList ( ) ;");
		const [databaseTableRows, setDatabaseTableRows] = useState([]);
		const [tableNames, setTableNames] = useState<string[]>([]);
		const [isDatabaseLoading, setIsDatabaseLoading] =
			useState<boolean>(false);
		const [showPreview, setShowTablePreview] = useState<boolean>(false);
		const [showEditColumns, setShowEditColumns] = useState<boolean>(true);
		const [tableEdgesObject, setTableEdgesObject] = useState(null);
		const [aliasesCountObj, setAliasesCountObj] = useState({});
		const aliasesCountObjRef = useRef({});
		const [tableEdges, setTableEdges] = useState({});
		const [rootTable, setRootTable] = useState(
			cell ? cell.parameters.rootTable : null,
		);
		const [dataLimit, _setDataLimit] = useState(
			cell ? cell.parameters.dataLimit : -1,
		);

		const [checkedColumnsCount, setCheckedColumnsCount] = useState(0);
		const [selectedTableNames, setSelectedTableNames] = useState(new Set());
		const [shownTables, setShownTables] = useState(new Set());
		const [joinsSet, setJoinsSet] = useState(new Set());
		const pixelStringRef = useRef<string>("");
		const pixelPartialRef = useRef<string>("");
		const [isInitLoadComplete, setIsInitLoadComplete] = useState(false);
		const [isJoinSelectOpen, setIsJoinSelectOpen] = useState(false);
		const [initEditPrepopulateComplete, setInitEditPrepopulateComplete] =
			useState(!editMode);

		const { fields: newTableFields } = useFieldArray({
			control: formControl,
			name: "tables",
		});

		const {
			fields: joinElements,
			append: appendJoinElement,
			remove: removeJoinElement,
		} = useFieldArray({
			control: formControl,
			name: "joins",
		});

		/** Select all the rows from a Table */
		const [isAllSelected, setIsAllSelected] = useState<boolean>(false);
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
				checkedColumnsCount === 0 &&
				cell.parameters.databaseId === selectedDatabaseId &&
				newTableFields.length &&
				!initEditPrepopulateComplete
			) {
				prepoulateFormForEdit(cell);
			}
		}, [newTableFields]);

		useEffect(() => {
			if (getDatabases.status !== "SUCCESS") {
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
		const appendCell = async (widget: string) => {
			try {
				const config: NewCellAction["payload"]["config"] = {
					widget: DefaultCells[widget].widget,
					parameters: DefaultCells[widget].parameters,
				};

				if (widget === DataImportCellConfig.widget) {
					config.parameters = {
						...DefaultCells[widget].parameters,
						frameVariableName: `FRAME_${Math.floor(
							Math.random() * 100000,
						)}`,
						databaseId: selectedDatabaseId,
						joins: watchedJoins,
						selectQuery: pixelPartialRef.current,
						tableNames: Array.from(selectedTableNames),
						selectedColumns: getSelectedColumnNames(),
						columnAliases: getColumnAliases(),
						rootTable: rootTable,
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
							?.type ?? "pixel";
					config.parameters = {
						...DefaultCells[widget].parameters,
						type: previousCellType,
					};
				}

				const newCellId = (await state.dispatch({
					message: ActionMessages.NEW_CELL,
					payload: {
						queryId: query.id,
						previousCellId: previousCellId,
						config: config as Omit<CellStateConfig, "id">,
					},
				})) as string;

				state.dispatch({
					message: ActionMessages.ADD_VARIABLE,
					payload: {
						id: `${query.id}--${newCellId}`,
						type: "cell",
						to: query.id,
						cellId: newCellId,
					},
				});

				notebook.selectCell(query.id, newCellId);
			} catch (e) {
				console.error(e);
			}
		};

		/**
		 * Handles the event when a user clicks the "Select All" button in the Data Import Form Modal.
		 */
		const addAllTableColumnsHandler = (tableIndex: number) => {
			setShownTables(new Set(tableNames));
			setRootTable(watchedTables[tableIndex].name);
			const allChecked = !isAllSelected;
			const updatedColumns = watchedTables[tableIndex].columns.map(
				(column) => ({
					...column,
					checked: allChecked,
				}),
			);

			const freshAliasCountObj = {};
			updatedColumns.forEach((column) => {
				if (allChecked) {
					const alias = column.userAlias;
					if (alias in freshAliasCountObj) {
						freshAliasCountObj[alias] += 1;
					} else {
						freshAliasCountObj[alias] = 1;
					}
				}
			});

			setAliasesCountObj(freshAliasCountObj);
			aliasesCountObjRef.current = { ...freshAliasCountObj };

			formSetValue(`tables.${tableIndex}.columns`, updatedColumns, {
				shouldDirty: true,
				shouldValidate: true,
			});

			setCheckedColumnsCount(allChecked ? updatedColumns.length : 0);
			setIsAllSelected(allChecked);
			setJoinsStackHandler();
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
					path: "parameters.tableNames",
					value: currTableNames,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.selectedColumns",
					value: currSelectedColumns,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.columnAliases",
					value: getColumnAliases(),
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.joins",
					value: joinElements,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.rootTable",
					value: rootTable,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.selectQuery",
					value: pixelPartialRef.current,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.databaseId",
					value: selectedDatabaseId,
				},
			});

			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.joins",
					value: watchedJoins,
				},
			});
		};

		/** New Submit for Import Data */
		const onImportDataSubmit = (data: NewFormData) => {
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
		const retrieveDatabaseTablesAndEdges = async (databaseId) => {
			setIsDatabaseLoading(true);
			const pixelString = `META|GetDatabaseTableStructure(database=[ "${databaseId}" ]);META|GetDatabaseMetamodel( database=[ "${databaseId}" ], options=["dataTypes","positions"]);`;

			runPixel(pixelString).then((pixelResponse) => {
				const responseTableStructure = pixelResponse.pixelReturn[0]
					.output as string[][];
				const isResponseTableStructureGood =
					pixelResponse.pixelReturn[0].operationType.indexOf(
						"ERROR",
					) === -1;

				const responseTableEdgesStructure = pixelResponse.pixelReturn[1]
					.output as {
					edges: {
						relation: string;
						source: string;
						sourceColumn: string;
						target: string;
						targetColumn: string;
					}[];
				};
				const isResponseTableEdgesStructureGood =
					pixelResponse.pixelReturn[1].operationType.indexOf(
						"ERROR",
					) === -1;

				let newTableNames = [];

				if (isResponseTableStructureGood) {
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

					const newTableColumnsObject: TableInterface[] =
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
					console.error("Error retrieving database tables");
					toast.error("Error retrieving database tables");
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
					console.error("Error retrieving database edges");
					toast.error("Error retrieving database tables");
				}

				const o = pixelResponse.pixelReturn[1].output as {
					edges: {
						relation: string;
						source: string;
						sourceColumn: string;
						target: string;
						targetColumn: string;
					}[];
				};
				const edges = o.edges;

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

				setTableNames(newTableNames);
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

				let pixelStringPart1 = `Database ( database = [ "${databaseId}" ] )`;
				pixelStringPart1 += ` | Select ( ${pixelColumnNames.join(
					" , ",
				)} )`;
				pixelStringPart1 += `.as ( [ ${pixelColumnAliases.join(
					" , ",
				)} ] )`;
				if (pixelJoins.length > 0) {
					pixelStringPart1 += ` | Join ( ${pixelJoins.join(
						" , ",
					)} ) `;
				}
				pixelStringPart1 += ` | Distinct ( false ) | Limit ( ${dataLimit} )`;

				const combinedJoinString =
					pixelJoins.length > 0
						? `| Join ( ${pixelJoins.join(" , ")} ) `
						: "";

				const reactorPixel = `Database ( database = [ "${databaseId}" ] ) | Select ( ${pixelColumnNames.join(
					" , ",
				)} ) .as ( [ ${pixelColumnAliases.join(
					" , ",
				)} ] ) ${combinedJoinString}| Distinct ( false ) | Limit ( ${dataLimit} ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "consolidated_settings_FRAME932867__Preview" ] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

				pixelStringRef.current = reactorPixel;
				pixelPartialRef.current = `${pixelStringPart1};`;
			} catch {
				setIsDatabaseLoading(false);
				setShowTablePreview(false);
				setShowEditColumns(true);

				toast.error("Error updating Data Import");
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

				let pixelStringPart1 = `Database ( database = [ "${databaseId}" ] )`;
				pixelStringPart1 += ` | Select ( ${pixelColumnNames.join(
					" , ",
				)} )`;
				pixelStringPart1 += `.as ( [ ${pixelColumnAliases.join(
					" , ",
				)} ] )`;
				if (pixelJoins.length > 0) {
					pixelStringPart1 += ` | Join ( ${pixelJoins.join(
						" , ",
					)} ) `;
				}
				pixelStringPart1 += ` | Distinct ( false ) | Limit ( ${dataLimit} )`;

				const combinedJoinString =
					pixelJoins.length > 0
						? `| Join ( ${pixelJoins.join(" , ")} ) `
						: "";

				const reactorPixel = `Database ( database = [ "${databaseId}" ] ) | Select ( ${pixelColumnNames.join(
					" , ",
				)} ) .as ( [ ${pixelColumnAliases.join(
					" , ",
				)} ] ) ${combinedJoinString}| Distinct ( false ) | Limit ( ${dataLimit} ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "consolidated_settings_FRAME932867__Preview" ] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

				pixelStringRef.current = reactorPixel;
				pixelPartialRef.current = `${pixelStringPart1};`;

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
						console.error("Error retrieving database tables");
						toast.error("Error retrieving database tables");
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

				toast.error("Error retrieving database tables");
			}
		};

		/** Helper Function Update Alias Tracker Object */
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

			updatePixelRef();
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
				if (checkedColumnsCount === 0) {
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
			const tables = dataImportwatch("tables");
			const totalColumns = tables[tableIndex].columns.length;
			const selectedCount = tables[tableIndex].columns.filter(
				(col) => col.checked,
			).length;

			if (selectedCount === totalColumns) {
				setIsAllSelected(true);
			}
		};

		/** Pre-Populate form For Edit */
		const prepoulateFormForEdit = (cell) => {
			const tablesWithCheckedBoxes = new Set();
			const checkedColumns = new Set();
			const columnAliasMap = {};
			const newAliasesCountObj = {};

			setCheckedColumnsCount(cell.parameters.selectedColumns.length);
			cell.parameters.selectedColumns?.forEach(
				(selectedColumnTableCombinedString, idx) => {
					const [currTableName, currColumnName] =
						selectedColumnTableCombinedString.split("__");
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

			let totalColumnsToCheck = 0;
			let totalCheckedColumns = 0;

			if (newTableFields) {
				newTableFields?.forEach((newTableObj, tableIdx) => {
					if (tablesWithCheckedBoxes.has(newTableObj.name)) {
						const watchedTableColumns =
							watchedTables[tableIdx].columns;
						totalColumnsToCheck += watchedTableColumns.length;

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
									totalCheckedColumns += 1;
									formSetValue(
										`tables.${tableIdx}.columns.${columnIdx}.userAlias`,
										columnAlias,
									);
								}
							},
						);
					}
					if (
						totalCheckedColumns === totalColumnsToCheck &&
						totalColumnsToCheck > 0
					) {
						setIsAllSelected(true);
					} else {
						setIsAllSelected(false);
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
				if (currTable.name === tableName) {
					const currTableColumns = currTable.columns;
					for (let j = 0; j < currTableColumns.length; j++) {
						const currColumn = currTableColumns[j];
						if (currColumn.checked === true) return true;
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
					console.log(joinIdx);
					const rightTable = entry[0];
					const leftKey = entry[1].sourceColumn;
					const rightKey = entry[1].targetColumn;

					const leftTableContainsCheckedColumns =
						checkTableForSelectedColumns(leftTable);
					const rightTableContainsCheckedColumns =
						checkTableForSelectedColumns(rightTable);

					const defaultJoinType = "inner";

					const joinsSetString = `${leftTable}:${rightTable}`;
					if (
						leftTableContainsCheckedColumns &&
						rightTableContainsCheckedColumns &&
						joinsSet.has(joinsSetString) === false
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
						leftTableContainsCheckedColumns === false ||
						(rightTableContainsCheckedColumns === false &&
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

		const addToJoinsSetHelper = (newJoinSet) => {
			const joinsSetCopy = new Set(joinsSet);
			joinsSetCopy.add(newJoinSet);
			setJoinsSet(joinsSetCopy);
		};

		return (
			<Dialog
				open={true}
				onOpenChange={(open) => {
					if (!open) closeImportModalHandler();
				}}
			>
				<DialogContent className="max-h-[90vh] w-full max-w-[1150px] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Import Data</DialogTitle>
					</DialogHeader>
					<form onSubmit={formHandleSubmit(onImportDataSubmit)}>
						{/* Database selector */}
						<div className="mt-6 mb-4 flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<span className="font-semibold text-base">
									Import Data from
								</span>
								<Controller
									name={"databaseSelect"}
									control={formControl}
									render={({ field }) => (
										<Select
											disabled={editMode}
											value={field.value || ""}
											onValueChange={(value) => {
												field.onChange(value);
												setSelectedDatabaseId(value);
												retrieveDatabaseTablesAndEdges(
													value,
												);
												setShowEditColumns(true);
												setShowTablePreview(false);
											}}
										>
											<SelectTrigger className="min-w-[220px]">
												<SelectValue placeholder="Select Database" />
											</SelectTrigger>
											<SelectContent>
												{userDatabases?.map(
													(ele, dbIndex) => (
														<SelectItem
															value={
																ele.database_id
															}
															// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
															key={dbIndex}
														>
															{ele.app_name}
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
									)}
								/>
							</div>
						</div>

						{isDatabaseLoading && (
							<div className="py-4 text-muted-foreground text-sm">
								LOADING....
							</div>
						)}

						{!selectedDatabaseId && (
							<div className="mb-4 rounded-md bg-muted p-4">
								<p className="font-medium text-muted-foreground text-sm">
									Select a Database for Import
								</p>
							</div>
						)}

						{selectedDatabaseId && !isDatabaseLoading && (
							<div className="mb-4 flex flex-col gap-3 rounded-md bg-[#FAFAFA] p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center">
										<h6 className="mr-4 font-semibold text-base">
											Data
										</h6>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											type="button"
											className="mr-4"
											onClick={() => {
												if (!showEditColumns) {
													setShowEditColumns(true);
													setShowTablePreview(false);
												}
											}}
										>
											Edit Columns
										</Button>
										<Button
											variant="outline"
											type="button"
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
								</div>

								{showEditColumns && (
									<div className="mb-5 bg-white">
										<h6 className="mt-4 mb-5 ml-4 font-semibold text-base">
											Available Tables / Columns
										</h6>
										<div className="max-h-[350px] overflow-y-scroll">
											{newTableFields.map(
												(table, tableIndex) => (
													<div
														key={`${table.name}-${tableIndex}`}
													>
														{shownTables.has(
															table.name,
														) && (
															<div
																key={`${table.name}-${tableIndex}`}
																className="mr-3 mb-[60px] ml-3"
															>
																<div className="mt-4 flex p-0">
																	<div className="mb-4 flex w-fit items-center rounded-[10px] bg-primary/10 px-[17.5px] py-[7.5px]">
																		<Tooltip>
																			<TooltipTrigger
																				asChild
																			>
																				<span className="flex cursor-default items-center gap-1.5">
																					<CalendarDays className="-ml-0.5 mr-1.5 size-4 text-primary/60" />
																					{
																						table.name
																					}
																				</span>
																			</TooltipTrigger>
																			<TooltipContent>
																				Table
																			</TooltipContent>
																		</Tooltip>
																	</div>
																</div>
																<Table className="text-sm">
																	<TableBody>
																		<TableRow>
																			<TableCell>
																				<Checkbox
																					checked={
																						isAllSelected
																					}
																					onCheckedChange={() =>
																						addAllTableColumnsHandler(
																							tableIndex,
																						)
																					}
																				/>
																			</TableCell>
																			<TableCell>
																				<span className="font-bold">
																					Fields
																				</span>
																			</TableCell>
																			<TableCell>
																				<span className="font-bold">
																					Alias
																				</span>
																			</TableCell>
																			<TableCell>
																				<span className="font-bold">
																					Field
																					Type
																				</span>
																			</TableCell>
																		</TableRow>

																		{table.columns.map(
																			(
																				column,
																				columnIndex,
																			) => (
																				<TableRow
																					key={`${column.columnName}-${columnIndex}`}
																				>
																					<TableCell>
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
																									onCheckedChange={(
																										checked,
																									) => {
																										field.onChange(
																											checked,
																										);
																										checkBoxHandler(
																											tableIndex,
																											columnIndex,
																										);
																									}}
																								/>
																							)}
																						/>
																					</TableCell>
																					<TableCell>
																						{
																							column.columnName
																						}
																						{column.columnName ===
																							"ID" && (
																							<span className="ml-[7px] inline-block h-6 w-[37px] rounded-[3px] bg-[#F1E9FB] pt-[3px] text-center text-xs">
																								PK
																							</span>
																						)}
																						{column.columnName.includes(
																							"_ID",
																						) && (
																							<span className="ml-[7px] inline-block h-6 w-[37px] rounded-[3px] bg-[#EBEBEB] pt-[3px] text-center text-xs">
																								FK
																							</span>
																						)}
																					</TableCell>
																					<TableCell>
																						<div className="flex items-center">
																							<Controller
																								name={`tables.${tableIndex}.columns.${columnIndex}.userAlias`}
																								control={
																									formControl
																								}
																								render={({
																									field,
																								}) => (
																									<Input
																										type="text"
																										className="h-8"
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
																									<Tooltip>
																										<TooltipTrigger
																											asChild
																										>
																											<AlertTriangle className="ml-2.5 size-4 text-yellow-600" />
																										</TooltipTrigger>
																										<TooltipContent>
																											Duplicate
																											Alias
																											Name
																										</TooltipContent>
																									</Tooltip>
																								)}
																						</div>
																					</TableCell>

																					<TableCell>
																						<Controller
																							name={`tables.${tableIndex}.columns.${columnIndex}.columnType`}
																							control={
																								formControl
																							}
																							render={({
																								field,
																							}) => (
																								<Select
																									disabled
																									value={
																										field.value ||
																										""
																									}
																									onValueChange={(
																										value,
																									) => {
																										field.onChange(
																											value,
																										);
																									}}
																								>
																									<SelectTrigger className="h-8 min-w-[220px]">
																										<SelectValue />
																									</SelectTrigger>
																									<SelectContent>
																										{SQL_COLUMN_TYPES.map(
																											(
																												ele,
																												eleIdx,
																											) => (
																												<SelectItem
																													value={
																														ele
																													}
																													key={
																														// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
																														eleIdx
																													}
																												>
																													{
																														ele
																													}
																												</SelectItem>
																											),
																										)}
																									</SelectContent>
																								</Select>
																							)}
																						/>
																					</TableCell>
																				</TableRow>
																			),
																		)}
																	</TableBody>
																</Table>
															</div>
														)}
													</div>
												),
											)}
										</div>
									</div>
								)}

								{showPreview && (
									<div className="mb-5 bg-white">
										<h6 className="mt-4 mb-5 ml-4 font-semibold text-base">
											Preview
										</h6>
										<div className="max-h-[350px] overflow-y-scroll">
											<Table>
												<TableHeader>
													<TableRow>
														{databaseTableHeaders.map(
															(h, hIdx) => (
																<TableHead
																	// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
																	key={hIdx}
																>
																	{h}
																</TableHead>
															),
														)}
													</TableRow>
												</TableHeader>
												<TableBody>
													{databaseTableRows.map(
														(r, rIdx) => (
															<TableRow
																// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
																key={rIdx}
															>
																{r.map(
																	(
																		v,
																		vIdx,
																	) => (
																		<TableCell
																			// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
																			key={`${rIdx}-${vIdx}`}
																		>
																			{v}
																		</TableCell>
																	),
																)}
															</TableRow>
														),
													)}
												</TableBody>
											</Table>
										</div>
									</div>
								)}
							</div>
						)}

						{joinElements.map((join, joinIndex) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								key={joinIndex}
								className="mb-4 flex flex-col gap-3 rounded-md bg-[#FAFAFA] p-4"
							>
								<div className="flex items-center">
									<h6 className="mr-3 font-semibold text-base">
										Join
									</h6>

									<Tooltip>
										<TooltipTrigger asChild>
											<div className="cursor-default rounded-[12px] border-none bg-primary/10 px-3 py-1 text-black text-sm">
												{join.leftTable}
											</div>
										</TooltipTrigger>
										<TooltipContent>
											Left Table
										</TooltipContent>
									</Tooltip>

									<DropdownMenu
										open={
											isJoinSelectOpen &&
											joinTypeSelectIndex === joinIndex
										}
										onOpenChange={(open) => {
											if (!open) {
												setIsJoinSelectOpen(false);
												setJoinTypeSelectIndex(-1);
											}
										}}
									>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												type="button"
												className="mx-[7.5px]"
												onClick={() => {
													setJoinTypeSelectIndex(
														joinIndex,
													);
													setIsJoinSelectOpen(true);
												}}
											>
												{
													JOIN_ICONS[
														watchedJoins?.[
															joinIndex
														]?.joinType
													]
												}
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuItem
												onClick={() => {
													setIsJoinSelectOpen(false);
													formSetValue(
														`joins.${joinIndex}.joinType`,
														"inner",
													);
												}}
											>
												Inner Join
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => {
													setIsJoinSelectOpen(false);
													formSetValue(
														`joins.${joinIndex}.joinType`,
														"left.outer",
													);
												}}
											>
												Left Join
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => {
													setIsJoinSelectOpen(false);
													formSetValue(
														`joins.${joinIndex}.joinType`,
														"right.outer",
													);
												}}
											>
												Right Join
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => {
													setIsJoinSelectOpen(false);
													formSetValue(
														`joins.${joinIndex}.joinType`,
														"outer",
													);
												}}
											>
												Outer Join
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>

									<Tooltip>
										<TooltipTrigger asChild>
											<div className="cursor-default rounded-[12px] bg-[#DEF4F3] px-3 py-1 text-black text-sm">
												{join.rightTable}
											</div>
										</TooltipTrigger>
										<TooltipContent>
											Right Table
										</TooltipContent>
									</Tooltip>

									<span className="mx-3 cursor-default text-secondary-foreground text-sm">
										where
									</span>

									<Tooltip>
										<TooltipTrigger asChild>
											<div className="cursor-default rounded-[12px] bg-primary/10 px-3 py-1 text-black text-sm">
												{join.leftKey}
											</div>
										</TooltipTrigger>
										<TooltipContent>
											Left Key
										</TooltipContent>
									</Tooltip>

									<span className="mx-3 cursor-default text-secondary-foreground text-sm">
										=
									</span>

									<Tooltip>
										<TooltipTrigger asChild>
											<div className="cursor-default rounded-[12px] bg-[#DEF4F3] px-3 py-1 text-black text-sm">
												{join.rightKey}
											</div>
										</TooltipTrigger>
										<TooltipContent>
											Right Key
										</TooltipContent>
									</Tooltip>
								</div>
							</div>
						))}

						{/* Action buttons row */}
						<div className="mt-4 mb-4 flex justify-start gap-2">
							<Button variant="outline" type="button" disabled>
								<Filter className="mr-1 size-4" />
								Add Filter
							</Button>
							<Button variant="outline" type="button" disabled>
								<CopyPlus className="mr-1 size-4" />
								Add Summary
							</Button>
						</div>

						{/* Footer actions */}
						<div className="mt-2 flex justify-end gap-2">
							<Button
								variant="ghost"
								type="button"
								onClick={() => {
									closeImportModalHandler();
								}}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={
									!checkedColumnsCount ||
									Object.values(aliasesCountObj).some(
										(key: number) => key > 1,
									) ||
									aliasesCountObj[""] > 0
								}
							>
								{editMode ? "Update Cell" : "Import"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		);
	},
);
