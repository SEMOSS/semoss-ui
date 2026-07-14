import {
	AlertCircle,
	CalendarClock,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Database,
	Filter,
	Loader2,
	RefreshCw,
	RotateCcw,
	Server,
	WebhookIcon,
	XCircle,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type {
	WhileIteration,
	WhileIterationNode,
	WorkflowNodeResult,
	WorkflowRunDetail,
	WorkflowRunSummary,
	WorkflowTriggerType,
} from "@/pages/workflow/workflow.types";
import { formatDurationMs } from "./workflow-utils";

// ─── trigger badge ────────────────────────────────────────────────────────────

const TRIGGER_META: Record<
	string,
	{
		label: string;
		icon: React.ComponentType<{ className?: string }>;
		className: string;
	}
> = {
	MANUAL: {
		label: "Manual",
		icon: Zap,
		className:
			"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
	},
	SCHEDULED: {
		label: "Scheduled",
		icon: CalendarClock,
		className:
			"bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
	},
	WEBHOOK: {
		label: "Webhook",
		icon: WebhookIcon,
		className:
			"bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
	},
	STORAGE_POLL: {
		label: "Storage Watch",
		icon: Server,
		className:
			"bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
	},
	DB_POLL: {
		label: "DB Watch",
		icon: Database,
		className:
			"bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
	},
	SUB_WORKFLOW: {
		label: "Sub-Workflow",
		icon: RefreshCw,
		className:
			"bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
	},
	RESUME: {
		label: "Resumed",
		icon: RotateCcw,
		className:
			"bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
	},
};

function TriggerBadge({ type }: { type?: WorkflowTriggerType }) {
	const key = (type ?? "MANUAL").toUpperCase();
	const meta = TRIGGER_META[key] ?? {
		label: type ?? "Manual",
		icon: Zap,
		className: "bg-slate-100 text-slate-600",
	};
	const Icon = meta.icon;
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[10px] ${meta.className}`}
		>
			<Icon className="h-2.5 w-2.5" />
			{meta.label}
		</span>
	);
}

// ─── run status badge ─────────────────────────────────────────────────────────

function RunStatusBadge({ status }: { status: string }) {
	if (status === "SUCCESS")
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
				<CheckCircle2 className="h-2.5 w-2.5" /> Success
			</span>
		);
	if (status === "FAILED")
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-medium text-[10px] text-red-700 dark:bg-red-950 dark:text-red-300">
				<XCircle className="h-2.5 w-2.5" /> Failed
			</span>
		);
	if (status === "RUNNING")
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">
				<Loader2 className="h-2.5 w-2.5 animate-spin" /> Running
			</span>
		);
	if (status === "CANCELLED")
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-[10px] text-muted-foreground">
				<XCircle className="h-2.5 w-2.5" /> Cancelled
			</span>
		);
	return (
		<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
			{status}
		</span>
	);
}

// ─── node result row ──────────────────────────────────────────────────────────

function SubNodeRow({ n }: { n: WhileIterationNode }) {
	const [showOutput, setShowOutput] = useState(false);
	return (
		<div className="rounded px-2 py-1 hover:bg-muted/20">
			<div className="flex items-center gap-2">
				<RunStatusBadge status={n.status} />
				<span className="flex-1 text-xs">{n.label}</span>
				{n.durationMs != null && (
					<span className="text-[10px] text-muted-foreground">
						{formatDurationMs(n.durationMs)}
					</span>
				)}
				{n.preview && (
					<button
						type="button"
						onClick={() => setShowOutput((v) => !v)}
						className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
					>
						{showOutput ? "hide" : "output"}
					</button>
				)}
			</div>
			{showOutput && n.preview && (
				<pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/50 p-1.5 font-mono text-[10px]">
					{n.preview}
				</pre>
			)}
		</div>
	);
}

function IterationRow({ iter }: { iter: WhileIteration }) {
	const [open, setOpen] = useState(false);
	const ChevronIcon = open ? ChevronDown : ChevronRight;
	return (
		<div className="rounded border border-border/50">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-center gap-1.5 px-2 py-1 text-left hover:bg-muted/30"
			>
				<ChevronIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
				<span className="text-muted-foreground text-xs">
					Iteration {iter.iteration + 1}
				</span>
				<span className="ml-auto text-[10px] text-muted-foreground">
					{iter.nodes.length} node{iter.nodes.length === 1 ? "" : "s"}
				</span>
			</button>
			{open && (
				<div className="flex flex-col gap-0.5 border-border/50 border-t px-1 py-1">
					{iter.nodes.map((n, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: iteration node list is stable
						<SubNodeRow key={i} n={n} />
					))}
				</div>
			)}
		</div>
	);
}

function NodeResultRow({ r }: { r: WorkflowNodeResult }) {
	const [showOutput, setShowOutput] = useState(false);
	const [showIterations, setShowIterations] = useState(false);
	const hasIterations = r.iterationResults && r.iterationResults.length > 0;
	const ChevronIcon = showIterations ? ChevronDown : ChevronRight;
	return (
		<div className="rounded px-3 py-1.5 hover:bg-muted/30">
			<div className="flex items-center gap-3">
				<RunStatusBadge status={r.STATUS} />
				<span className="flex-1 text-xs">{r.NODE_LABEL}</span>
				<span className="text-[10px] text-muted-foreground">
					{formatDurationMs(r.DURATION_MS)}
				</span>
				{r.OUTPUT_PREVIEW && !hasIterations && (
					<button
						type="button"
						onClick={() => setShowOutput((v) => !v)}
						className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
					>
						{showOutput ? "hide" : "output"}
					</button>
				)}
				{hasIterations && (
					<button
						type="button"
						onClick={() => setShowIterations((v) => !v)}
						className="flex items-center gap-0.5 text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
					>
						<ChevronIcon className="h-3 w-3" />
						{r.OUTPUT_PREVIEW}
					</button>
				)}
				{r.ERROR_MESSAGE && (
					<span
						className="max-w-[160px] truncate text-[10px] text-red-500"
						title={r.ERROR_MESSAGE}
					>
						{r.ERROR_MESSAGE}
					</span>
				)}
			</div>
			{showOutput && r.OUTPUT_PREVIEW && (
				<pre className="mt-1.5 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/50 p-2 font-mono text-[10px]">
					{r.OUTPUT_PREVIEW}
				</pre>
			)}
			{showIterations && hasIterations && (
				<div className="mt-1.5 flex flex-col gap-1">
					{r.iterationResults?.map((iter) => (
						<IterationRow key={iter.iteration} iter={iter} />
					))}
				</div>
			)}
		</div>
	);
}

// ─── run row ──────────────────────────────────────────────────────────────────

function durationStr(start: string, end: string | null) {
	if (!end) return "—";
	const ms = new Date(end).getTime() - new Date(start).getTime();
	if (ms < 0) return "—";
	const s = Math.floor(ms / 1000);
	return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function RunRow({ run, appId }: { run: WorkflowRunSummary; appId: string }) {
	const { monolithStore } = useRootStore();
	const [expanded, setExpanded] = useState(false);
	const [detail, setDetail] = useState<WorkflowRunDetail | null>(null);
	const [loadingDetail, setLoadingDetail] = useState(false);

	const loadDetail = useCallback(() => {
		if (detail) return;
		setLoadingDetail(true);
		monolithStore
			.runQuery<[WorkflowRunDetail]>(
				`GetWorkflowRun(project=["${appId}"], runId=["${run.RUN_ID}"])`,
			)
			.then((res) =>
				setDetail(res.pixelReturn[0].output as WorkflowRunDetail),
			)
			.finally(() => setLoadingDetail(false));
	}, [appId, run.RUN_ID, detail, monolithStore]);

	const toggle = () => {
		setExpanded((p) => !p);
		if (!expanded) loadDetail();
	};

	const startDate = new Date(run.STARTED_AT);

	return (
		<div className="border-b last:border-0">
			<button
				type="button"
				className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left hover:bg-muted/30"
				onClick={toggle}
			>
				{expanded ? (
					<ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
				) : (
					<ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
				)}
				<RunStatusBadge status={run.STATUS} />
				<TriggerBadge type={run.TRIGGER_TYPE} />
				<span className="flex-1 text-muted-foreground text-xs">
					{startDate.toLocaleString(undefined, {
						month: "short",
						day: "numeric",
						hour: "2-digit",
						minute: "2-digit",
					})}
				</span>
				<span className="shrink-0 text-muted-foreground text-xs">
					{durationStr(run.STARTED_AT, run.COMPLETED_AT)}
				</span>
			</button>

			{expanded && (
				<div className="border-t bg-muted/10 px-4 py-2">
					{/* run metadata */}
					<div className="mb-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-muted-foreground">
						<span>
							Run ID:{" "}
							<code className="font-mono">
								{run.RUN_ID.slice(0, 8)}…
							</code>
						</span>
						{run.TOTAL_NODES != null && (
							<span>
								{run.COMPLETED_NODES ?? 0}/{run.TOTAL_NODES}{" "}
								nodes
							</span>
						)}
						{run.COMPLETED_AT && (
							<span>
								Ended{" "}
								{new Date(
									run.COMPLETED_AT,
								).toLocaleTimeString()}
							</span>
						)}
					</div>

					{/* node results */}
					{loadingDetail ? (
						<div className="flex items-center gap-2 py-2 text-muted-foreground text-xs">
							<Loader2 className="h-3 w-3 animate-spin" />{" "}
							Loading…
						</div>
					) : detail ? (
						<div className="flex flex-col gap-0.5">
							{detail.nodeResults.map((r) => (
								<NodeResultRow key={r.NODE_ID} r={r} />
							))}
						</div>
					) : null}

					{run.ERROR_MESSAGE && (
						<div className="mt-1 flex items-start gap-1.5 rounded bg-red-50 px-2 py-1.5 text-[10px] text-red-600 dark:bg-red-950 dark:text-red-400">
							<AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
							{run.ERROR_MESSAGE}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── filter bar ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { value: WorkflowTriggerType | "ALL"; label: string }[] =
	[
		{ value: "ALL", label: "All" },
		{ value: "MANUAL", label: "Manual" },
		{ value: "SCHEDULED", label: "Scheduled" },
		{ value: "WEBHOOK", label: "Webhook" },
		{ value: "STORAGE_POLL", label: "Storage Watch" },
		{ value: "DB_POLL", label: "DB Watch" },
		{ value: "SUB_WORKFLOW", label: "Sub-Workflow" },
	];

// ─── main component ───────────────────────────────────────────────────────────

interface WorkflowRunsTabProps {
	appId: string;
	onTrigger: () => void;
	triggering: boolean;
}

export function WorkflowRunsTab({
	appId,
	onTrigger,
	triggering,
}: WorkflowRunsTabProps) {
	const { monolithStore } = useRootStore();
	const [runs, setRuns] = useState<WorkflowRunSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [filterType, setFilterType] = useState<WorkflowTriggerType | "ALL">(
		"ALL",
	);
	const [showFilter, setShowFilter] = useState(false);
	const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const load = useCallback(() => {
		monolithStore
			.runQuery<[WorkflowRunSummary[]]>(
				`ListWorkflowRuns(project=["${appId}"], limit=["50"])`,
			)
			.then((res) => {
				const out = res.pixelReturn[0].output;
				setRuns(Array.isArray(out) ? out : []);
			})
			.finally(() => setLoading(false));
	}, [appId, monolithStore]);

	useEffect(() => {
		load();
		return () => {
			if (pollingRef.current) clearTimeout(pollingRef.current);
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount
	}, []);

	useEffect(() => {
		if (pollingRef.current) clearTimeout(pollingRef.current);
		const hasRunning = runs.some((r) => r.STATUS === "RUNNING");
		if (hasRunning) pollingRef.current = setTimeout(load, 3000);
	}, [runs, load]);

	// Reload shortly after a run starts (pick up new RUNNING entry) and when it finishes
	const prevTriggeringRef = useRef(false);
	useEffect(() => {
		if (triggering && !prevTriggeringRef.current) {
			// run just kicked off — wait 500ms for the backend to write the DB entry
			const t = setTimeout(load, 500);
			prevTriggeringRef.current = true;
			return () => clearTimeout(t);
		}
		if (!triggering && prevTriggeringRef.current) {
			// run just completed
			prevTriggeringRef.current = false;
			load();
		}
	}, [triggering, load]);

	const filtered =
		filterType === "ALL"
			? runs
			: runs.filter(
					(r) =>
						(r.TRIGGER_TYPE ?? "MANUAL").toUpperCase() ===
						filterType.toUpperCase(),
				);

	return (
		<div className="flex h-full flex-col">
			{/* header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<h3 className="font-semibold text-sm">Run History</h3>
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => setShowFilter((v) => !v)}
						className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
							filterType !== "ALL"
								? "bg-primary/10 text-primary"
								: "text-muted-foreground hover:bg-muted"
						}`}
						title="Filter by trigger type"
					>
						<Filter className="h-3 w-3" />
						{filterType !== "ALL" && (
							<span>
								{TRIGGER_META[filterType]?.label ?? filterType}
							</span>
						)}
					</button>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={load}
						disabled={loading}
						title="Refresh"
					>
						<RefreshCw
							className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
						/>
					</Button>
					<Button size="sm" onClick={onTrigger} disabled={triggering}>
						{triggering ? (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						) : null}
						Run Now
					</Button>
				</div>
			</div>

			{/* filter chips */}
			{showFilter && (
				<div className="flex flex-wrap gap-1.5 border-b px-4 py-2">
					{FILTER_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => setFilterType(opt.value)}
							className={`rounded-full px-2.5 py-0.5 text-[11px] transition-colors ${
								filterType === opt.value
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:bg-accent"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			)}

			{/* list */}
			<div className="flex-1 overflow-y-auto">
				{loading && runs.length === 0 ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : filtered.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-12 text-center">
						<p className="font-medium text-muted-foreground text-sm">
							{runs.length === 0
								? "No runs yet"
								: "No runs match this filter"}
						</p>
						<p className="text-muted-foreground text-xs">
							{runs.length === 0
								? 'Click "Run Now" to trigger manually.'
								: "Try a different filter above."}
						</p>
					</div>
				) : (
					<div className="m-4 rounded-md border">
						{filtered.map((r) => (
							<RunRow key={r.RUN_ID} run={r} appId={appId} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
