import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CellOutputBlock } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import {
	type AutomationRunFramePage,
	getAutomationResult,
	getAutomationRunFramePage,
} from "../../../api/automation-history";
import type {
	AutomationNodeResult,
	AutomationSavedResultReference,
} from "../../../domain/automation.types";
import { normalizeAutomationErrorMessage } from "../../../domain/automation-utils";
import {
	getAsyncViewerState,
	getRunNodeDataSource,
	mapSavedResultPage,
	RUN_NODE_VIEW_LABELS,
	RUN_RESULTS_LAYOUT_CLASSES,
} from "./run-node-view-state";

interface RunNodeDataViewerProps {
	appId: string;
	insightId?: string;
	frame?: NonNullable<AutomationNodeResult["OUTPUT_FRAME"]>;
	savedResult?: AutomationSavedResultReference;
	outputPreview: string;
	onOutputPopout?: (output: string) => void;
}

/** Pages a standard SEMOSS frame and falls back to the saved output preview. */
export function RunNodeDataViewer({
	appId,
	insightId,
	frame,
	savedResult,
	outputPreview,
	onOutputPopout,
}: RunNodeDataViewerProps) {
	const [page, setPage] = useState<AutomationRunFramePage | null>(null);
	const [pageOffsets, setPageOffsets] = useState([0]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const offset = pageOffsets.at(-1) ?? 0;

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		setPage(null);
		try {
			const source = getRunNodeDataSource(savedResult, insightId, frame);
			if (source.kind === "retained") {
				setPage(
					mapSavedResultPage(
						await getAutomationResult(
							appId,
							source.savedResult.RESULT_ID,
							offset,
						),
					),
				);
			} else if (source.kind === "live") {
				setPage(
					await getAutomationRunFramePage(
						source.insightId,
						source.frame,
						offset,
					),
				);
			} else {
				throw new Error("Automation output data is unavailable.");
			}
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? normalizeAutomationErrorMessage(requestError.message)
					: "Unable to load node data.",
			);
		} finally {
			setLoading(false);
		}
	}, [appId, frame, insightId, offset, savedResult]);

	useEffect(() => {
		void load();
	}, [load]);

	const viewerState = getAsyncViewerState(
		loading,
		error,
		page !== null,
		page?.total === 0,
	);

	if (viewerState === "loading") {
		return (
			<output className="flex min-h-32 items-center justify-center gap-2 text-muted-foreground text-xs">
				<Loader2 className="size-4 animate-spin" aria-hidden />
				<span>Loading data…</span>
			</output>
		);
	}

	if (viewerState === "error" || !page) {
		return (
			<div className="space-y-2">
				{error && (
					<Alert variant="destructive">
						<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
							<span>{error} Showing the saved preview.</span>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => void load()}
								aria-label={RUN_NODE_VIEW_LABELS.retryData}
							>
								<RefreshCw className="size-3.5" aria-hidden />
								Retry
							</Button>
						</AlertDescription>
					</Alert>
				)}
				<CellOutputBlock
					output={outputPreview}
					onOutputPopout={
						onOutputPopout
							? () => onOutputPopout(outputPreview)
							: undefined
					}
				/>
			</div>
		);
	}

	const { headers, rows, total } = page;
	const firstRow = total === 0 ? 0 : offset + 1;
	const lastRow = Math.min(offset + rows.length, total);
	const nextOffset = page.nextOffset ?? offset + rows.length;
	const hasNextPage =
		(page.hasMore ?? nextOffset < total) && nextOffset > offset;

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
				<span>
					{total === 0
						? "No rows"
						: `${firstRow}–${lastRow} of ${total.toLocaleString()} rows`}
				</span>
				<div className="flex items-center gap-1">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={offset === 0 || loading}
						onClick={() =>
							setPageOffsets((current) =>
								current.length > 1
									? current.slice(0, current.length - 1)
									: current,
							)
						}
						aria-label="Previous data page"
					>
						<ChevronLeft className="size-3.5" aria-hidden />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={!hasNextPage || loading}
						onClick={() =>
							setPageOffsets((current) => [
								...current,
								nextOffset,
							])
						}
						aria-label="Next data page"
					>
						<ChevronRight className="size-3.5" aria-hidden />
					</Button>
				</div>
			</div>
			{viewerState === "empty" ? (
				<output className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-xs">
					No rows were retained for this node.
				</output>
			) : (
				<section
					className={RUN_RESULTS_LAYOUT_CLASSES.scrollRegion}
					aria-label={RUN_NODE_VIEW_LABELS.outputData}
					// biome-ignore lint/a11y/noNoninteractiveTabindex: the bounded data table must support keyboard scrolling.
					tabIndex={0}
				>
					<Table
						className="text-xs"
						wrapperClassName="overflow-visible"
					>
						<TableCaption className="sr-only">
							Automation node output rows {firstRow} through{" "}
							{lastRow}
						</TableCaption>
						<TableHeader className="sticky top-0 bg-muted">
							<TableRow>
								{headers.map((header) => (
									<TableHead
										key={header}
										className="h-auto py-1.5"
									>
										{header}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, rowIndex) => (
								<TableRow
									// biome-ignore lint/suspicious/noArrayIndexKey: page rows do not have a stable identity.
									key={rowIndex}
								>
									{headers.map((header, columnIndex) => (
										<TableCell
											key={header}
											className="max-w-80 whitespace-normal py-1.5 align-top"
										>
											<span className="line-clamp-4 break-words">
												{formatCell(row[columnIndex])}
											</span>
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</section>
			)}
		</div>
	);
}

function formatCell(value: unknown): string {
	if (value == null) return "—";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}
