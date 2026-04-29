import { Check, Copy, RefreshCcw } from "lucide-react";
import React, { useCallback, useEffect, useId, useState } from "react";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
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

const ALL_HARNESS = "ALL";

export const AgentsPage: React.FC = () => {
	const { monolithStore } = useRootStore();

	const [traces, setTraces] = useState<AgentTrace[]>([]);
	const [filtered, setFiltered] = useState<AgentTrace[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedTrace, setSelectedTrace] = useState<AgentTrace | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	// Form element IDs
	const userIdInputId = useId();
	const startDateInputId = useId();
	const endDateInputId = useId();

	// Filters
	const [userId, setUserId] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [harnessType, setHarnessType] = useState<string>(ALL_HARNESS);

	const harnessOptions = React.useMemo(() => {
		const set = new Set<string>(traces.map((t) => t.HARNESS_TYPE));
		return Array.from(set).sort();
	}, [traces]);

	const fetchTraces = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await monolithStore.runQuery(
				`ListAgentTraces(limit=["100"]);`,
			);
			const output = res?.pixelReturn?.[0]?.output;
			if (Array.isArray(output)) {
				setTraces(output as AgentTrace[]);
			}
		} catch (e) {
			setError((e as Error).message ?? "Failed to load traces");
		} finally {
			setLoading(false);
		}
	}, [monolithStore]);

	useEffect(() => {
		fetchTraces();
	}, [fetchTraces]);

	// Apply filters
	useEffect(() => {
		let result = traces;

		if (userId.trim()) {
			const lower = userId.trim().toLowerCase();
			result = result.filter((t) =>
				t.USER_ID.toLowerCase().includes(lower),
			);
		}

		if (startDate) {
			const start = new Date(startDate).getTime();
			result = result.filter(
				(t) => new Date(t.START_TIME).getTime() >= start,
			);
		}

		if (endDate) {
			const end = new Date(endDate).getTime() + 86400000; // inclusive
			result = result.filter(
				(t) => new Date(t.START_TIME).getTime() <= end,
			);
		}

		if (harnessType !== ALL_HARNESS) {
			result = result.filter((t) => t.HARNESS_TYPE === harnessType);
		}

		setFiltered(result);
	}, [traces, userId, startDate, endDate, harnessType]);

	const handleCopy = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(id);
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 1500);
		} catch {
			// ignore
		}
	};

	const handleRowClick = (trace: AgentTrace) => {
		setSelectedTrace(trace);
		setSheetOpen(true);
	};

	return (
		<div className="flex flex-col gap-4 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">Agent Traces</h1>
					<p className="text-muted-foreground text-sm">
						Global view of all agent traces
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={fetchTraces}
					disabled={loading}
				>
					{loading ? (
						<Spinner className="mr-2 size-4" />
					) : (
						<RefreshCcw className="mr-2 size-4" />
					)}
					Refresh
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3">
				<div className="flex flex-col gap-1">
					<label
						htmlFor={userIdInputId}
						className="font-medium text-muted-foreground text-xs"
					>
						User ID
					</label>
					<Input
						id={userIdInputId}
						placeholder="Filter by user..."
						value={userId}
						onChange={(e) => setUserId(e.target.value)}
						className="h-8 w-48 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label
						htmlFor={startDateInputId}
						className="font-medium text-muted-foreground text-xs"
					>
						Start Date
					</label>
					<Input
						id={startDateInputId}
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						className="h-8 w-40 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label
						htmlFor={endDateInputId}
						className="font-medium text-muted-foreground text-xs"
					>
						End Date
					</label>
					<Input
						id={endDateInputId}
						type="date"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
						className="h-8 w-40 text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<p className="font-medium text-muted-foreground text-xs">
						Harness Type
					</p>
					<Select value={harnessType} onValueChange={setHarnessType}>
						<SelectTrigger className="h-8 w-44 text-sm">
							<SelectValue placeholder="All" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_HARNESS}>All</SelectItem>
							{harnessOptions.map((h) => (
								<SelectItem key={h} value={h}>
									{h}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{(userId ||
					startDate ||
					endDate ||
					harnessType !== ALL_HARNESS) && (
					<Button
						variant="ghost"
						size="sm"
						className="h-8 self-end"
						onClick={() => {
							setUserId("");
							setStartDate("");
							setEndDate("");
							setHarnessType(ALL_HARNESS);
						}}
					>
						Clear
					</Button>
				)}
			</div>

			{error && <p className="text-red-600 text-sm">{error}</p>}

			<div className="text-muted-foreground text-xs">
				Showing {filtered.length} of {traces.length} traces
			</div>

			<div className="overflow-x-auto rounded border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Trace ID</TableHead>
							<TableHead>User ID</TableHead>
							<TableHead>Project ID</TableHead>
							<TableHead>Harness</TableHead>
							<TableHead>Start Time</TableHead>
							<TableHead>Duration</TableHead>
							<TableHead>Iterations</TableHead>
							<TableHead>Tools</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.length === 0 && !loading && (
							<TableRow>
								<TableCell
									colSpan={9}
									className="py-8 text-center text-muted-foreground"
								>
									No traces found
								</TableCell>
							</TableRow>
						)}
						{filtered.map((trace) => {
							const isSuccess =
								trace.TERMINATION_REASON === "SUCCESS";
							return (
								<TableRow
									key={trace.TRACE_ID}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => handleRowClick(trace)}
								>
									<TableCell>
										<div className="flex items-center gap-1">
											<span className="max-w-[100px] truncate font-mono text-xs">
												{trace.TRACE_ID}
											</span>
											<button
												type="button"
												className="shrink-0 rounded p-0.5 hover:bg-muted"
												onClick={(e) =>
													handleCopy(
														trace.TRACE_ID,
														e,
													)
												}
												title="Copy trace ID"
											>
												{copiedId === trace.TRACE_ID ? (
													<Check className="size-3 text-emerald-500" />
												) : (
													<Copy className="size-3 text-muted-foreground" />
												)}
											</button>
										</div>
									</TableCell>
									<TableCell className="max-w-[100px] truncate text-xs">
										{trace.USER_ID}
									</TableCell>
									<TableCell className="max-w-[100px] truncate text-muted-foreground text-xs">
										{trace.PROJECT_ID ?? "—"}
									</TableCell>
									<TableCell className="text-sm">
										{trace.HARNESS_TYPE}
									</TableCell>
									<TableCell className="whitespace-nowrap text-xs">
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
											{isSuccess ? "SUCCESS" : "ERROR"}
										</span>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{/* Slide-over detail panel */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
					<SheetHeader>
						<SheetTitle>Trace Detail</SheetTitle>
					</SheetHeader>
					{selectedTrace && (
						<div className="mt-4 space-y-4">
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div className="col-span-2">
									<p className="text-muted-foreground text-xs">
										Trace ID
									</p>
									<p className="break-all font-mono text-xs">
										{selectedTrace.TRACE_ID}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">
										User ID
									</p>
									<p className="text-sm">
										{selectedTrace.USER_ID}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">
										Project ID
									</p>
									<p className="text-sm">
										{selectedTrace.PROJECT_ID ?? "—"}
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
										Model
									</p>
									<p className="text-sm">
										{selectedTrace.MODEL_ENGINE_ID}
									</p>
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
										...filtered.filter(
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
