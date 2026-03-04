import { useCallback, useEffect, useMemo, useState } from "react";
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

	const fetchDatabaseStructure = useCallback(async () => {
		if (!engineId) return;

		try {
			setIsLoading(true);
			setError(null);

			const pixel = `META|GetDatabaseTableStructure(database=["${engineId}"]);`;
			const response = await monolithStore.runQuery(pixel);
			const rows = response.pixelReturn?.[0]?.output;

			if (!Array.isArray(rows)) {
				throw new Error("Invalid table structure data returned");
			}

			const tableMap = new Map<string, Column[]>();

			rows.forEach((row) => {
				if (!Array.isArray(row) || row.length < 3) {
					return;
				}

				// want to display the physical names since that is required by SQL
				// ENGINECONCEPT__PARENTPHYSICALNAME (table) and ENGINECONCEPT__PHYSICALNAME (column).
				const tableName = String(row[5] ?? row[0] ?? "");
				const columnName = String(row[4] ?? row[1] ?? "");
				const columnType = String(row[2] ?? "UNKNOWN");
				if (!tableName || !columnName) {
					return;
				}

				const columns = tableMap.get(tableName) || [];
				columns.push({
					column: columnName,
					type: columnType,
				});
				tableMap.set(tableName, columns);
			});

			const tablesData: TableStructure[] = Array.from(
				tableMap.entries(),
			).map(([table, columns]) => ({
				table,
				open: true,
				columns,
			}));

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
			setExpandedTables({});
		} finally {
			setIsLoading(false);
		}
	}, [engineId, monolithStore]);

	const refreshDatabaseStructure = () => {
		if (engineId) {
			fetchDatabaseStructure();
		}
	};

	useEffect(() => {
		if (engineId) {
			fetchDatabaseStructure();
		}
	}, [engineId, fetchDatabaseStructure]);

	const searchedStructure = useMemo(() => {
		if (!searchTerm) {
			return structure.tables;
		}

		const cleanedSearch = searchTerm.replace(/ /g, "_").toLowerCase();
		const searched: TableStructure[] = [];

		for (let tableIdx = 0; tableIdx < structure.tables.length; tableIdx++) {
			const table = { ...structure.tables[tableIdx] };
			const tableMatches = table.table
				.toLowerCase()
				.includes(cleanedSearch);

			if (tableMatches) {
				searched.push(table);
				continue;
			}

			table.columns = table.columns.filter((column: Column) =>
				column.column.toLowerCase().includes(cleanedSearch),
			);

			if (table.columns.length > 0) {
				searched.push(table);
			}
		}

		return searched;
	}, [structure.tables, searchTerm]);

	const toggleTable = (tableName: string) => {
		// Toggle a single table and update toggleState immediately based on the new expanded state
		setExpandedTables((prev) => {
			const newState = {
				...prev,
				[tableName]: !prev[tableName],
			};
			const anyExpanded = Object.values(newState).some(Boolean);
			setToggleState(anyExpanded);
			return newState;
		});
	};

	const toggleAllTables = () => {
		// Derive current expand state from latest expandedTables and flip it
		setExpandedTables((prev) => {
			const areAllExpanded =
				searchedStructure.length > 0 &&
				searchedStructure.every((table) => !!prev[table.table]);
			const newState = !areAllExpanded;
			const newExpanded: Record<string, boolean> = {};
			searchedStructure.forEach((table: TableStructure) => {
				newExpanded[table.table] = newState;
			});
			setToggleState(newState);
			return newExpanded;
		});
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
				}

				return {
					...prev,
					[tableName]: [...currentColumns, columnName],
				};
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
