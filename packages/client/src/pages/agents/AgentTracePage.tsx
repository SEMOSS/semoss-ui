import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Spinner } from "@semoss/ui/next";
import { MetricsPanel, SpanTree } from "@/components/agent-traces";
import type { AgentTraceStep, TraceRow } from "@/components/agent-traces/types";
import { useRootStore } from "@/hooks";

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

function computeStepDuration(step: AgentTraceStep): number {
	// Prefer server-computed DURATION_MS
	if (step.DURATION_MS != null && step.DURATION_MS > 0) {
		return step.DURATION_MS;
	}
	try {
		const s = new Date(step.START_TIME.replace(" ", "T")).getTime();
		const e = new Date(step.END_TIME.replace(" ", "T")).getTime();
		const diff = e - s;
		// If diff is 0, it's sub-second (timestamp precision limitation) — show as 500ms estimate
		if (diff === 0) return 500;
		return Number.isNaN(diff) || diff < 0 ? 0 : diff;
	} catch {
		return 0;
	}
}

/** Compute ms offset of a step's start relative to the trace start */
function computeStepOffset(traceStart: string, stepStart: string): number {
	try {
		const t0 = new Date(traceStart.replace(" ", "T")).getTime();
		const t1 = new Date(stepStart.replace(" ", "T")).getTime();
		const diff = t1 - t0;
		return Number.isNaN(diff) || diff < 0 ? 0 : diff;
	} catch {
		return 0;
	}
}

export const AgentTracePage = () => {
	const { traceId } = useParams<{ traceId: string }>();
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();

	const [trace, setTrace] = useState<TraceRow | null>(null);
	const [steps, setSteps] = useState<AgentTraceStep[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		if (!traceId) return;
		setLoading(true);
		setError(null);
		try {
			const [traceRes, stepsRes] = await Promise.all([
				monolithStore.runQuery(
					`GetAgentTrace(traceId=["${traceId}"]);`,
				),
				monolithStore.runQuery(
					`ListAgentTraceSteps(traceId=["${traceId}"]);`,
				),
			]);

			const traceOut = traceRes?.pixelReturn?.[0]?.output;
			if (
				traceOut &&
				typeof traceOut === "object" &&
				!Array.isArray(traceOut)
			) {
				setTrace(traceOut as TraceRow);
			} else if (typeof traceOut === "string") {
				setError(traceOut);
			}

			const stepsOut = stepsRes?.pixelReturn?.[0]?.output;
			if (Array.isArray(stepsOut)) {
				setSteps(stepsOut as AgentTraceStep[]);
			}
		} catch (e) {
			setError((e as Error).message ?? "Failed to load trace");
		} finally {
			setLoading(false);
		}
	}, [traceId, monolithStore]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	if (error || !trace) {
		return (
			<div className="flex flex-col gap-4 p-6">
				<Button
					variant="ghost"
					size="sm"
					className="self-start"
					onClick={() => navigate("/agents")}
				>
					<ArrowLeft className="mr-2 size-4" />
					Back to Traces
				</Button>
				<p className="text-red-600">{error ?? "Trace not found"}</p>
			</div>
		);
	}

	const isSuccess = trace.STATUS === "OK";
	const totalDurationMs = trace.DURATION_MS ?? 0;

	return (
		<div className="flex flex-col gap-4 p-6">
			{/* Back + title */}
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => navigate("/agents")}
				>
					<ArrowLeft className="mr-2 size-4" />
					Back
				</Button>
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="font-bold text-lg">Trace</h1>
					<span className="font-mono text-muted-foreground text-sm">
						{traceId?.slice(0, 12)}...
					</span>
					<span
						className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-xs ${getHarnessColor(trace.HARNESS_NAME)}`}
					>
						{trace.HARNESS_NAME}
					</span>
					<span
						className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold text-xs ${
							isSuccess
								? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
								: trace.STATUS === "RUNNING"
									? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
									: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
						}`}
					>
						{trace.STATUS}
					</span>
				</div>
			</div>

			{/* Metrics */}
			<MetricsPanel trace={trace} />

			{/* Waterfall Timeline */}
			{steps.length > 0 && totalDurationMs > 0 && (
				<div className="rounded border border-border bg-card p-4">
					<h2 className="mb-3 font-semibold text-sm">
						Timeline ({(totalDurationMs / 1000).toFixed(1)}s total)
					</h2>
					{/* Time axis labels */}
					<div className="mr-16 mb-1 ml-28 flex justify-between text-[10px] text-muted-foreground">
						<span>0s</span>
						<span>{(totalDurationMs / 4000).toFixed(1)}s</span>
						<span>{(totalDurationMs / 2000).toFixed(1)}s</span>
						<span>
							{((totalDurationMs * 3) / 4000).toFixed(1)}s
						</span>
						<span>{(totalDurationMs / 1000).toFixed(1)}s</span>
					</div>
					<div className="relative space-y-1">
						{steps.map((step) => {
							const stepMs = computeStepDuration(step);
							const offsetMs = computeStepOffset(
								trace.STARTED_AT,
								step.START_TIME,
							);
							const offsetPct =
								totalDurationMs > 0
									? (offsetMs / totalDurationMs) * 100
									: 0;
							const widthPct =
								totalDurationMs > 0
									? Math.max(
											(stepMs / totalDurationMs) * 100,
											1.5,
										)
									: 1.5;
							const isOk = step.STATUS === "success";
							return (
								<div
									key={step.STEP_ID}
									className="flex items-center gap-2"
								>
									<span className="w-24 truncate text-right font-mono text-[11px] text-muted-foreground">
										{step.TOOL_NAME}
									</span>
									<div className="relative h-5 flex-1 rounded-sm bg-muted/30">
										{/* Gridlines */}
										<div className="pointer-events-none absolute inset-0 flex justify-between">
											{[0, 1, 2, 3, 4].map((i) => (
												<div
													key={i}
													className="h-full w-px bg-border/50"
												/>
											))}
										</div>
										{/* Waterfall bar */}
										<div
											className={`absolute top-0.5 bottom-0.5 rounded-sm ${isOk ? "bg-emerald-400/80 dark:bg-emerald-600/60" : "bg-red-400/80 dark:bg-red-600/60"}`}
											style={{
												left: `${Math.min(offsetPct, 98)}%`,
												width: `${Math.min(widthPct, 100 - offsetPct)}%`,
											}}
										/>
									</div>
									<span className="w-14 text-right font-mono text-[11px] text-muted-foreground">
										{stepMs > 0
											? stepMs < 1000
												? `${stepMs}ms`
												: `${(stepMs / 1000).toFixed(1)}s`
											: "< 1s"}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Trace metadata */}
			<div className="grid grid-cols-2 gap-3 rounded border border-border bg-card p-4 text-sm md:grid-cols-4">
				<div>
					<p className="text-muted-foreground text-xs">Room ID</p>
					<p className="truncate font-mono text-xs">
						{trace.ROOM_ID ?? "—"}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">User</p>
					<p className="text-xs">{trace.USER_ID}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">Project</p>
					<p className="truncate font-mono text-xs">
						{trace.PROJECT_ID ?? "—"}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">Started</p>
					<p className="text-xs">{trace.STARTED_AT}</p>
				</div>
				{trace.PARENT_TRACE_ID && (
					<div className="col-span-2">
						<p className="text-muted-foreground text-xs">
							Parent Trace
						</p>
						<p className="truncate font-mono text-xs">
							{trace.PARENT_TRACE_ID}
						</p>
					</div>
				)}
				{trace.ERROR_MESSAGE && (
					<div className="col-span-full">
						<p className="font-medium text-red-600 text-xs">
							Error
						</p>
						<pre className="mt-1 max-h-24 overflow-auto rounded bg-red-50 p-2 font-mono text-[11px] text-red-700 dark:bg-red-950/30 dark:text-red-400">
							{trace.ERROR_MESSAGE}
						</pre>
					</div>
				)}
			</div>

			{/* Tool Steps / Span Tree */}
			<div className="rounded border border-border bg-card p-4">
				<h2 className="mb-3 font-semibold text-sm">
					Tool Steps ({steps.length})
				</h2>
				<SpanTree steps={steps} />
			</div>
		</div>
	);
};
