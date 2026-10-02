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
	getAutomationRunFramePage,
} from "../../../api";
import type { AutomationNodeResult } from "../../../domain/automation.types";
import { normalizeAutomationErrorMessage } from "../../../domain/automation-utils";

const PAGE_SIZE = 50;

interface RunNodeDataViewerProps {
	insightId: string;
	frame: NonNullable<AutomationNodeResult["OUTPUT_FRAME"]>;
	outputPreview: string;
	onOutputPopout: (output: string) => void;
}

/** Pages a standard SEMOSS frame and falls back to the saved output preview. */
export function RunNodeDataViewer({
	insightId,
	frame,
	outputPreview,
	onOutputPopout,
}: RunNodeDataViewerProps) {
	const [page, setPage] = useState<AutomationRunFramePage | null>(null);
	const [offset, setOffset] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setPage(await getAutomationRunFramePage(insightId, frame, offset));
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? normalizeAutomationErrorMessage(requestError.message)
					: "Unable to load node data.",
			);
		} finally {
			setLoading(false);
		}
	}, [frame, insightId, offset]);

	useEffect(() => {
		void load();
	}, [load]);

	if (loading && !page) {
		return (
			<div className="flex min-h-32 items-center justify-center gap-2 text-muted-foreground text-xs">
				<Loader2 className="size-4 animate-spin" aria-hidden />
				<span>Loading data…</span>
			</div>
		);
	}

	if (error || !page) {
		return (
			<div className="space-y-2">
				{error && (
					<Alert className="flex items-center justify-between gap-2">
						<AlertDescription>
							{error} Showing the saved preview.
						</AlertDescription>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => void load()}
							aria-label="Retry loading node data"
						>
							<RefreshCw className="size-3.5" aria-hidden />
						</Button>
					</Alert>
				)}
				<CellOutputBlock
					output={outputPreview}
					onOutputPopout={() => onOutputPopout(outputPreview)}
				/>
			</div>
		);
	}

	const { headers, rows, total } = page;
	const firstRow = total === 0 ? 0 : offset + 1;
	const lastRow = Math.min(offset + rows.length, total);

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
							setOffset(Math.max(0, offset - PAGE_SIZE))
						}
						aria-label="Previous data page"
					>
						<ChevronLeft className="size-3.5" aria-hidden />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={offset + rows.length >= total || loading}
						onClick={() => setOffset(offset + PAGE_SIZE)}
						aria-label="Next data page"
					>
						<ChevronRight className="size-3.5" aria-hidden />
					</Button>
				</div>
			</div>
			<section
				className="max-h-[28rem] overflow-auto rounded-md border"
				aria-label="Automation node output data"
			>
				<Table className="text-xs" wrapperClassName="overflow-visible">
					<TableCaption className="sr-only">
						Automation node output rows {firstRow} through {lastRow}
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
		</div>
	);
}

function formatCell(value: unknown): string {
	if (value == null) return "—";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}
