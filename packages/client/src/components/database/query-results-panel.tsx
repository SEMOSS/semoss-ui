import { ChevronDown, Download, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { download, runPixel } from "@semoss/sdk/react";
import {
	Button,
	Card,
	cn,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import {
	getErrorMessage,
	isErrorResponse,
	type QueryResult,
} from "@/hooks/use-database-query-execution";
import { useQueryResults } from "@/hooks/use-database-query-results";

interface QueryResultsPanelProps {
	previewData: QueryResult | null;
	previewLoading: boolean;
	clearResults: () => void;
	onExpandChange?: (expanded: boolean) => void;
	pixelQuery?: string;
}

export const QueryResultsPanel: React.FC<QueryResultsPanelProps> = ({
	previewData,
	previewLoading,
	onExpandChange,
	pixelQuery,
}) => {
	const previewLimit = 50;
	const renderResults = useQueryResults();
	const [isExpanded, setIsExpanded] = useState(false);

	const handleExpandToggle = () => {
		const newExpandedState = !isExpanded;
		setIsExpanded(newExpandedState);

		if (onExpandChange) {
			onExpandChange(newExpandedState);
		}
	};

	const handleExportToCsvClick = async () => {
		const pixelToCsv = `${pixelQuery?.replace(/;$/, "")} | ToCsv();`;

		try {
			const response = await runPixel(pixelToCsv);
			const firstResult = response?.pixelReturn?.[0];

			if (isErrorResponse(firstResult)) {
				toast.error(getErrorMessage(firstResult));
			} else if (firstResult?.operationType?.includes("FILE_DOWNLOAD")) {
				await download(
					response.insightId,
					firstResult.output as string,
				);
				toast.success("Results exported to CSV");
			} else {
				toast.error("Unexpected response from export");
			}
		} catch (error) {
			toast.error(`Failed to export results: ${error}`);
		}
	};

	useEffect(() => {
		if (onExpandChange) {
			onExpandChange(isExpanded);
		}
	}, [isExpanded, onExpandChange]);

	// Helper to get result stats for footer
	const getResultStats = (): string | null => {
		if (!previewData || previewLoading) return null;

		if (previewData.output?.data?.values) {
			const totalRows = previewData.output.data.values.length;
			const showingRows = Math.min(totalRows, previewLimit);
			return `Showing ${showingRows} of ${totalRows} rows`;
		}

		return null;
	};

	const resultStats = getResultStats();

	return (
		<Card
			className={cn(
				"flex flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-0 shadow-lg transition-all duration-200",
				isExpanded
					? "h-full min-h-full flex-1"
					: "h-full min-h-[200px]",
			)}
			data-testid="query-results-panel"
		>
			{/* Header */}
			<div className="flex flex-shrink-0 items-center justify-between border-border/50 border-b bg-gradient-to-r from-accent/50 via-accent/40 to-accent/30 px-4 py-2.5">
				<h3
					className="font-semibold text-foreground text-sm"
					data-testid="query-results-title"
				>
					Query Results
				</h3>
				<div className="flex items-center gap-2">
					{previewData && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									onClick={handleExportToCsvClick}
									className={cn(
										"size-7 rounded-lg border-border bg-card shadow-sm transition-all duration-200 hover:border-border hover:bg-muted",
										"hover:shadow-md",
									)}
									data-testid="query-results-export-btn"
								>
									<Download className="size-4 text-muted-foreground" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								Export Results to CSV
							</TooltipContent>
						</Tooltip>
					)}
					{previewData && (
						<Button
							variant="outline"
							size="icon"
							onClick={handleExpandToggle}
							title={
								isExpanded ? "Collapse Panel" : "Expand Panel"
							}
							className={cn(
								"size-7 rounded-lg border-border bg-card shadow-sm transition-all duration-200 hover:border-border hover:bg-muted",
								"hover:shadow-md",
							)}
							data-testid="query-results-expand-btn"
						>
							<ChevronDown
								className={cn(
									"size-4 text-muted-foreground transition-transform duration-200 ease-in-out",
									isExpanded && "rotate-180",
								)}
							/>
						</Button>
					)}
				</div>
			</div>

			{/* Results Content */}
			<div
				className="flex min-h-0 flex-1 flex-col overflow-auto"
				data-testid="query-results-content"
			>
				{previewLoading ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 p-8">
						<Loader2 className="size-8 animate-spin text-primary" />
						<P className="text-muted-foreground text-sm">
							Loading results...
						</P>
					</div>
				) : (
					renderResults(previewData, previewLimit, isExpanded)
				)}
			</div>

			{/* Footer */}
			{previewData && !previewLoading && (
				<div
					className="flex flex-shrink-0 items-center justify-between border-border/50 border-t bg-muted/30 px-4 py-2.5 text-muted-foreground text-xs"
					data-testid="query-results-footer"
				>
					<div className="flex items-center gap-2">
						{resultStats && (
							<div className="flex items-center gap-1.5">
								<div className="size-1.5 rounded-full bg-primary" />
								<P className="font-medium text-xs">
									{resultStats}
								</P>
							</div>
						)}
					</div>
					<div className="flex items-center gap-4">
						<P className="font-medium text-xs">
							Execution time:{" "}
							<span className="text-foreground">
								{previewData?.timeToRun || 0}ms
							</span>
						</P>
					</div>
				</div>
			)}
		</Card>
	);
};
