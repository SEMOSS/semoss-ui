import { useEffect, useMemo, useState } from "react";
import { useRootStore } from "./useRootStore";

interface Column {
	column: string;
	type: string;
}

interface TableStructure {
	table: string;
	open: boolean;
	columns: Column[];
}

export function useDatabaseStructure(engineId: string) {
	const [structure, setStructure] = useState<{
		tables: TableStructure[];
	}>({
		tables: [],
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [expandedTables, setExpandedTables] = useState<
		Record<string, boolean>
	>({});
	const [toggleState, setToggleState] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [selectedColumns, setSelectedColumns] = useState<
		Record<string, string[]>
	>({});
	const [activeTable, setActiveTable] = useState<string | null>(null);

	const { monolithStore } = useRootStore();

	const fetchDatabaseStructure = async () => {
		if (!engineId) return;

		try {
			setIsLoading(true);
			setError(null);

			const pixel = `GetDatabaseTableStructure(database=["${engineId}"]);`;
			const response = await monolithStore.runQuery(pixel);
			const output = response.pixelReturn[0]?.output;

			if (!output || !Array.isArray(output)) {
				console.log("No structure data found for database:", engineId);
				setStructure({ tables: [] });
				return;
			}

			const tablesMap: Record<string, TableStructure> = {};

			for (const row of output) {
				const tableName = row[0] as string;
				const columnName = row[1] as string;
				const type = (row[2] as string) || "UNKNOWN";
				const isPK = row[3] as boolean;

				if (isPK) {
					if (!tablesMap[columnName]) {
						tablesMap[columnName] = {
							table: columnName,
							open: true,
							columns: [],
						};
					}
				} else {
					if (!tablesMap[tableName]) {
						tablesMap[tableName] = {
							table: tableName,
							open: true,
							columns: [],
						};
					}
					tablesMap[tableName].columns.push({
						column: columnName,
						type,
					});
				}
			}

			const tablesData = Object.values(tablesMap);

			setStructure({
				tables: tablesData,
			});

			const initialExpanded: Record<string, boolean> = {};
			tablesData.forEach((table) => {
				initialExpanded[table.table] = true;
			});
			setExpandedTables(initialExpanded);
		} catch (err) {
			console.error("Error fetching database structure:", err);
			setError("Failed to fetch database structure");
			setStructure({ tables: [] });
		} finally {
			setIsLoading(false);
		}
	};

	const refreshDatabaseStructure = () => {
		if (engineId) {
			fetchDatabaseStructure();
		}
	};

	useEffect(() => {
		if (engineId) {
			fetchDatabaseStructure();
		}
	}, [engineId]);

	const searchedStructure = useMemo(() => {
		if (!searchTerm) {
			return structure.tables;
		}

		const cleanedSearch = searchTerm.replace(/ /g, "_");
		const searched: TableStructure[] = [];

		for (let tableIdx = 0; tableIdx < structure.tables.length; tableIdx++) {
			const table = { ...structure.tables[tableIdx] };
			table.columns = table.columns.filter((column: Column) =>
				column.column
					.toLowerCase()
					.includes(cleanedSearch.toLowerCase()),
			);

			if (table.columns.length > 0) {
				searched.push(table);
			}
		}

		return searched;
	}, [structure.tables, searchTerm]);

	const toggleTable = (tableName: string) => {
		setExpandedTables((prev) => {
			const newState = {
				...prev,
				[tableName]: !prev[tableName],
			};
			return newState;
		});

		setTimeout(() => checkToggle(), 0);
	};

	const toggleAllTables = () => {
		const newState = !toggleState;
		const newExpanded: Record<string, boolean> = {};
		searchedStructure.forEach((table: TableStructure) => {
			newExpanded[table.table] = newState;
		});
		setExpandedTables(newExpanded);
		setToggleState(newState);
	};

	const checkToggle = () => {
		for (const table of structure.tables) {
			if (expandedTables[table.table]) {
				setToggleState(true);
				return;
			}
		}
		setToggleState(false);
	};

	const toggleColumnSelection = (tableName: string, columnName: string) => {
		// if switching to a different table, reset column selection
		if (activeTable && activeTable !== tableName) {
			setSelectedColumns({ [tableName]: [columnName] });
		} else {
			setSelectedColumns((prev) => {
				const currentColumns = prev[tableName] || [];
				const isSelected = currentColumns.includes(columnName);

				if (isSelected) {
					const newColumns = currentColumns.filter(
						(col) => col !== columnName,
					);
					return { ...prev, [tableName]: newColumns };
				} else {
					return {
						...prev,
						[tableName]: [...currentColumns, columnName],
					};
				}
			});
		}
		setActiveTable(tableName);
	};

	const clearColumnSelection = () => {
		setSelectedColumns({});
		setActiveTable(null);
	};

	const generateSelectedColumnsQuery = (): string => {
		if (
			!activeTable ||
			!selectedColumns[activeTable] ||
			selectedColumns[activeTable].length === 0
		) {
			return "";
		}

		const columns = selectedColumns[activeTable];

		if (columns.length === 1) {
			return `SELECT ${columns[0]} FROM ${activeTable}`;
		}

		const columnList = columns.join(", ");
		return `SELECT ${columnList} FROM ${activeTable}`;
	};

	return {
		structure,
		searchTerm,
		setSearchTerm,
		searchedStructure,
		expandedTables,
		toggleState,
		toggleTable,
		toggleAllTables,
		isLoading,
		error,
		refreshDatabaseStructure,
		selectedColumns,
		activeTable,
		toggleColumnSelection,
		clearColumnSelection,
		generateSelectedColumnsQuery,
	};
}
