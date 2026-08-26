import { Download, Table2Icon } from "lucide-react";
import { useState } from "react";
import { download } from "@semoss/sdk/react";
import {
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

/** The config a results instance is opened with. */
export interface DatabaseQueryResultsConfig {
	/** The query panel this results panel is paired 1:1 with. */
	sourcePanel: string;
}

export const DatabaseQueryResultsPanel: WorkbenchComponent<
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

	const [isExporting, setIsExporting] = useState(false);
	/**
	 * Handle export to CSV click
	 */
	const handleExportToCsvClick = async () => {
		if (result?.type !== "TABLE") {
			return;
		}

		let pixel: string;
		if (mode === "SPARQL") {
			pixel = `SparqlQuery(database=["${engine.engine_id}"], query=["<encode>${result.query}</encode>"], raw=[${result.raw}], commit=[true], limit=[-1]) | ToCsv();`;
		} else {
			pixel = `SqlQuery(database=["${engine.engine_id}"], query=["<encode>${result.query}</encode>"], commit=[true], limit=[-1]) | ToCsv();`;
		}

		try {
			setIsExporting(true);

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
			setIsExporting(false);
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
				{!result || result.type === "ERROR" ? (
					<div className="w-full">
						<pre className="overflow-x-auto whitespace-pre-wrap rounded bg-destructive/5 p-3 font-mono text-destructive text-xs">
							{result?.type === "ERROR" ? result.message : null}
						</pre>
					</div>
				) : null}
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
			</div>

			<div
				className="flex w-full items-center"
				data-testid="query-results-footer"
			>
				{result && result.type === "TABLE" && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								disabled={isExporting}
								variant="outline"
								size="icon-sm"
								onClick={handleExportToCsvClick}
								data-testid="query-results-export-btn"
							>
								{isExporting ? <Spinner /> : <Download />}
							</Button>
						</TooltipTrigger>
						<TooltipContent>Export Results</TooltipContent>
					</Tooltip>
				)}
				<div className="flex flex-1">&nbsp;</div>
				<div className="flex items-center gap-4">
					{result && (
						<P className="font-medium text-xs">
							Execution time:{" "}
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
