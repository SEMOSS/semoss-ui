import { AlertCircleIcon, Download } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { download } from "@semoss/sdk/react";
import type { FlexLayout } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Code,
	CodeContainer,
	P,
	Small,
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
import { useRootStore } from "@/hooks";
import type { QueryWorkspaceMode } from "./query-script-templates";

interface QueryResultsPanelProps {
	/** Engine (database) id to query */
	engine: string;

	/** Query language mode (defaults to SQL) */
	mode: QueryWorkspaceMode;

	/**
	 * Data-access variant (defaults to "engine"). "admin" targets a privileged
	 * system database using AdminSqlQuery and AdminGetSystemDatabaseSchema.
	 */
	variant: "engine" | "admin";

	/** The FlexLayout model */
	model: FlexLayout.Model;

	/** Track if the query is currently running */
	isRunning: boolean;

	/** Get the results */
	result:
		| {
				type: "TABLE";
				query: string;
				raw: boolean; // for sparql queries, indicates if the result is raw or not
				sourcePanel: string;
				output: {
					headers: string[];
					values: unknown[][];
				};
				timeToRun: number;
		  }
		| {
				type: "MESSAGE";
				query: string;
				raw: boolean; // for sparql queries, indicates if the result is raw or not
				sourcePanel: string;
				message: string;
				timeToRun: number;
		  }
		| {
				type: "JSON";
				query: string;
				raw: boolean; // for sparql queries, indicates if the result is raw or not
				sourcePanel: string;
				output: unknown;
				timeToRun: number;
		  }
		| {
				type: "ERROR";
				query: string;
				raw: boolean; // for sparql queries, indicates if the result is raw or not
				sourcePanel: string;
				message: string;
				timeToRun: number;
		  }
		| null;
}

export const QueryResultsPanel: React.FC<QueryResultsPanelProps> = ({
	engine,
	mode,
	variant,
	model,
	isRunning,
	result,
}) => {
	const { configStore } = useRootStore();

	const [isExporting, setIsExporting] = useState(false);
	/**
	 * Handle export to CSV click
	 */
	const handleExportToCsvClick = async () => {
		if (result?.type !== "TABLE") {
			return;
		}

		let pixel: string;
		if (variant === "admin") {
			pixel = `AdminSqlQuery(database=["${engine}"], query=["<encode>${result.query}</encode>"], commit=[true], limit=[-1]) | ToCsv();`;
		} else if (mode === "SPARQL") {
			pixel = `SparqlQuery(database=["${engine}"], query=["<encode>${result.query}</encode>"], raw=[${result.raw}], commit=[true], limit=[-1]) | ToCsv();`;
		} else {
			pixel = `SqlQuery(database=["${engine}"], query=["<encode>${result.query}</encode>"], commit=[true], limit=[-1]) | ToCsv();`;
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

	const sourcePanelName =
		(
			model.getNodeById(result?.sourcePanel ?? "") as FlexLayout.TabNode
		)?.getName() ?? "";

	if (isRunning) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div
			className="flex h-full w-full flex-col overflow-hidden"
			data-testid="query-results-panel"
		>
			{/* Header */}
			<div className="flex w-full flex-row items-center p-2">
				<div className="flex w-full flex-1 flex-row items-center gap-1">
					<Small data-testid="query-results-title">Results</Small>
					{sourcePanelName && (
						<Badge
							data-testid="query-results-source"
							variant="outline"
						>
							{sourcePanelName}
						</Badge>
					)}
				</div>
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
			</div>

			{/* Results Content */}
			<div
				className="flex w-full flex-1 flex-col overflow-hidden"
				data-testid="query-results-content"
			>
				<div className="w-full flex-1 overflow-hidden">
					{!result || result.type === "ERROR" ? (
						<div className="h-full w-full overflow-auto px-2 pt-2">
							<Alert
								variant="destructive"
								className="mx-auto max-w-2xl"
							>
								<AlertCircleIcon />
								<AlertDescription className="whitespace-pre-wrap">
									{result?.message}
								</AlertDescription>
							</Alert>
						</div>
					) : null}
					{result && result.type === "TABLE" && (
						<div className="h-full w-full overflow-hidden px-2">
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
															result.output
																.headers[
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
									code={JSON.stringify(
										result.output,
										null,
										2,
									)}
									language="json"
								/>
							</CodeContainer>
						</div>
					)}
				</div>

				<div
					className="flex w-full items-center px-2 py-2"
					data-testid="query-results-footer"
				>
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
		</div>
	);
};
