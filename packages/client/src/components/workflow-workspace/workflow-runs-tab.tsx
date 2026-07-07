import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Loader2,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import type {
	WorkflowNodeResult,
	WorkflowRunDetail,
	WorkflowRunSummary,
} from "@/pages/workflow/workflow.types";

function RunStatusBadge({ status }: { status: string }) {
	if (status === "SUCCESS")
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
				<CheckCircle2 className="h-2.5 w-2.5" /> Success
			</span>
		);
	if (status === "PARTIAL")
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 font-medium text-[10px] text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
				<AlertCircle className="h-2.5 w-2.5" /> Partial
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
	return (
		<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
			{status}
		</span>
	);
}

function durationStr(start: string, end: string | null) {
	if (!end) return "—";
	const ms = new Date(end).getTime() - new Date(start).getTime();
	if (ms < 0) return "—";
	const s = Math.floor(ms / 1000);
	return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function NodeResultRow({ r }: { r: WorkflowNodeResult }) {
	return (
		<div className="flex items-center gap-3 rounded px-3 py-1.5 hover:bg-muted/30">
			<RunStatusBadge status={r.STATUS} />
			<span className="flex-1 text-xs">{r.NODE_LABEL}</span>
			<span className="text-[10px] text-muted-foreground">
				{durationStr(r.STARTED_AT, r.COMPLETED_AT)}
			</span>
			{r.ERROR && (
				<span
					className="max-w-[200px] truncate text-[10px] text-red-500"
					title={r.ERROR}
				>
					{r.ERROR}
				</span>
			)}
		</div>
	);
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
				`GetWorkflowRun(app="${appId}", runId="${run.RUN_ID}")`,
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

	return (
		<div className="border-b last:border-0">
			<button
				type="button"
				className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/30"
				onClick={toggle}
			>
				{expanded ? (
					<ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
				) : (
					<ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
				)}
				<RunStatusBadge status={run.STATUS} />
				<span className="flex-1 text-muted-foreground text-xs">
					{new Date(run.STARTED_AT).toLocaleString(undefined, {
						month: "short",
						day: "numeric",
						hour: "2-digit",
						minute: "2-digit",
					})}
				</span>
				<span className="text-muted-foreground text-xs">
					{durationStr(run.STARTED_AT, run.COMPLETED_AT)}
				</span>
			</button>

			{expanded && (
				<div className="border-t bg-muted/10 px-4 py-2">
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
						<p className="mt-1 text-red-500 text-xs">
							{run.ERROR_MESSAGE}
						</p>
					)}
				</div>
			)}
		</div>
	);
}

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
	const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const load = useCallback(() => {
		monolithStore
			.runQuery<[WorkflowRunSummary[]]>(
				`ListWorkflowRuns(app="${appId}", limit=["25"])`,
			)
			.then((res) => {
				const out = res.pixelReturn[0].output;
				setRuns(Array.isArray(out) ? out : []);
			})
			.finally(() => setLoading(false));
	}, [appId, monolithStore]);

	// poll while any run is RUNNING
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
		if (hasRunning) {
			pollingRef.current = setTimeout(load, 3000);
		}
	}, [runs, load]);

	return (
		<div className="flex h-full flex-col">
			{/* header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<h3 className="font-semibold text-sm">Run History</h3>
				<div className="flex items-center gap-2">
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

			{/* list */}
			<div className="flex-1 overflow-y-auto">
				{loading && runs.length === 0 ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : runs.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-12 text-center">
						<p className="font-medium text-muted-foreground text-sm">
							No runs yet
						</p>
						<p className="text-muted-foreground text-xs">
							Click "Run Now" to trigger manually.
						</p>
					</div>
				) : (
					<div className="rounded-md border">
						{runs.map((r) => (
							<RunRow key={r.RUN_ID} run={r} appId={appId} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
