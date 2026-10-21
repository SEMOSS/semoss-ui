import { ChevronDown, ChevronRight } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	type JSX,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { runPixel, usePixel } from "@semoss/sdk/react";
import { EngineSubtypeIcon } from "@semoss/shared";
import {
	Button,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Controller,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	H3,
	Input,
	Label,
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
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useFieldArray,
	useForm,
} from "@semoss/ui/next";
import { useBlocks } from "../../hooks";
import {
	ActionMessages,
	type CellStateConfig,
	type NewCellAction,
	type NotebookState,
} from "../../store";
import { DefaultCells } from "../cell-defaults";
import { CodeCellConfig } from "../cell-defaults/code-cell";
import { DataImportCellConfig } from "../cell-defaults/data-import-cell";
import { getDataImportDatabases } from "./data-import-databases";

const JOIN_TYPES = [
	{ value: "inner", label: "Inner join" },
	{ value: "left.outer", label: "Left join" },
	{ value: "right.outer", label: "Right join" },
	{ value: "outer", label: "Outer join" },
];

type JoinElement = {
	leftTable: string;
	rightTable: string;
	joinType: string;
	// Optional: RDF / graph joins are on the concept itself and don't have
	// column-level keys, so the metamodel may omit these.
	leftKey?: string;
	rightKey?: string;
};

interface Column {
	id: number;
	tableName: string;
	columnName: string;
	columnType: string;
	userAlias: string;
	checked: boolean;
	/**
	 * True when this column IS the concept itself (graph nodes / standalone
	 * tables). False when it's a property of a parent table/concept. Reflects
	 * row[3] from META | GetDatabaseTableStructure.
	 */
	isConcept: boolean;
}

const getColumnRef = (column: {
	tableName: string;
	columnName: string;
	isConcept?: boolean;
}): string =>
	column.isConcept
		? column.columnName
		: `${column.tableName}__${column.columnName}`;

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

/** Build query strings from the latest form values; the strings remain stable across unrelated renders. */
const buildPreviewQuery = (
	databaseId: string | null,
	tables: TableInterface[] | undefined,
	joins: JoinElement[] | undefined,
	dataLimit: number,
): { previewPixel: string; previewSelectQuery: string } => {
	const pixelColumnNames: string[] = [];
	const pixelColumnAliases: string[] = [];
	const pixelJoins: string[] = [];

	tables?.forEach((tableObject) => {
		const currTableColumns = tableObject.columns;
		currTableColumns?.forEach((columnObject) => {
			if (columnObject.checked) {
				pixelColumnNames.push(getColumnRef(columnObject));
				pixelColumnAliases.push(columnObject.userAlias);
			}
		});
	});

	joins?.forEach((joinEle) => {
		pixelJoins.push(
			`( ${joinEle.leftTable} , ${joinEle.joinType}.join , ${joinEle.rightTable} )`,
		);
	});

	let pixelStringPart1 = `Database ( database = [ "${databaseId}" ] )`;
	pixelStringPart1 += ` | Select ( ${pixelColumnNames.join(" , ")} )`;
	pixelStringPart1 += `.as ( [ ${pixelColumnAliases.join(" , ")} ] )`;
	if (pixelJoins.length > 0) {
		pixelStringPart1 += ` | Join ( ${pixelJoins.join(" , ")} ) `;
	}
	pixelStringPart1 += ` | Distinct ( false ) | Limit ( ${dataLimit} )`;

	const combinedJoinString =
		pixelJoins.length > 0 ? `| Join ( ${pixelJoins.join(" , ")} ) ` : "";

	const reactorPixel = `Database ( database = [ "${databaseId}" ] ) | Select ( ${pixelColumnNames.join(
		" , ",
	)} ) .as ( [ ${pixelColumnAliases.join(
		" , ",
	)} ] ) ${combinedJoinString}| Distinct ( false ) | Limit ( ${dataLimit} ) | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "consolidated_settings_FRAME932867__Preview" ] ) ] ) ;  META | Frame() | QueryAll() | Limit(50) | Collect(500);`;

	return {
		previewPixel: reactorPixel,
		previewSelectQuery: `${pixelStringPart1};`,
	};
};

export const DataImportFormModal = observer(
	(props: {
		query?: NotebookState;
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

		const { state, notebook } = useBlocks();

		const form = useForm<FormValues>({
			defaultValues: {
				databaseSelect: cell?.parameters.databaseId ?? "",
				tables: [],
				joins: [],
			},
		});
		const {
			control: formControl,
			setValue: formSetValue,
			reset: formReset,
			getValues: formGetValues,
			watch: dataImportwatch,
		} = form;

		const watchedTables = dataImportwatch("tables");
		const watchedJoins = dataImportwatch("joins");
		const databaseSelectId = useId();
		const [databaseTableHeaders, setDatabaseTableHeaders] = useState([]);
		const [selectedDatabaseId, setSelectedDatabaseId] = useState(
			cell ? cell.parameters.databaseId : null,
		);
		const getDatabases = usePixel<unknown>("META | GetDatabaseList ( ) ;");
		const userDatabases = useMemo(
			() =>
				getDatabases.status === "SUCCESS"
					? getDataImportDatabases(getDatabases.data)
					: [],
			[getDatabases.status, getDatabases.data],
		);
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
		const [shownTables, setShownTables] = useState(new Set());
		const [joinsSet, setJoinsSet] = useState(new Set());
		const pixelStringRef = useRef<string>("");
		const pixelPartialRef = useRef<string>("");
		const [isInitLoadComplete, setIsInitLoadComplete] = useState(false);
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

		const isTableAllSelected = (tableIndex: number): boolean => {
			const cols = watchedTables?.[tableIndex]?.columns;
			if (!cols || cols.length === 0) return false;
			return cols.every((col) => col.checked);
		};

		const [collapsedTables, setCollapsedTables] = useState<Set<string>>(
			new Set(),
		);
		const toggleTableCollapse = (tableName: string) => {
			setCollapsedTables((prev) => {
				const next = new Set(prev);
				if (next.has(tableName)) next.delete(tableName);
				else next.add(tableName);
				return next;
			});
		};
		const visibleTableNames = (): string[] =>
			(newTableFields ?? [])
				.filter((t) => shownTables.has(t.name))
				.map((t) => t.name);
		const areAllTablesCollapsed = (): boolean => {
			const names = visibleTableNames();
			return (
				names.length > 0 && names.every((n) => collapsedTables.has(n))
			);
		};
		const toggleAllTablesCollapse = () => {
			if (areAllTablesCollapsed()) {
				setCollapsedTables(new Set());
			} else {
				setCollapsedTables(new Set(visibleTableNames()));
			}
		};
		const selectedDatabase = useMemo(
			() =>
				userDatabases?.find(
					(db) => db.engine_id === selectedDatabaseId,
				) ?? null,
			[userDatabases, selectedDatabaseId],
		);

		const getSelectedColumnNames = () => {
			const pixelTables = new Set();
			const pixelColumnNames = [];

			watchedTables.forEach((tableObject) => {
				const currTableColumns = tableObject.columns;

				currTableColumns.forEach((columnObject) => {
					if (columnObject.checked) {
						pixelTables.add(columnObject.tableName);
						pixelColumnNames.push(getColumnRef(columnObject));
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
						tableNames: Array.from(retrieveSelectedTableNames()),
						selectedColumns: getSelectedColumnNames(),
						columnAliases: getColumnAliases(),
						rootTable: rootTable,
					};
				}

				if (
					previousCellId &&
					state.notebooks[query.id].cells[previousCellId].widget ===
						widget &&
					widget === CodeCellConfig.widget
				) {
					const previousCellType =
						state.notebooks[query.id].cells[previousCellId]
							.parameters?.type ?? "pixel";
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
			const allChecked = !isTableAllSelected(tableIndex);
			const updatedColumns = watchedTables[tableIndex].columns.map(
				(column) => ({
					...column,
					checked: allChecked,
				}),
			);

			formSetValue(`tables.${tableIndex}.columns`, updatedColumns, {
				shouldDirty: true,
				shouldValidate: true,
			});

			const selectedColumns = formGetValues("tables").flatMap((table) =>
				table.columns.filter((column) => column.checked),
			);
			const freshAliasCountObj: Record<string, number> = {};
			for (const column of selectedColumns) {
				const alias = column.userAlias;
				freshAliasCountObj[alias] =
					(freshAliasCountObj[alias] ?? 0) + 1;
			}
			setAliasesCountObj(freshAliasCountObj);
			aliasesCountObjRef.current = freshAliasCountObj;

			const nextCount = selectedColumns.length;
			const nextRoot = nextCount
				? (rootTable ?? watchedTables[tableIndex].name)
				: null;
			setRootTable(nextRoot);
			setCheckedColumnsCount(nextCount);
			setJoinsStackHandler(nextCount, nextRoot);
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
		const retrieveDatabaseTablesAndEdges = useCallback(
			async (databaseId: string) => {
				if (!databaseId) {
					// No database picked yet (fresh cell or edit before cell hydrates) —
					// skip the pixel call to avoid a "Database does not exist" error.
					return;
				}
				setIsDatabaseLoading(true);
				const pixelString = `META|GetDatabaseTableStructure(database=[ "${databaseId}" ]);META|GetDatabaseMetamodel( database=[ "${databaseId}" ], options=["dataTypes","positions"]);`;

				runPixel(pixelString).then((pixelResponse) => {
					const responseTableStructure = pixelResponse.pixelReturn[0]
						.output as string[][];
					const isResponseTableStructureGood =
						pixelResponse.pixelReturn[0].operationType.indexOf(
							"ERROR",
						) === -1;

					const responseTableEdgesStructure = pixelResponse
						.pixelReturn[1].output as {
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

						const tableColumnsObject =
							responseTableStructure.reduce((acc, ele) => {
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
							}, {});

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
												isConcept: Boolean(
													colObj.columnBoolean,
												),
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
							responseTableEdgesStructure.edges.reduce(
								(acc, ele) => {
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
							newTableEdges[edge.source][edge.target] =
								edge.relation;
						} else {
							newTableEdges[edge.source] = {
								[edge.target]: edge.relation,
							};
						}
						if (newTableEdges[edge.target]) {
							newTableEdges[edge.target][edge.source] =
								edge.relation;
						} else {
							newTableEdges[edge.target] = {
								[edge.source]: edge.relation,
							};
						}
					});
					setTableEdges(newTableEdges);
					setIsDatabaseLoading(false);

					setTableNames(newTableNames);
					if (editMode && !isInitLoadComplete && rootTable) {
						// Restrict to root + its joinable neighbours only when we
						// actually have a stored rootTable to anchor on.
						// Without that guard, graph/RDF cells (or older cells
						// missing rootTable) end up with `Set([""])` and nothing
						// renders.
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
			},
			[
				editMode,
				isInitLoadComplete,
				rootTable,
				formReset,
				removeJoinElement,
			],
		);

		useEffect(() => {
			if (editMode && !isInitLoadComplete) {
				retrieveDatabaseTablesAndEdges(cell?.parameters.databaseId);
			}
		}, [
			editMode,
			isInitLoadComplete,
			cell?.parameters.databaseId,
			retrieveDatabaseTablesAndEdges,
		]);

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
							pixelColumnNames.push(getColumnRef(columnObject));
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
						pixelColumnNames.push(getColumnRef(columnObject));
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
						pixelColumnNames.push(getColumnRef(columnObject));
						pixelColumnAliases.push(columnObject.userAlias);
					}
				});
			});

			return pixelTables;
		};

		const { previewPixel, previewSelectQuery } = buildPreviewQuery(
			selectedDatabaseId,
			watchedTables,
			watchedJoins,
			dataLimit,
		);

		const retrievePreviewData = useCallback(async () => {
			setIsDatabaseLoading(true);
			try {
				pixelStringRef.current = previewPixel;
				pixelPartialRef.current = previewSelectQuery;

				runPixel(previewPixel).then((response) => {
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
		}, [previewPixel, previewSelectQuery]);

		useEffect(() => {
			if (showPreview) {
				retrievePreviewData();
			}
		}, [showPreview, retrievePreviewData]);

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

			// Track the next count + root locally so we can pass them into
			// setJoinsStackHandler synchronously — the state setters below
			// only commit after the next render, so the handler's closure
			// would otherwise see the OLD count and skip the join build when
			// the count transitions 1 -> 2.
			let nextCount = checkedColumnsCount;
			let nextRoot: string | null = rootTable;

			if (columnObject?.checked) {
				// Anchor a root table whenever there isn't one yet — covers
				// fresh cells (count was 0) AND edit-mode cells that loaded
				// with empty rootTable (graph/RDF, older saves).
				if (checkedColumnsCount === 0 || !rootTable) {
					findAllJoinableTables(watchedTables[tableIndex].name);
					nextRoot = watchedTables[tableIndex].name;
					setRootTable(nextRoot);
				}
				nextCount = checkedColumnsCount + 1;
				setCheckedColumnsCount(nextCount);
			} else if (columnObject?.checked === false) {
				if (checkedColumnsCount === 1) {
					setShownTables(new Set(tableNames));
					nextRoot = null;
					setRootTable(null);
				}
				nextCount = checkedColumnsCount - 1;
				setCheckedColumnsCount(nextCount);
			}
			setJoinsStackHandler(nextCount, nextRoot);
		};

		/** Pre-Populate form For Edit */
		const prepopulateFormForEdit = useCallback(
			(cell) => {
				const tablesWithCheckedBoxes = new Set();
				const checkedColumns = new Set();
				const columnAliasMap = {};
				const newAliasesCountObj = {};

				setCheckedColumnsCount(cell.parameters.selectedColumns.length);
				cell.parameters.selectedColumns?.forEach(
					(selectedColumnTableCombinedString, idx) => {
						// Concept columns (graph nodes / standalone tables) are
						// stored as just "columnName"; properties are stored as
						// "tableName__columnName".
						const hasTablePrefix =
							selectedColumnTableCombinedString.includes("__");
						const [currTableName, currColumnName] = hasTablePrefix
							? selectedColumnTableCombinedString.split("__")
							: [
									selectedColumnTableCombinedString,
									selectedColumnTableCombinedString,
								];
						const currColumnAlias =
							cell.parameters.columnAliases[idx];
						tablesWithCheckedBoxes.add(currTableName);
						checkedColumns.add(selectedColumnTableCombinedString);
						columnAliasMap[selectedColumnTableCombinedString] =
							currColumnAlias;
						newAliasesCountObj[currColumnAlias || currColumnName] =
							1;
					},
				);

				setAliasesCountObj({ ...newAliasesCountObj });
				aliasesCountObjRef.current = { ...newAliasesCountObj };

				const tables = formGetValues("tables");
				if (tables) {
					tables.forEach((newTableObj, tableIdx) => {
						if (tablesWithCheckedBoxes.has(newTableObj.name)) {
							const watchedTableColumns =
								tables[tableIdx].columns;

							watchedTableColumns?.forEach(
								(tableColumnObj, columnIdx) => {
									const columnName =
										getColumnRef(tableColumnObj);
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

				// Edit mode: anchor rootTable from the loaded selections if the
				// cell didn't persist one (e.g. graph/RDF cells). Without this
				// the join auto-detection can't iterate `tableEdgesObject[root]`.
				if (!rootTable && tablesWithCheckedBoxes.size > 0) {
					const firstChecked = Array.from(
						tablesWithCheckedBoxes,
					)[0] as string;
					setRootTable(firstChecked);
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
				setInitEditPrepopulateComplete(true);
			},
			[formGetValues, formSetValue, rootTable, appendJoinElement],
		);

		useEffect(() => {
			if (
				editMode &&
				checkedColumnsCount === 0 &&
				cell.parameters.databaseId === selectedDatabaseId &&
				newTableFields.length &&
				!initEditPrepopulateComplete
			) {
				prepopulateFormForEdit(cell);
			}
		}, [
			editMode,
			cell,
			checkedColumnsCount,
			selectedDatabaseId,
			newTableFields,
			initEditPrepopulateComplete,
			prepopulateFormForEdit,
		]);

		const checkTableForSelectedColumns = (tableName) => {
			const tables = formGetValues("tables");
			for (let i = 0; i < tables.length; i++) {
				const currTable = tables[i];
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

		const setJoinsStackHandler = (
			overrideCount?: number,
			overrideRootTable?: string | null,
		) => {
			// Callers that just updated count/root via setState can pass the
			// new values to avoid the stale-closure race.
			const currentCount = overrideCount ?? checkedColumnsCount;
			const currentRootTable =
				overrideRootTable !== undefined ? overrideRootTable : rootTable;
			if (currentCount < 2) {
				removeJoinElement();
				setJoinsSet(new Set());
			} else {
				const leftTable = currentRootTable;
				const rightTables =
					currentRootTable && tableEdgesObject?.[currentRootTable]
						? Object.entries(tableEdgesObject[currentRootTable])
						: null;

				rightTables?.forEach((entry) => {
					const rightTable = entry[0];
					const edge = entry[1] as {
						sourceColumn?: string;
						targetColumn?: string;
					};
					const leftKey = edge.sourceColumn;
					const rightKey = edge.targetColumn;

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

		const hasDuplicateAliases = Object.values(aliasesCountObj).some(
			(count: number) => count > 1,
		);
		const selectionHint = !selectedDatabaseId
			? "Select a database to continue."
			: !checkedColumnsCount
				? "Select at least one column."
				: hasDuplicateAliases
					? "Give each selected column a unique alias."
					: aliasesCountObj[""] > 0
						? "Enter an alias for every selected column."
						: null;
		const disabledReason = isDatabaseLoading
			? "Wait for the database to finish loading."
			: selectionHint;

		return (
			<Dialog
				open
				onOpenChange={(open) => !open && closeImportModalHandler()}
			>
				<DialogContent
					aria-describedby={undefined}
					className="flex max-h-[min(90dvh,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
				>
					<DialogHeader className="shrink-0 border-border border-b px-4 py-3 pr-12 text-left">
						<DialogTitle className="font-medium text-base leading-6">
							Query Builder
						</DialogTitle>
					</DialogHeader>
					<Form
						form={form}
						onSubmit={onImportDataSubmit}
						className="flex min-h-0 flex-1 flex-col"
					>
						<div className="shrink-0 border-border border-b px-4 py-3">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
								<Label
									htmlFor={databaseSelectId}
									className="shrink-0 text-sm sm:w-20"
								>
									Database
								</Label>
								<Controller
									name="databaseSelect"
									control={formControl}
									render={({ field }) => (
										<Select
											value={field.value || ""}
											disabled={
												getDatabases.status !==
													"SUCCESS" ||
												userDatabases.length === 0
											}
											onValueChange={(value) => {
												if (
													value === selectedDatabaseId
												)
													return;
												field.onChange(value);
												setSelectedDatabaseId(value);
												// A new database starts with its own columns and joins.
												setRootTable(null);
												setCheckedColumnsCount(0);
												setAliasesCountObj({});
												aliasesCountObjRef.current = {};
												setJoinsSet(new Set());
												removeJoinElement();
												setInitEditPrepopulateComplete(
													true,
												);
												retrieveDatabaseTablesAndEdges(
													value,
												);
												setShowEditColumns(true);
												setShowTablePreview(false);
											}}
										>
											<SelectTrigger
												id={databaseSelectId}
												size="sm"
												aria-describedby={`${databaseSelectId}-status`}
												className="w-full min-w-0 shadow-none sm:max-w-sm"
											>
												<SelectValue placeholder="Select a database">
													{selectedDatabase && (
														<span className="flex min-w-0 items-center gap-2">
															<EngineSubtypeIcon
																engineType={
																	selectedDatabase.engine_type ??
																	"DATABASE"
																}
																engineSubtype={
																	selectedDatabase.engine_subtype
																}
																alt=""
																className="size-4 shrink-0 object-contain"
															/>
															<span className="truncate">
																{
																	selectedDatabase.engine_name
																}
															</span>
														</span>
													)}
												</SelectValue>
											</SelectTrigger>
											<SelectContent
												align="start"
												collisionPadding={8}
												className="[&_[data-radix-select-viewport]::-webkit-scrollbar]:block! max-h-[min(20rem,var(--radix-select-content-available-height))] overflow-hidden [&_[data-radix-select-viewport]]:max-h-72 [&_[data-radix-select-viewport]]:min-h-0 [&_[data-radix-select-viewport]]:overflow-y-auto [&_[data-radix-select-viewport]]:overscroll-contain [&_[data-radix-select-viewport]]:[scrollbar-width:thin]!"
											>
												{userDatabases.map(
													(database) => (
														<SelectItem
															value={
																database.engine_id
															}
															textValue={
																database.engine_name
															}
															key={
																database.engine_id
															}
														>
															<span className="flex min-w-0 items-center gap-2">
																<EngineSubtypeIcon
																	engineType={
																		database.engine_type ??
																		"DATABASE"
																	}
																	engineSubtype={
																		database.engine_subtype
																	}
																	alt=""
																	className="size-4 shrink-0 object-contain"
																/>
																<span className="flex min-w-0 flex-col text-left">
																	<span className="break-all text-sm">
																		{
																			database.engine_name
																		}
																	</span>
																	<span className="break-all text-[11px] text-muted-foreground">
																		{
																			database.engine_id
																		}
																	</span>
																</span>
															</span>
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
									)}
								/>
							</div>
							<div
								id={`${databaseSelectId}-status`}
								className="text-muted-foreground text-xs empty:hidden sm:pl-22"
								aria-live="polite"
							>
								{getDatabases.status === "ERROR" ? (
									<span className="text-destructive">
										Unable to load databases.{" "}
										<Button
											type="button"
											variant="link"
											size="sm"
											onClick={getDatabases.refresh}
										>
											Retry
										</Button>
									</span>
								) : getDatabases.status !== "SUCCESS" ? (
									"Loading databases…"
								) : userDatabases.length === 0 ? (
									"No databases are available for your account."
								) : null}
							</div>
						</div>
						<section
							aria-label="Query configuration"
							// biome-ignore lint/a11y/noNoninteractiveTabindex: This region receives focus for keyboard scrolling through large metamodels.
							tabIndex={0}
							className="focus-visible:-outline-offset-2 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:outline-ring"
						>
							{!selectedDatabaseId && (
								<p className="py-6 text-center text-muted-foreground text-sm">
									Select a database to choose its columns.
								</p>
							)}
							{selectedDatabaseId && (
								<Tabs
									value={showPreview ? "preview" : "columns"}
									onValueChange={(value) => {
										setShowTablePreview(
											value === "preview",
										);
										setShowEditColumns(value === "columns");
									}}
									className="gap-2"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="flex flex-wrap items-center gap-3">
											<TabsList
												aria-label="Query data"
												className="h-8"
											>
												<TabsTrigger
													value="columns"
													className="px-3"
												>
													Columns
												</TabsTrigger>
												<Tooltip
													disableHoverableContent={
														false
													}
												>
													<TooltipTrigger asChild>
														<span
															className="inline-flex h-full"
															tabIndex={
																disabledReason
																	? 0
																	: undefined
															}
														>
															<TabsTrigger
																value="preview"
																disabled={Boolean(
																	disabledReason,
																)}
																className="px-3"
															>
																Preview
															</TabsTrigger>
														</span>
													</TooltipTrigger>
													<TooltipContent>
														{disabledReason ??
															"Preview selected columns"}
													</TooltipContent>
												</Tooltip>
											</TabsList>
											<span className="text-muted-foreground text-xs tabular-nums">
												{checkedColumnsCount}{" "}
												{checkedColumnsCount === 1
													? "column"
													: "columns"}{" "}
												selected
											</span>
										</div>
										{showEditColumns &&
											visibleTableNames().length > 1 && (
												<Button
													variant="ghost"
													size="sm"
													type="button"
													className="h-8 px-2 text-xs"
													onClick={
														toggleAllTablesCollapse
													}
												>
													{areAllTablesCollapsed()
														? "Expand all"
														: "Collapse all"}
												</Button>
											)}
									</div>
									<TabsContent
										value="columns"
										className="space-y-2"
									>
										{isDatabaseLoading ? (
											<output className="block py-8 text-center text-muted-foreground text-sm">
												Loading database…
											</output>
										) : newTableFields.length === 0 ? (
											<p className="block py-8 text-center text-muted-foreground text-sm">
												No tables are available in this
												database.
											</p>
										) : (
											newTableFields.map(
												(table, tableIndex) => {
													if (
														!shownTables.has(
															table.name,
														)
													)
														return null;
													const tableId = `${databaseSelectId}-table-${tableIndex}`;
													const selectedCount =
														watchedTables?.[
															tableIndex
														]?.columns.filter(
															(column) =>
																column.checked,
														).length ?? 0;
													return (
														<Collapsible
															key={table.id}
															open={
																!collapsedTables.has(
																	table.name,
																)
															}
															onOpenChange={() =>
																toggleTableCollapse(
																	table.name,
																)
															}
															className="min-w-0 rounded-md border border-border"
														>
															<div className="flex items-center gap-2 rounded-t-md bg-muted/40 px-2 py-1">
																<CollapsibleTrigger
																	asChild
																>
																	<Button
																		variant="ghost"
																		size="sm"
																		type="button"
																		className="h-8 min-w-0 flex-1 justify-start gap-2 px-1 text-left"
																	>
																		{collapsedTables.has(
																			table.name,
																		) ? (
																			<ChevronRight
																				className="size-3.5 shrink-0 text-muted-foreground"
																				aria-hidden="true"
																			/>
																		) : (
																			<ChevronDown
																				className="size-3.5 shrink-0 text-muted-foreground"
																				aria-hidden="true"
																			/>
																		)}
																		<span className="truncate">
																			{
																				table.name
																			}
																		</span>
																	</Button>
																</CollapsibleTrigger>
																<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
																	{
																		selectedCount
																	}
																	/
																	{
																		table
																			.columns
																			.length
																	}
																</span>
																<div className="flex shrink-0 items-center gap-1.5 pl-1">
																	<Checkbox
																		id={`${tableId}-all`}
																		checked={
																			selectedCount >
																				0 &&
																			selectedCount <
																				table
																					.columns
																					.length
																				? "indeterminate"
																				: isTableAllSelected(
																						tableIndex,
																					)
																		}
																		onCheckedChange={() =>
																			addAllTableColumnsHandler(
																				tableIndex,
																			)
																		}
																	/>
																	<Label
																		htmlFor={`${tableId}-all`}
																		className="py-2 font-normal text-xs"
																	>
																		Select
																		all
																		<span className="sr-only">
																			{" "}
																			columns
																			in{" "}
																			{
																				table.name
																			}
																		</span>
																	</Label>
																</div>
															</div>
															<CollapsibleContent>
																<section
																	aria-label={`${table.name} columns`}
																	// biome-ignore lint/a11y/noNoninteractiveTabindex: This table region receives focus for keyboard scrolling.
																	tabIndex={0}
																	className="overflow-x-auto rounded-b-md focus-visible:outline-2 focus-visible:outline-ring"
																>
																	<Table
																		wrapperClassName="overflow-visible"
																		className="min-w-xl table-fixed"
																	>
																		<TableHeader>
																			<TableRow className="hover:bg-transparent">
																				<TableHead className="h-8 w-2/5 px-3 text-muted-foreground text-xs">
																					Column
																				</TableHead>
																				<TableHead className="h-8 w-2/5 px-3 text-muted-foreground text-xs">
																					Alias
																				</TableHead>
																				<TableHead className="h-8 w-1/5 px-3 text-muted-foreground text-xs">
																					Type
																				</TableHead>
																			</TableRow>
																		</TableHeader>
																		<TableBody>
																			{table.columns.map(
																				(
																					column,
																					columnIndex,
																				) => {
																					const columnId = `${tableId}-column-${columnIndex}`;
																					const currentColumn =
																						watchedTables?.[
																							tableIndex
																						]
																							?.columns[
																							columnIndex
																						] ??
																						column;
																					const aliasError =
																						currentColumn.checked
																							? aliasesCountObj[
																									currentColumn
																										.userAlias
																								] >
																								1
																								? "Use a unique alias."
																								: currentColumn.userAlias ===
																										""
																									? "Enter an alias."
																									: null
																							: null;
																					return (
																						<TableRow
																							key={
																								column.id
																							}
																						>
																							<TableCell className="px-3 py-1">
																								<div className="flex min-w-0 items-center gap-2">
																									<Controller
																										name={`tables.${tableIndex}.columns.${columnIndex}.checked`}
																										control={
																											formControl
																										}
																										render={({
																											field,
																										}) => (
																											<Checkbox
																												id={
																													columnId
																												}
																												checked={
																													field.value
																												}
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
																									<Label
																										htmlFor={
																											columnId
																										}
																										className="min-w-0 flex-1 whitespace-normal break-all py-1.5 font-normal text-sm leading-5"
																									>
																										{
																											column.columnName
																										}
																									</Label>
																								</div>
																							</TableCell>
																							<TableCell className="px-3 py-1">
																								<Controller
																									name={`tables.${tableIndex}.columns.${columnIndex}.userAlias`}
																									control={
																										formControl
																									}
																									render={({
																										field,
																									}) => (
																										<Input
																											{...field}
																											type="text"
																											aria-label={`Alias for ${table.name}.${column.columnName}`}
																											aria-invalid={Boolean(
																												aliasError,
																											)}
																											aria-describedby={
																												aliasError
																													? `${columnId}-error`
																													: undefined
																											}
																											className="h-8 px-2 shadow-none"
																											onChange={(
																												event,
																											) => {
																												if (
																													currentColumn.checked
																												)
																													updateAliasCountObj(
																														true,
																														event
																															.target
																															.value,
																														field.value,
																													);
																												field.onChange(
																													event
																														.target
																														.value,
																												);
																											}}
																										/>
																									)}
																								/>
																								{aliasError && (
																									<p
																										id={`${columnId}-error`}
																										className="mt-1 whitespace-normal text-destructive text-xs"
																									>
																										{
																											aliasError
																										}
																									</p>
																								)}
																							</TableCell>
																							<TableCell className="whitespace-normal break-all px-3 py-1 text-muted-foreground text-xs">
																								{
																									column.columnType
																								}
																							</TableCell>
																						</TableRow>
																					);
																				},
																			)}
																		</TableBody>
																	</Table>
																</section>
															</CollapsibleContent>
														</Collapsible>
													);
												},
											)
										)}
									</TabsContent>
									<TabsContent value="preview">
										{isDatabaseLoading ? (
											<output className="block py-8 text-center text-muted-foreground text-sm">
												Loading preview…
											</output>
										) : databaseTableRows.length === 0 ? (
											<p className="block py-8 text-center text-muted-foreground text-sm">
												No rows returned for this
												selection.
											</p>
										) : (
											<section
												aria-label="Query preview results"
												// biome-ignore lint/a11y/noNoninteractiveTabindex: This table region receives focus for keyboard scrolling.
												tabIndex={0}
												className="overflow-x-auto rounded-md border border-border focus-visible:outline-2 focus-visible:outline-ring"
											>
												<Table wrapperClassName="overflow-visible">
													<TableHeader className="bg-muted/40">
														<TableRow>
															{databaseTableHeaders.map(
																(header) => (
																	<TableHead
																		key={
																			header
																		}
																		className="h-8 px-3 text-xs"
																	>
																		{header}
																	</TableHead>
																),
															)}
														</TableRow>
													</TableHeader>
													<TableBody>
														{databaseTableRows.map(
															(row, rowIndex) => (
																<TableRow
																	key={
																		// biome-ignore lint/suspicious/noArrayIndexKey: Preview rows have no unique record identifier.
																		rowIndex
																	}
																>
																	{row.map(
																		(
																			value,
																			columnIndex,
																		) => (
																			<TableCell
																				key={`${databaseTableHeaders[columnIndex]}-${columnIndex}`}
																				className="px-3 py-1.5"
																			>
																				{
																					value
																				}
																			</TableCell>
																		),
																	)}
																</TableRow>
															),
														)}
													</TableBody>
												</Table>
											</section>
										)}
									</TabsContent>
								</Tabs>
							)}

							{joinElements.length > 0 && (
								<section
									aria-labelledby={`${databaseSelectId}-joins`}
									className="mt-4 space-y-2"
								>
									<H3
										id={`${databaseSelectId}-joins`}
										className="font-medium text-sm"
									>
										Joins
									</H3>
									<div className="divide-y divide-border rounded-md border border-border">
										{joinElements.map((join, index) => (
											<div
												key={join.id}
												className="grid gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center"
											>
												<div className="min-w-0">
													<p className="break-all text-sm">
														{join.leftTable}
													</p>
													{join.leftKey && (
														<p className="break-all text-muted-foreground text-xs">
															{join.leftKey}
														</p>
													)}
												</div>
												<Select
													value={
														watchedJoins?.[index]
															?.joinType ??
														join.joinType
													}
													onValueChange={(value) =>
														formSetValue(
															`joins.${index}.joinType`,
															value,
														)
													}
												>
													<SelectTrigger
														size="sm"
														aria-label={`Join type for ${join.leftTable} and ${join.rightTable}`}
														className="w-full gap-2 shadow-none sm:w-36"
													>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{JOIN_TYPES.map(
															({
																value,
																label,
															}) => (
																<SelectItem
																	key={value}
																	value={
																		value
																	}
																>
																	{label}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
												<div className="min-w-0">
													<p className="break-all text-sm">
														{join.rightTable}
													</p>
													{join.rightKey && (
														<p className="break-all text-muted-foreground text-xs">
															{join.rightKey}
														</p>
													)}
												</div>
											</div>
										))}
									</div>
								</section>
							)}
						</section>
						<DialogFooter className="shrink-0 flex-col gap-2 border-border border-t px-4 py-3 sm:items-center sm:justify-between">
							<p className="text-muted-foreground text-xs">
								{selectionHint}
							</p>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									type="button"
									onClick={closeImportModalHandler}
								>
									Cancel
								</Button>
								<Tooltip disableHoverableContent={false}>
									<TooltipTrigger asChild>
										<span
											className="inline-flex"
											tabIndex={
												disabledReason ? 0 : undefined
											}
										>
											<Button
												size="sm"
												type="submit"
												disabled={Boolean(
													disabledReason,
												)}
											>
												{editMode
													? "Update Cell"
													: "Import"}
											</Button>
										</span>
									</TooltipTrigger>
									<TooltipContent>
										{disabledReason ??
											(editMode
												? "Update this cell"
												: "Import selected columns")}
									</TooltipContent>
								</Tooltip>
							</div>
						</DialogFooter>
					</Form>
				</DialogContent>
			</Dialog>
		);
	},
);
