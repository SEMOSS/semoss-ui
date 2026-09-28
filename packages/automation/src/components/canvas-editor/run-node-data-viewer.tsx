import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { JsonViewer } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Code,
	CodeContainer,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { getAutomationRunNodeData } from "../../api";
import type { AutomationRunNodeDataPage } from "../../domain/automation.types";
import { normalizeAutomationErrorMessage } from "../../domain/automation-utils";

interface RunNodeDataViewerProps {
	appId: string;
	runId: string;
	nodeId: string;
}

const PAGE_SIZE = 50;

/** Displays one bounded page from a node value retained by its run workspace. */
export function RunNodeDataViewer({
	appId,
	runId,
	nodeId,
}: RunNodeDataViewerProps) {
	const [page, setPage] = useState<AutomationRunNodeDataPage | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadPage = async (offset: number) => {
		setLoading(true);
		setError(null);
		try {
			setPage(
				await getAutomationRunNodeData(
					appId,
					runId,
					nodeId,
					offset,
					PAGE_SIZE,
				),
			);
		} catch (loadError) {
			setError(
				loadError instanceof Error
					? normalizeAutomationErrorMessage(loadError.message)
					: "Unable to load run data.",
			);
		} finally {
			setLoading(false);
		}
	};

	if (!page && !error) {
		return (
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={loading}
				onClick={() => void loadPage(0)}
			>
				{loading && (
					<Loader2 className="size-4 animate-spin" aria-hidden />
				)}
				{loading ? "Loading data" : "View data"}
			</Button>
		);
	}

	return (
		<div className="space-y-3" aria-busy={loading}>
			{loading && page && (
				<output className="text-muted-foreground text-xs">
					Loading data page…
				</output>
			)}
			{error && (
				<Alert variant="destructive">
					<AlertCircle aria-hidden />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{page && (
				<>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="text-muted-foreground text-xs">
							Showing {page.total === 0 ? 0 : page.offset + 1}–
							{Math.min(page.offset + page.count, page.total)} of{" "}
							{page.total}
						</p>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={loading || page.offset === 0}
								onClick={() =>
									void loadPage(
										Math.max(0, page.offset - page.limit),
									)
								}
							>
								<ChevronLeft className="size-4" aria-hidden />
								Previous
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={loading || !page.hasMore}
								onClick={() =>
									void loadPage(page.offset + page.count)
								}
							>
								Next
								<ChevronRight className="size-4" aria-hidden />
							</Button>
						</div>
					</div>
					{page.kind === "table" ? (
						<Table
							aria-label="Node output data"
							wrapperClassName="max-h-80 rounded-md border border-border overflow-auto"
						>
							<TableHeader className="sticky top-0 bg-muted">
								<TableRow>
									{(page.headers ?? []).map((header) => (
										<TableHead key={header}>
											{header}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{(page.rows ?? []).map((row, rowIndex) => (
									<TableRow
										// biome-ignore lint/suspicious/noArrayIndexKey: each page is immutable and rows have no canonical identifier
										key={page.offset + rowIndex}
									>
										{row.map((cell, cellIndex) => (
											<TableCell
												key={
													page.headers?.[cellIndex] ??
													cellIndex
												}
											>
												{formatCell(cell)}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : page.kind === "text" ? (
						<CodeContainer className="max-h-80 overflow-auto rounded-md border border-border bg-muted/20 p-3">
							<Code
								code={String(page.value ?? "")}
								language="text"
							/>
						</CodeContainer>
					) : (
						<div className="max-h-80 overflow-auto rounded-md border border-border bg-muted/20 p-3">
							<JsonViewer value={page.value} />
						</div>
					)}
				</>
			)}
		</div>
	);
}

function formatCell(value: unknown): string {
	if (value === null || value === undefined) return "";
	return typeof value === "object" ? JSON.stringify(value) : String(value);
}
