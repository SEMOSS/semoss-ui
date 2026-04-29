import { RefreshCcw } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
	Button,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { TraceTree } from "@/components/agent-traces/TraceTree";
import type { AgentTrace } from "@/components/agent-traces/types";
import { useRootStore } from "@/hooks";

interface TracesTabProps {
	appId: string;
}

function calcDurationMs(start: string, end: string): string {
	const diff = new Date(end).getTime() - new Date(start).getTime();
	return Number.isNaN(diff) ? "—" : `${diff}ms`;
}

function formatDateTime(iso: string): string {
	try {
		return new Date(iso).toLocaleString();
	} catch {
		return iso;
	}
}

export const TracesTab: React.FC<TracesTabProps> = ({ appId }) => {
	const { monolithStore } = useRootStore();
	const [traces, setTraces] = useState<AgentTrace[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedTrace, setSelectedTrace] = useState<AgentTrace | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const fetchTraces = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await monolithStore.runQuery(
				`ListAgentTraces(limit=["50"]);`,
			);
			const output = res?.pixelReturn?.[0]?.output;
			if (Array.isArray(output)) {
				const filtered = (output as AgentTrace[]).filter(
					(t) => t.PROJECT_ID === appId,
				);
				setTraces(filtered);
			}
		} catch (e) {
			setError((e as Error).message ?? "Failed to load traces");
		} finally {
			setLoading(false);
		}
	}, [monolithStore, appId]);

	useEffect(() => {
		fetchTraces();
	}, [fetchTraces]);

	const handleRowClick = (trace: AgentTrace) => {
		setSelectedTrace(trace);
		setSheetOpen(true);
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<p className="font-semibold text-base">Agent Traces</p>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={fetchTraces}
					disabled={loading}
					title="Refresh"
				>
					{loading ? (
						<Spinner className="size-4" />
					) : (
						<RefreshCcw className="size-4" />
					)}
				</Button>
			</div>

			{error && <p className="text-red-600 text-sm">{error}</p>}

			{!loading && !error && traces.length === 0 && (
				<p className="text-muted-foreground text-sm">
					No traces found for this app.
				</p>
			)}

			{traces.length > 0 && (
				<div className="overflow-x-auto rounded border border-border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Trace ID</TableHead>
								<TableHead>Harness</TableHead>
								<TableHead>Start Time</TableHead>
								<TableHead>Duration</TableHead>
								<TableHead>Iterations</TableHead>
								<TableHead>Tool Calls</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{traces.map((trace) => {
								const isSuccess =
									trace.TERMINATION_REASON === "SUCCESS";
								return (
									<TableRow
										key={trace.TRACE_ID}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => handleRowClick(trace)}
									>
										<TableCell className="max-w-[120px] truncate font-mono text-xs">
											{trace.TRACE_ID}
										</TableCell>
										<TableCell className="text-sm">
											{trace.HARNESS_TYPE}
										</TableCell>
										<TableCell className="text-xs">
											{formatDateTime(trace.START_TIME)}
										</TableCell>
										<TableCell className="font-mono text-xs">
											{calcDurationMs(
												trace.START_TIME,
												trace.END_TIME,
											)}
										</TableCell>
										<TableCell className="text-center">
											{trace.ITERATIONS}
										</TableCell>
										<TableCell className="text-center">
											{trace.TOOL_CALL_COUNT}
										</TableCell>
										<TableCell>
											<span
												className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold text-xs ${
													isSuccess
														? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
														: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
												}`}
											>
												{isSuccess
													? "SUCCESS"
													: "ERROR"}
											</span>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Slide-over detail panel */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
					<SheetHeader>
						<SheetTitle>Trace Detail</SheetTitle>
					</SheetHeader>
					{selectedTrace && (
						<div className="mt-4 space-y-4">
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div>
									<p className="text-muted-foreground text-xs">
										Trace ID
									</p>
									<p className="break-all font-mono text-xs">
										{selectedTrace.TRACE_ID}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">
										Harness
									</p>
									<p>{selectedTrace.HARNESS_TYPE}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">
										Start
									</p>
									<p className="text-xs">
										{formatDateTime(
											selectedTrace.START_TIME,
										)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">
										End
									</p>
									<p className="text-xs">
										{formatDateTime(selectedTrace.END_TIME)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">
										Iterations
									</p>
									<p>{selectedTrace.ITERATIONS}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">
										Tool Calls
									</p>
									<p>{selectedTrace.TOOL_CALL_COUNT}</p>
								</div>
								<div className="col-span-2">
									<p className="text-muted-foreground text-xs">
										Status
									</p>
									<p
										className={
											selectedTrace.TERMINATION_REASON ===
											"SUCCESS"
												? "text-emerald-600"
												: "text-red-600"
										}
									>
										{selectedTrace.TERMINATION_REASON}
									</p>
								</div>
							</div>

							<div>
								<p className="mb-2 font-medium text-sm">
									Trace Tree
								</p>
								<TraceTree
									traces={[
										selectedTrace,
										...traces.filter(
											(t) =>
												t.PARENT_TRACE_ID ===
												selectedTrace.TRACE_ID,
										),
									]}
								/>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
};
