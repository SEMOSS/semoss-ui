import { AlertTriangleIcon } from "lucide-react";
import type { AgentRunProgress } from "@semoss/sdk";
import { Muted, Small } from "@semoss/ui/next";

const PHASE_LABELS: Record<string, string> = {
	starting: "Starting",
	loading_instructions: "Loading instructions",
	editing: "Editing files",
	executing_code: "Generating or checking the artifact",
	visual_review: "Inspecting slides",
	waiting_for_subagent: "Waiting for delegated agent",
	delegating: "Delegating work",
	using_tools: "Using tools",
	finishing: "Finishing",
	completed: "Completed",
	failed: "Failed",
	cancelled: "Cancelled",
	input_required: "Waiting for input",
};

/** Format measured durations without hiding short tool executions. */
const duration = (milliseconds: number): string => {
	const seconds = Math.max(0, milliseconds) / 1000;
	return seconds < 60
		? `${seconds.toFixed(1)} s`
		: `${Math.floor(seconds / 60)} min ${Math.floor(seconds % 60)} s`;
};

/** Show measured run activity and retain actionable failures after execution ends. */
export const ResponseMessageProgress = ({
	progress,
	error,
}: {
	progress: AgentRunProgress | null;
	error: string | null;
}) => {
	if (!progress && !error) return null;
	return (
		<div className="flex min-w-0 flex-col gap-2 border-border border-s-2 ps-3">
			{progress && (
				<>
					<output className="block break-words">
						<Muted className="text-foreground">
							{PHASE_LABELS[progress.phase] || progress.phase}
							{progress.activity === "model" &&
								" · Waiting for model"}
							{progress.activity === "tool" &&
								progress.currentTool &&
								` · ${progress.currentTool}`}
							{` · ${progress.turnsRemaining} of ${progress.maxTurns} tool rounds remaining`}
						</Muted>
					</output>
					<div className="flex flex-wrap gap-x-4 gap-y-1">
						<Muted>
							Model: {duration(progress.modelTimeMs)} (
							{progress.modelCalls}{" "}
							{progress.modelCalls === 1 ? "call" : "calls"})
						</Muted>
						<Muted>
							Tools: {duration(progress.toolWallTimeMs)} (
							{progress.toolCalls}{" "}
							{progress.toolCalls === 1 ? "call" : "calls"})
						</Muted>
						<Muted>
							Active time: {duration(progress.elapsedMs)}
						</Muted>
						<Muted>Tool failures: {progress.toolFailures}</Muted>
					</div>
					{progress.repeatedFailures.map((failure) => (
						<div
							key={`${failure.tool}:${failure.target}`}
							className="flex min-w-0 items-start gap-2"
						>
							<AlertTriangleIcon
								aria-hidden="true"
								className="mt-1 size-4 shrink-0 text-warning"
							/>
							<Small className="min-w-0 break-words leading-normal">
								{failure.tool} failed {failure.count} times
								{failure.target && ` on ${failure.target}`}:{" "}
								{failure.error}
							</Small>
						</div>
					))}
					<Muted>
						Timing is for this agent. Delegated agents have separate
						runs.
					</Muted>
				</>
			)}
			{error && (
				<Small
					role="alert"
					className="break-words text-destructive leading-normal"
				>
					{error}
				</Small>
			)}
		</div>
	);
};
