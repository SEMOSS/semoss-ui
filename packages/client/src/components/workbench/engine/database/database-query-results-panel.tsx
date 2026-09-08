import { AlertCircle, Download, Table2Icon } from "lucide-react";
import { useState } from "react";
import { download } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Code,
	CodeContainer,
	P,
	Spinner,
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
} from "@semoss/ui/next";
import { useDatabaseWorkbench, useEngine, useRootStore } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { DatabaseResultsHeader } from "./database-results-header";
import { DatabaseStatementResultView } from "./database-statement-result-view";

/** The config a results instance is opened with. */
export interface DatabaseQueryResultsConfig {
	/** The query panel this results panel is paired 1:1 with. */
	sourcePanel: string;
}

const DatabaseQueryResultsPanel: WorkbenchComponent<
	DatabaseQueryResultsConfig
> = ({ config }) => {
	const { engine } = useEngine();
	const { configStore } = useRootStore();

	const sourcePanel = config.sourcePanel;

	const mode = useDatabaseWorkbench((state) => state.mode);
	const result = useDatabaseWorkbench(
		(state) => state.results[sourcePanel] ?? null,
	);
	const isRunning = useDatabaseWorkbench(
		(state) => state.runningPanels[sourcePanel] ?? false,
	);

	// ADMIN_SQL has no export — `AdminSqlQuery | ToCsv` is unverified backend
	// behavior, and the legacy admin tool never offered it
	const canExport = mode !== "ADMIN_SQL";

	const [exportingStatement, setExportingStatement] = useState<number | null>(
		null,
	);
	/**
	 * Handle export to CSV click
	 */
	const handleExportToCsvClick = async (
		query: string,
		raw: boolean,
		statement: number,
	) => {
		if (!canExport) {
			return;
		}

		let pixel: string;
		if (mode === "SPARQL") {
			pixel = `SparqlQuery(database=["${engine.engine_id}"], query=["<encode>${query}</encode>"], raw=[${raw}], commit=[true], limit=[-1]) | ToCsv();`;
		} else {
			pixel = `SqlQuery(database=["${engine.engine_id}"], query=["<encode>${query}</encode>"], commit=[true], limit=[-1]) | ToCsv();`;
		}

		try {
			setExportingStatement(statement);

			const response = await configStore.runPixel(pixel);

			if (response.errors?.length) {
				throw new Error(response.errors.join("\n"));
			}

			const firstResult = response?.pixelReturn?.[0];

			await download(response.insightId, firstResult.output as string);

			toast.success("Successfully exported results");
		} catch (error) {
			toast.error(`Failed to export results: ${error}`);
		} finally {
			setExportingStatement(null);
		}
	};

	if (isRunning) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div
			className="flex h-full w-full flex-col gap-2 overflow-hidden p-2"
			data-testid="query-results-panel"
		>
			<div className="w-full flex-1 overflow-hidden">
				{result?.type === "ERROR" && (
					<Alert variant="destructive">
						<AlertCircle aria-hidden />
						<AlertTitle>Query failed</AlertTitle>
						<AlertDescription>{result.message}</AlertDescription>
					</Alert>
				)}
				{result && result.type === "TABLE" && (
					<div className="h-full w-full overflow-hidden">
						<Table wrapperClassName="h-full w-full rounded-md border border-border overflow-auto">
							<TableHeader className="sticky top-0 z-10 bg-secondary">
								<TableRow>
									{result.output.headers.map((header) => (
										<TableHead key={header}>
											{header}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{result.output.values.map((row, rowIdx) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: table rows have no natural unique key
									<TableRow key={rowIdx}>
										{(row as unknown[]).map(
											(cell, cellIdx) => (
												<TableCell
													key={
														result.output.headers[
															cellIdx
														]
													}
												>
													{String(cell ?? "")}
												</TableCell>
											),
										)}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
				{result && result.type === "MESSAGE" && (
					<div className="flex h-full w-full flex-col items-center justify-center overflow-auto whitespace-pre-wrap px-2 text-sm">
						{result.message}
					</div>
				)}
				{result && result.type === "JSON" && (
					<div className="h-full w-full overflow-auto px-2">
						<CodeContainer>
							<Code
								code={JSON.stringify(result.output, null, 2)}
								language="json"
							/>
						</CodeContainer>
					</div>
				)}
				{result && result.type === "BATCH" && (
					<Tabs
						key={result.query}
						defaultValue={`statement-${result.results[0]?.statement ?? 1}`}
						className="h-full min-h-0"
					>
						<div className="flex-none overflow-x-auto">
							<TabsList>
								{result.results.map((statementResult) => (
									<TabsTrigger
										key={statementResult.statement}
										value={`statement-${statementResult.statement}`}
									>
										{statementResult.statement} ·{" "}
										{statementResult.route}
									</TabsTrigger>
								))}
							</TabsList>
						</div>
						{result.results.map((statementResult) => (
							<TabsContent
								key={statementResult.statement}
								value={`statement-${statementResult.statement}`}
								className="min-h-0 overflow-hidden"
							>
								<DatabaseStatementResultView
									result={statementResult}
									canExport={canExport}
									isExporting={
										exportingStatement ===
										statementResult.statement
									}
									onExport={(item) =>
										handleExportToCsvClick(
											item.query,
											result.raw,
											item.statement,
										)
									}
								/>
							</TabsContent>
						))}
					</Tabs>
				)}
			</div>

			<div
				className="flex w-full items-center"
				data-testid="query-results-footer"
			>
				{result && result.type === "TABLE" && canExport && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								disabled={exportingStatement !== null}
								variant="outline"
								size="icon-sm"
								onClick={() =>
									handleExportToCsvClick(
										result.query,
										result.raw,
										0,
									)
								}
								aria-label="Export query results"
								data-testid="query-results-export-btn"
							>
								{exportingStatement === 0 ? (
									<Spinner />
								) : (
									<Download aria-hidden />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>Export Results</TooltipContent>
					</Tooltip>
				)}
				<div className="flex flex-1">&nbsp;</div>
				<div className="flex items-center gap-4">
					{result && (
						<P className="font-medium text-xs">
							Total execution time:{" "}
							<span className="text-foreground">
								{result.timeToRun || 0}ms
							</span>
						</P>
					)}
				</div>
			</div>
		</div>
	);
};

/**
 * Blueprint for results instances. Paired to their query panel through
 * config.sourcePanel; the header derives its title from the query's live
 * name. keepAlive: large result tables and scroll survive tab switches.
 */
export const DATABASE_RESULTS_PANEL: WorkbenchPanelConfig<DatabaseQueryResultsConfig> =
	{
		name: "Results",
		icon: ({ className }) => <Table2Icon className={className} />,
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.sourcePanel === b.sourcePanel,
		header: DatabaseResultsHeader,
		content: DatabaseQueryResultsPanel,
	};
