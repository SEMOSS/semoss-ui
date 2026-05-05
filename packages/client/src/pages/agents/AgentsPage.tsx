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
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import type { TraceRow } from "@/components/agent-traces/types";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

function formatDuration(ms: number): string {
	if (!ms || ms <= 0) return "—";
	if (ms < 1000) return `${ms}ms`;
	const s = Math.floor(ms / 1000);
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	const rem = s % 60;
	return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function formatDateTime(raw: string): string {
	if (!raw) return "—";
	try {
		// Handle "2026-05-05 12:49:45" format from backend
		const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
		const d = new Date(normalized);
		if (Number.isNaN(d.getTime())) return raw;
		return d.toLocaleString();
	} catch {
		return raw;
	}
}

const ALL_HARNESS = "ALL";

const HARNESS_COLORS: Record<string, string> = {
	claude_code:
		"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	room_loop: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
	AskPlayground:
		"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	github_copilot:
		"bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function getHarnessColor(harness: string): string {
	return (
		HARNESS_COLORS[harness] ??
		"bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
	);
}

export const AgentsPage: React.FC = () => {
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();

	const [traces, setTraces] = useState<TraceRow[]>([]);
	const [filtered, setFiltered] = useState<TraceRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
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
		const set = new Set<string>(traces.map((t) => t.HARNESS_NAME));
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
				setTraces(output as TraceRow[]);
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
			result = result.filter((t) => {
				const ts = new Date(
					(t.STARTED_AT || "").replace(" ", "T"),
				).getTime();
				return !Number.isNaN(ts) && ts >= start;
			});
		}

		if (endDate) {
			const end = new Date(endDate).getTime() + 86400000;
			result = result.filter((t) => {
				const ts = new Date(
					(t.STARTED_AT || "").replace(" ", "T"),
				).getTime();
				return !Number.isNaN(ts) && ts <= end;
			});
		}

		if (harnessType !== ALL_HARNESS) {
			result = result.filter((t) => t.HARNESS_NAME === harnessType);
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

	const handleRowClick = (trace: TraceRow) => {
		navigate(trace.TRACE_ID);
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
							<TableHead>User</TableHead>
							<TableHead>Project</TableHead>
							<TableHead>Harness</TableHead>
							<TableHead>Start Time</TableHead>
							<TableHead>Duration</TableHead>
							<TableHead>Tokens (In/Out)</TableHead>
							<TableHead>Iters</TableHead>
							<TableHead>Tools</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.length === 0 && !loading && (
							<TableRow>
								<TableCell
									colSpan={10}
									className="py-8 text-center text-muted-foreground"
								>
									No traces found
								</TableCell>
							</TableRow>
						)}
						{filtered.map((trace) => {
							const isSuccess = trace.STATUS === "OK";
							const isRunning = trace.STATUS === "RUNNING";
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
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-xs ${getHarnessColor(trace.HARNESS_NAME)}`}
										>
											{trace.HARNESS_NAME}
										</span>
									</TableCell>
									<TableCell className="whitespace-nowrap text-xs">
										{formatDateTime(trace.STARTED_AT)}
									</TableCell>
									<TableCell className="font-mono text-xs">
										{formatDuration(trace.DURATION_MS)}
									</TableCell>
									<TableCell className="whitespace-nowrap font-mono text-xs">
										{(
											trace.TOTAL_INPUT_TOKENS ?? 0
										).toLocaleString()}
										{" / "}
										{(
											trace.TOTAL_OUTPUT_TOKENS ?? 0
										).toLocaleString()}
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
													: isRunning
														? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
														: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
											}`}
										>
											{trace.STATUS}
										</span>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};
