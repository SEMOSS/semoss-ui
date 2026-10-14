import { Bot, ChevronRight, PanelRightOpen } from "lucide-react";
import { Badge, Button, cn, Muted } from "@semoss/ui/next";
import type { AgentRun } from "@/features/rooms/api/agent-run-api";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { ChildAgentRunCard } from "./child-agent-run-card";

/** A run retains its own task, identity and result instead of masquerading as a tool call. */
export function AgentRunCard({
	run,
	compact = false,
}: {
	run: AgentRun;
	compact?: boolean;
}) {
	const { openRun } = useToolWorkbench();
	const name =
		run.workspaceName ||
		run.executorLabel ||
		(run.parentRunId ? "Child agent" : "Agent run");
	if (run.parentRunId) return <ChildAgentRunCard run={run} />;
	if (compact)
		return (
			<Button
				id={`run-${run.runId}`}
				data-preserve-reading-position
				type="button"
				variant="ghost"
				className="h-auto min-h-10 w-full min-w-0 justify-start gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-start"
				onClick={() => openRun(run.runId)}
				aria-label={`Inspect ${name} run`}
			>
				<Bot
					aria-hidden="true"
					className="size-4 shrink-0 text-muted-foreground"
				/>
				<span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 whitespace-normal">
					<Muted className="wrap-anywhere font-medium text-foreground text-sm">
						{name}
					</Muted>
					<Muted
						className={cn(
							"text-xs",
							run.status === "FAILED" && "text-destructive",
							run.status === "INPUT_REQUIRED" && "text-warning",
						)}
					>
						{run.status.toLowerCase().replaceAll("_", " ")}
					</Muted>
				</span>
				<PanelRightOpen
					aria-hidden="true"
					className="size-4 shrink-0 text-muted-foreground"
				/>
			</Button>
		);
	return (
		<div className="space-y-2 rounded-lg border bg-sidebar p-3">
			<div className="flex flex-wrap items-center gap-2">
				<Bot aria-hidden="true" className="size-4" />
				<span className="min-w-0 flex-1 truncate font-medium text-sm">
					{name}
				</span>
				<Badge
					variant={
						run.status === "FAILED" ? "destructive" : "outline"
					}
				>
					{run.status.toLowerCase().replaceAll("_", " ")}
				</Badge>
			</div>
			{run.input && (
				<Muted className="line-clamp-2 whitespace-pre-wrap text-xs">
					{run.input}
				</Muted>
			)}
			{run.errorMessage ? (
				<Muted className="line-clamp-2 text-destructive text-xs">
					{run.errorMessage}
				</Muted>
			) : (
				run.finalText && (
					<Muted className="line-clamp-2 whitespace-pre-wrap text-xs">
						{run.finalText}
					</Muted>
				)
			)}
			<Button
				id={`run-${run.runId}`}
				type="button"
				size="sm"
				variant="ghost"
				onClick={() => openRun(run.runId)}
			>
				Inspect run
				<ChevronRight aria-hidden="true" />
			</Button>
		</div>
	);
}
