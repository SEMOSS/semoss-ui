/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
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

export const EngineQueryDataPage = observer(() => {
	const { active } = useEngine();
	const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
	const [isQueryResultsExpanded, setIsQueryResultsExpanded] = useState(false);

	// Resize states
	const [leftPanelWidth, setLeftPanelWidth] = useState(32); // percentage
	const [bottomPanelHeight, setBottomPanelHeight] = useState(300); // pixels
	const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
	const [isResizingVertical, setIsResizingVertical] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);

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
	} = useDatabaseStructure(active.id || "");

	const {
		query,
		setQuery,
		previewData,
		previewLoading,
		clearQuery: clearQueryInternal,
		clearResults,
		executeQuery: executeQueryInternal,
	} = useQueryExecution(active.id || "", {
		onSchemaChange: () => {
			setRefreshMessage(
				"Database schema changed. Refreshing structure...",
			);
			refreshDatabaseStructure();
			setTimeout(() => setRefreshMessage(null), 3000);
		},
	});

	const executeQuery = async () => {
		await executeQueryInternal();
		setRefreshMessage("Refreshing database structure after query...");
		refreshDatabaseStructure();
		setTimeout(() => setRefreshMessage(null), 3000);
	};

	const { handleEditorMount, setValue } = useQueryEditor({
		onRun: executeQuery,
		tables: structure.tables,
	});

	const clearQuery = () => {
		clearQueryInternal();
		setValue("");
	};

	const generateTableQuery = (tableName: string) => {
		const sql = `SELECT * FROM ${tableName}`;
		setQuery(sql);
		setValue(sql);
		clearColumnSelection();
	};

	const handleGenerateQuery = (generatedQuery: string) => {
		setQuery(generatedQuery);
		setValue(generatedQuery);
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

	// Horizontal resize handlers
	const handleHorizontalResizeStart = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizingHorizontal(true);
	}, []);

	const handleHorizontalResize = useCallback(
		(e: MouseEvent) => {
			if (!isResizingHorizontal || !containerRef.current) return;

			const container = containerRef.current;
			const containerRect = container.getBoundingClientRect();
			const containerWidth = containerRect.width;

			// Calculate new left panel width percentage
			const newWidth =
				((e.clientX - containerRect.left) / containerWidth) * 100;

			// Constrain between 20% and 60%
			const constrainedWidth = Math.max(20, Math.min(60, newWidth));

			setLeftPanelWidth(constrainedWidth);
		},
		[isResizingHorizontal],
	);

	const handleHorizontalResizeEnd = useCallback(() => {
		setIsResizingHorizontal(false);
	}, []);

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

	// Mouse event listeners
	useEffect(() => {
		if (isResizingHorizontal) {
			document.addEventListener("mousemove", handleHorizontalResize);
			document.addEventListener("mouseup", handleHorizontalResizeEnd);
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";

			return () => {
				document.removeEventListener(
					"mousemove",
					handleHorizontalResize,
				);
				document.removeEventListener(
					"mouseup",
					handleHorizontalResizeEnd,
				);
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
			};
		}
	}, [
		isResizingHorizontal,
		handleHorizontalResize,
		handleHorizontalResizeEnd,
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
					"flex min-h-0 w-full flex-1 transition-opacity duration-500 ease-out",
					isQueryResultsExpanded
						? "pointer-events-none opacity-0"
						: "opacity-100",
				)}
				style={{
					height: isQueryResultsExpanded
						? 0
						: `calc(100% - ${bottomPanelHeight}px)`,
				}}
				data-testid="engine-queryDataPage-content"
			>
				{/* Left Panel - Database Structure Browser */}
				<div
					className="flex flex-col transition-all duration-200"
					style={{
						width: `${leftPanelWidth}%`,
						minWidth: "280px",
					}}
				>
					<Card className="group flex h-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl">
						<DatabaseStructureBrowser
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							searchedStructure={searchedStructure}
							expandedTables={expandedTables}
							toggleState={toggleState}
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
							onGenerateQuery={handleGenerateQuery}
							generateSelectedColumnsQuery={
								generateSelectedColumnsQuery
							}
						/>
					</Card>
				</div>

				{/* Horizontal Resize Handle - Invisible */}
				<div
					onMouseDown={handleHorizontalResizeStart}
					className="w-2 flex-shrink-0 cursor-col-resize transition-colors hover:bg-primary/5"
					data-testid="horizontal-resize-handle"
				/>

				{/* Right Panel - SQL Query Editor */}
				<div
					className="flex flex-1 flex-col transition-all duration-200"
					style={{ minWidth: "400px" }}
				>
					<Card className="group flex h-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl p-0">
						<SQLQueryEditor
							query={query}
							setQuery={setQuery}
							clearQuery={clearQuery}
							handleEditorMount={handleEditorMount}
							executeQuery={executeQuery}
							previewLoading={previewLoading}
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
						: `${bottomPanelHeight}px`,
				}}
				data-testid="query-results-wrapper"
			>
				{/* Vertical Resize Handle - Invisible */}
				{!isQueryResultsExpanded && (
					<div
						onMouseDown={handleVerticalResizeStart}
						className="h-2 w-full flex-shrink-0 cursor-row-resize transition-colors hover:bg-primary/5"
						data-testid="vertical-resize-handle"
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
					<div className="mb-4 h-full">
						<QueryResultsPanel
							previewData={previewData}
							previewLoading={previewLoading}
							clearResults={clearResults}
							onExpandChange={setIsQueryResultsExpanded}
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
