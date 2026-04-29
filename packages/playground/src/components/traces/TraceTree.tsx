import { CheckCircle2, ChevronDown, ChevronRight, XCircle } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import { Badge, Button, Spinner } from "@semoss/ui/next";
import { TraceStepList } from "./TraceStepList";
import type { AgentTrace, AgentTraceStep } from "./types";

interface TraceNodeProps {
	trace: AgentTrace;
	insightId: string;
	/** All traces for the current room (used to find children) */
	allTraces: AgentTrace[];
	depth?: number;
}

function calcDurationMs(start: string, end: string): string {
	const diff = new Date(end).getTime() - new Date(start).getTime();
	return Number.isNaN(diff) ? "—" : `${diff}ms`;
}

function formatTime(iso: string): string {
	try {
		return new Date(iso).toLocaleTimeString();
	} catch {
		return iso;
	}
}

const TraceNode: React.FC<TraceNodeProps> = ({
	trace,
	insightId,
	allTraces,
	depth = 0,
}) => {
	const [open, setOpen] = useState(false);
	const [stepsOpen, setStepsOpen] = useState(false);
	const [steps, setSteps] = useState<AgentTraceStep[]>([]);
	const [loadingSteps, setLoadingSteps] = useState(false);

	const isSuccess = trace.TERMINATION_REASON === "SUCCESS";
	const childTraces = allTraces.filter(
		(t) => t.PARENT_TRACE_ID === trace.TRACE_ID,
	);

	const loadSteps = useCallback(async () => {
		if (steps.length > 0) {
			setStepsOpen((v) => !v);
			return;
		}
		setLoadingSteps(true);
		try {
			const res = await runPixel<[AgentTraceStep[]]>(
				`ListAgentTraceSteps(traceId=["${trace.TRACE_ID}"]);`,
				insightId,
			);
			const output = res.pixelReturn[0]?.output;
			if (Array.isArray(output)) {
				setSteps(output);
			}
		} catch {
			// silent — steps panel stays empty
		} finally {
			setLoadingSteps(false);
			setStepsOpen(true);
		}
	}, [trace.TRACE_ID, insightId, steps.length]);

	return (
		<div
			className="rounded border border-border bg-card"
			style={{ marginLeft: depth * 16 }}
		>
			{/* Trace header row */}
			<button
				type="button"
				className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50"
				onClick={() => setOpen((v) => !v)}
			>
				<span className="shrink-0 text-muted-foreground">
					{open ? (
						<ChevronDown className="size-3.5" />
					) : (
						<ChevronRight className="size-3.5" />
					)}
				</span>
				{isSuccess ? (
					<CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
				) : (
					<XCircle className="size-3.5 shrink-0 text-red-500" />
				)}
				<span className="max-w-[120px] truncate font-medium text-xs">
					{trace.HARNESS_TYPE}
				</span>
				<span className="shrink-0 text-muted-foreground text-xs">
					{formatTime(trace.START_TIME)} →{" "}
					{formatTime(trace.END_TIME)}
				</span>
				<Badge variant="outline" className="shrink-0 text-xs">
					{trace.ITERATIONS} iter
				</Badge>
				<Badge variant="outline" className="shrink-0 text-xs">
					{trace.TOOL_CALL_COUNT} tools
				</Badge>
				<span className="ml-auto shrink-0 font-mono text-muted-foreground text-xs">
					{calcDurationMs(trace.START_TIME, trace.END_TIME)}
				</span>
			</button>

			{open && (
				<div className="space-y-2 border-border border-t px-3 py-2">
					{/* Trace metadata */}
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
						<span>
							<span className="font-medium">ID:</span>{" "}
							<span className="font-mono">{trace.TRACE_ID}</span>
						</span>
						{trace.PROJECT_ID && (
							<span>
								<span className="font-medium">Project:</span>{" "}
								{trace.PROJECT_ID}
							</span>
						)}
						<span>
							<span className="font-medium">Model:</span>{" "}
							{trace.MODEL_ENGINE_ID}
						</span>
						<span>
							<span className="font-medium">Status:</span>{" "}
							<span
								className={
									isSuccess
										? "text-emerald-600"
										: "text-red-600"
								}
							>
								{trace.TERMINATION_REASON}
							</span>
						</span>
					</div>

					{/* Steps toggle */}
					<Button
						variant="outline"
						size="sm"
						className="h-6 text-xs"
						onClick={(e) => {
							e.stopPropagation();
							loadSteps();
						}}
						disabled={loadingSteps}
					>
						{loadingSteps ? (
							<Spinner className="mr-1 size-3" />
						) : null}
						{stepsOpen ? "Hide" : "Show"} Steps (
						{trace.TOOL_CALL_COUNT})
					</Button>

					{stepsOpen && <TraceStepList steps={steps} />}

					{/* Child traces */}
					{childTraces.length > 0 && (
						<div className="space-y-1">
							<p className="font-medium text-muted-foreground text-xs">
								Child Traces ({childTraces.length})
							</p>
							{childTraces.map((child) => (
								<TraceNode
									key={child.TRACE_ID}
									trace={child}
									insightId={insightId}
									allTraces={allTraces}
									depth={depth + 1}
								/>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

interface TraceTreeProps {
	traces: AgentTrace[];
	insightId: string;
}

/**
 * Renders a tree of traces — root traces at top level, children nested inside.
 */
export const TraceTree: React.FC<TraceTreeProps> = ({ traces, insightId }) => {
	const rootTraces = traces.filter((t) => t.PARENT_TRACE_ID === null);

	if (!rootTraces.length) {
		return (
			<p className="py-2 text-muted-foreground text-sm">
				No root traces found.
			</p>
		);
	}

	return (
		<div className="space-y-1">
			{rootTraces.map((trace) => (
				<TraceNode
					key={trace.TRACE_ID}
					trace={trace}
					insightId={insightId}
					allTraces={traces}
				/>
			))}
		</div>
	);
};
