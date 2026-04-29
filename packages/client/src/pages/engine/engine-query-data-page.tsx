import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, cn } from "@semoss/ui/next";
import {
	DatabaseStructureBrowser,
	QueryResultsPanel,
	SQLQueryEditor,
} from "@/components/database";
import {
	useDatabaseStructure,
	useEngine,
	useQueryEditor,
	useQueryExecution,
} from "@/hooks";
import { hasTabularData } from "@/hooks/useDatabaseQueryExecution";

export const EngineQueryDataPage = observer(() => {
	const { active } = useEngine();
	const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
	const [isQueryResultsExpanded, setIsQueryResultsExpanded] = useState(false);
	const [isUserModifiedQuery, setIsUserModifiedQuery] = useState(false);

	// Resize states
	const [bottomPanelHeight, setBottomPanelHeight] = useState(300); // pixels
	const [isResizingVertical, setIsResizingVertical] = useState(false);

	const [isMobile, setIsMobile] = useState(
		() => typeof window !== "undefined" && window.innerWidth < 768,
	);

	const containerRef = useRef<HTMLDivElement>(null);
	const ignoreProgrammaticQueryValueRef = useRef<string | null>(null);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const handleRefresh = () => {
		setRefreshMessage("Refreshing database structure...");
		refreshDatabaseStructure();
		setTimeout(() => setRefreshMessage(null), 3000);
	};

	const {
		structure,
		searchTerm,
		setSearchTerm,
		searchedStructure,
		expandedTables,
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
	} = useDatabaseStructure(active.id || "");

	const {
		query,
		setQuery,
		previewData,
		previewLoading,
		clearQuery: clearQueryInternal,
		clearResults,
		executeQuery: executeQueryInternal,
		pixelQuery,
	} = useQueryExecution(active.id || "", {
		onSchemaChange: () => {
			refreshDatabaseStructure();
		},
	});

	const executeQuery = async (queryOverride?: string) => {
		await executeQueryInternal(queryOverride);
	};

	const { handleEditorMount, setValue } = useQueryEditor({
		onRun: (value) => {
			executeQuery(value);
		},
		tables: structure.tables,
	});

	const clearQuery = () => {
		clearQueryInternal();
		setValue("");
		setIsUserModifiedQuery(false);
	};

	const setQueryProgrammatically = useCallback(
		(nextQuery: string) => {
			ignoreProgrammaticQueryValueRef.current = nextQuery;
			setQuery(nextQuery);
			setValue(nextQuery);
		},
		[setQuery, setValue],
	);

	const setGeneratedQuery = useCallback(
		(nextQuery: string) => {
			setQueryProgrammatically(nextQuery);
			setIsUserModifiedQuery(false);
		},
		[setQueryProgrammatically],
	);

	const appendQueryToken = useCallback(
		(token: string) => {
			const trimmedToken = token.trim();
			if (!trimmedToken) {
				return;
			}

			const shouldAddSpace = query.length > 0 && !/[\s(,]$/.test(query);
			const nextQuery = shouldAddSpace
				? `${query} ${trimmedToken}`
				: `${query}${trimmedToken}`;

			setQueryProgrammatically(nextQuery);
		},
		[query, setQueryProgrammatically],
	);

	const generateTableQuery = (tableName: string) => {
		if (!query.trim() || !isUserModifiedQuery) {
			const sql = `SELECT * FROM ${tableName}`;
			setGeneratedQuery(sql);
			clearColumnSelection();
			return;
		}

		appendQueryToken(tableName);
	};

	const handleToggleColumnSelection = (
		tableName: string,
		columnName: string,
	) => {
		toggleColumnSelection(tableName, columnName);
	};

	const handleClearColumnSelection = () => {
		clearColumnSelection();
		clearQuery();
	};

	const handleUserQueryInput = useCallback(
		(nextQuery: string) => {
			if (ignoreProgrammaticQueryValueRef.current === nextQuery) {
				ignoreProgrammaticQueryValueRef.current = null;
				return;
			}

			ignoreProgrammaticQueryValueRef.current = null;
			setIsUserModifiedQuery(true);

			if (
				activeTable &&
				selectedColumns[activeTable] &&
				selectedColumns[activeTable].length > 0
			) {
				clearColumnSelection();
			}
		},
		[activeTable, selectedColumns, clearColumnSelection],
	);

	const handleColumnNameInsert = useCallback(
		(_tableName: string, columnName: string) => {
			appendQueryToken(columnName);
		},
		[appendQueryToken],
	);

	const handleGenerateQuery = useCallback(
		(generatedQuery: string) => {
			setGeneratedQuery(generatedQuery);
		},
		[setGeneratedQuery],
	);

	const canAutoGenerateQuery = !query.trim() || !isUserModifiedQuery;

	// Vertical resize handlers
	const handleVerticalResizeStart = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizingVertical(true);
	}, []);

	const handleVerticalResize = useCallback(
		(e: MouseEvent) => {
			if (!isResizingVertical || !containerRef.current) return;

			const container = containerRef.current;
			const containerRect = container.getBoundingClientRect();
			const containerHeight = containerRect.height;

			// Calculate new bottom panel height from bottom
			const newHeight = containerRect.bottom - e.clientY;

			// Constrain between 200px and 80% of container height
			const constrainedHeight = Math.max(
				200,
				Math.min(containerHeight * 0.8, newHeight),
			);

			setBottomPanelHeight(constrainedHeight);
		},
		[isResizingVertical],
	);

	const handleVerticalResizeEnd = useCallback(() => {
		setIsResizingVertical(false);
	}, []);

	useEffect(() => {
		if (
			isMobile ||
			isQueryResultsExpanded ||
			isResizingVertical ||
			previewLoading ||
			!previewData ||
			!hasTabularData(previewData)
		) {
			return;
		}

		const containerHeight =
			containerRef.current?.getBoundingClientRect().height ??
			window.innerHeight;
		const targetHeight = Math.max(
			320,
			Math.min(520, containerHeight * 0.45),
		);

		if (bottomPanelHeight < targetHeight) {
			setBottomPanelHeight(targetHeight);
		}
	}, [
		isMobile,
		isQueryResultsExpanded,
		isResizingVertical,
		previewLoading,
		previewData,
		bottomPanelHeight,
	]);

	useEffect(() => {
		if (isResizingVertical) {
			document.addEventListener("mousemove", handleVerticalResize);
			document.addEventListener("mouseup", handleVerticalResizeEnd);
			document.body.style.cursor = "row-resize";
			document.body.style.userSelect = "none";

			return () => {
				document.removeEventListener("mousemove", handleVerticalResize);
				document.removeEventListener(
					"mouseup",
					handleVerticalResizeEnd,
				);
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
			};
		}
	}, [isResizingVertical, handleVerticalResize, handleVerticalResizeEnd]);

	return (
		<div
			ref={containerRef}
			className="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20"
			data-testid="queryDataPage-container"
		>
			{/* Main Content Area */}
			<div
				className={cn(
					"min-h-0 w-full flex-1 transition-opacity duration-500 ease-out",
					isMobile ? "flex flex-col overflow-y-auto" : "flex",
					isQueryResultsExpanded
						? "pointer-events-none opacity-0"
						: "opacity-100",
				)}
				style={
					isMobile
						? undefined
						: {
								height: isQueryResultsExpanded
									? 0
									: `calc(100% - ${bottomPanelHeight}px)`,
							}
				}
				data-testid="engine-queryDataPage-content"
			>
				{/* Left Panel - Database Structure Browser */}
				<div
					className="flex flex-col transition-all duration-200"
					style={
						isMobile
							? { width: "100%", height: "280px", flexShrink: 0 }
							: { width: "32%", minWidth: "280px" }
					}
				>
					<Card className="group flex h-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl">
						<DatabaseStructureBrowser
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							searchedStructure={searchedStructure}
							expandedTables={expandedTables}
							toggleTable={toggleTable}
							toggleAllTables={toggleAllTables}
							isLoading={isLoading}
							error={error}
							refreshDatabaseStructure={handleRefresh}
							refreshMessage={refreshMessage}
							onTableClick={generateTableQuery}
							selectedColumns={selectedColumns}
							activeTable={activeTable}
							onToggleColumnSelection={
								handleToggleColumnSelection
							}
							onClearColumnSelection={handleClearColumnSelection}
							onColumnNameInsert={handleColumnNameInsert}
							onGenerateQuery={handleGenerateQuery}
							generateSelectedColumnsQuery={
								generateSelectedColumnsQuery
							}
							canAutoGenerateQuery={canAutoGenerateQuery}
						/>
					</Card>
				</div>

				{/* Right Panel - SQL Query Editor */}
				<div
					className="flex flex-col transition-all duration-200"
					style={
						isMobile
							? { width: "100%", height: "300px", flexShrink: 0 }
							: { flex: 1, minWidth: "400px" }
					}
				>
					<Card className="group flex h-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl p-0">
						<SQLQueryEditor
							query={query}
							setQuery={setQuery}
							clearQuery={clearQuery}
							handleEditorMount={handleEditorMount}
							executeQuery={executeQuery}
							previewLoading={previewLoading}
							onUserQueryInput={handleUserQueryInput}
						/>
					</Card>
				</div>
			</div>

			{/* Query Results Panel - Expandable Full Screen */}
			<div
				className={cn(
					"flex flex-col transition-all duration-500 ease-out",
					isQueryResultsExpanded
						? "absolute inset-0 z-50 size-full"
						: "relative w-full flex-shrink-0",
				)}
				style={{
					height: isQueryResultsExpanded
						? "100%"
						: isMobile
							? "400px"
							: `${bottomPanelHeight}px`,
				}}
				data-testid="query-results-wrapper"
			>
				{/* Vertical Resize Handle - Desktop only */}
				{!isQueryResultsExpanded && !isMobile && (
					<button
						type="button"
						onMouseDown={handleVerticalResizeStart}
						className="h-2 w-full flex-shrink-0 cursor-row-resize transition-colors hover:bg-primary/5"
						data-testid="vertical-resize-handle"
						aria-label="Resize panels vertically"
					/>
				)}

				<div
					className={cn(
						"flex flex-col transition-all duration-500",
						isQueryResultsExpanded
							? "h-full"
							: "h-[calc(100%-0.5rem)]",
					)}
				>
					<div
						className={cn(
							"h-full",
							!isQueryResultsExpanded && "pb-4",
						)}
					>
						<QueryResultsPanel
							previewData={previewData}
							previewLoading={previewLoading}
							clearResults={clearResults}
							onExpandChange={setIsQueryResultsExpanded}
							pixelQuery={pixelQuery}
						/>
					</div>
				</div>
			</div>

			{/* Refresh Message Toast */}
			{refreshMessage && (
				<div
					className="slide-in-from-bottom-5 fade-in fixed right-6 bottom-6 z-50 animate-in duration-300"
					data-testid="refresh-toast"
				>
					<div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 shadow-lg backdrop-blur-md">
						<div className="size-2 animate-pulse rounded-full bg-primary" />
						<p className="font-medium text-foreground text-sm">
							{refreshMessage}
						</p>
					</div>
				</div>
			)}
		</div>
	);
});
