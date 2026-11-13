import { Bot, PanelRightOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, cn, Muted } from "@semoss/ui/next";
import { formatRoundedDurationMs } from "@semoss/utility/date";
import type { AgentRun } from "@/features/rooms/api/agent-run-api";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import {
	runDurationMs,
	runStatusDotClass,
	runStatusWord,
	subAgentName,
} from "./run-status-word";

// A run that has not reached a terminal state is still elapsing, so its duration
// keeps ticking - including one paused waiting for the person.
const FINISHED: ReadonlySet<AgentRun["status"]> = new Set([
	"COMPLETED",
	"FAILED",
	"CANCELLED",
]);

/** A clock that ticks once a second only while the run is still going. */
function useNow(active: boolean): number {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!active) return;
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, [active]);
	return now;
}

/** A sub-agent beside its parent conversation; opens its run in the side panel. */
export function ChildAgentRunCard({ run }: { run: AgentRun }) {
	const { openRun } = useToolWorkbench();
	const name = subAgentName(run);
	const unfinished = !FINISHED.has(run.status);
	const now = useNow(unfinished);
	const durationMs = runDurationMs(run, now);
	const duration =
		durationMs == null ? null : formatRoundedDurationMs(durationMs);
	return (
		<Button
			id={`run-${run.runId}`}
			data-preserve-reading-position
			type="button"
			variant="ghost"
			className="h-auto min-h-10 w-full min-w-0 justify-start gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-start motion-reduce:transition-none"
			onClick={() => openRun(run.runId)}
			aria-label={`Open ${name} in the side panel`}
			data-scroll-anchor
		>
			<Bot
				aria-hidden="true"
				className="size-4 shrink-0 text-muted-foreground"
			/>
			<span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 whitespace-normal">
				<Muted className="wrap-anywhere font-medium text-foreground text-sm">
					{name}
				</Muted>
				<span className="flex items-center gap-1.5">
					<span
						aria-hidden="true"
						className={cn(
							"size-1.5 shrink-0 rounded-full",
							runStatusDotClass(run.status),
						)}
					/>
					<Muted
						className={cn(
							"text-xs",
							run.status === "FAILED" && "text-destructive",
							run.status === "INPUT_REQUIRED" && "text-warning",
						)}
					>
						{runStatusWord(run.status)}
						{duration ? ` · ${duration}` : ""}
					</Muted>
				</span>
			</span>
			<PanelRightOpen
				aria-hidden="true"
				className="size-4 shrink-0 text-muted-foreground"
			/>
		</Button>
	);
}
