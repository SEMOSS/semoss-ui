import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Card, styled } from "@semoss/ui";
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

const StyledContainer = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	height: "105vh",
	width: "100%",
	overflow: "hidden",
	padding: 0,
	position: "relative",
}));

const StyledCard = styled(Card)(({ theme }) => ({
	borderRadius: "12px",
	background: theme.palette.background.paper,
	boxShadow: `0px 4px 4px 0px rgba(0, 0, 0, 0.04)`,
	height: "100%",
	display: "flex",
	flexDirection: "column",
}));

const StyledContent = styled("div")<{ isQueryResultsExpanded: boolean }>(
	({ theme, isQueryResultsExpanded }) => ({
		flex: 1,
		display: "flex",
		gap: theme.spacing(2),
		width: "100%",
		overflow: "hidden",
		minHeight: 0,
		paddingBottom: theme.spacing(4),
		// Hide when query results are expanded
		opacity: isQueryResultsExpanded ? 0 : 1,
		pointerEvents: isQueryResultsExpanded ? "none" : "auto",
		transition: "opacity 0.3s ease-in-out",
		visibility: isQueryResultsExpanded ? "hidden" : "visible",
	}),
);

const StyledLeft = styled("div")(() => ({
	width: "30%",
	minWidth: "300px",
	display: "flex",
	flexDirection: "column",
}));

const StyledRight = styled("div")(() => ({
	flex: 1,
	display: "flex",
	flexDirection: "column",
	minWidth: 0,
}));

const StyledQueryResultsWrapper = styled("div")<{ isExpanded: boolean }>(
	({isExpanded }) => ({
		position: isExpanded ? "absolute" : "relative",
		top: isExpanded ? 0 : "auto",
		left: isExpanded ? 0 : "auto",
		right: isExpanded ? 0 : "auto",
		bottom: isExpanded ? 0 : "auto",
		width: isExpanded ? "100%" : "auto",
		height: isExpanded ? "100%" : "auto",
		transition: "all 0.3s ease-in-out",
		display: "flex",
		flexDirection: "column",
	}),
);

export const EngineQueryDataPage = observer(() => {
	const { active } = useEngine();
	const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
	const [isQueryResultsExpanded, setIsQueryResultsExpanded] = useState(false);

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
		// limit,
		// setLimit,
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

	const handleToggleColumnSelection = (tableName: string, columnName: string) => {
		toggleColumnSelection(tableName, columnName);
	};

	const handleClearColumnSelection = () => {
		clearColumnSelection();
		clearQuery();
	};

	return (
		<StyledContainer data-testid='queryDataPage-container'>
			<StyledContent isQueryResultsExpanded={isQueryResultsExpanded} data-testid='engine-queryDataPage-content'>
				<StyledLeft>
					<StyledCard>
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
							onToggleColumnSelection={handleToggleColumnSelection}
							onClearColumnSelection={handleClearColumnSelection}
							onGenerateQuery={handleGenerateQuery}
							generateSelectedColumnsQuery={generateSelectedColumnsQuery}
						/>
					</StyledCard>
				</StyledLeft>

				<StyledRight>
					<StyledCard>
						<SQLQueryEditor
							query={query}
							setQuery={setQuery}
							clearQuery={clearQuery}
							handleEditorMount={handleEditorMount}
							executeQuery={executeQuery}
							previewLoading={previewLoading}
							// limit={limit}
							// setLimit={setLimit}
						/>
					</StyledCard>
				</StyledRight>
			</StyledContent>

			<StyledQueryResultsWrapper isExpanded={isQueryResultsExpanded}>
				<QueryResultsPanel
					previewData={previewData}
					previewLoading={previewLoading}
					clearResults={clearResults}
					// previewLimit={limit}
					onExpandChange={setIsQueryResultsExpanded}
				/>
			</StyledQueryResultsWrapper>
		</StyledContainer>
	);
});