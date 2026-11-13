import { Check, ChevronRight, CircleAlert, CircleX, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, cn, Muted } from "@semoss/ui/next";
import type { AgentRun } from "@/features/rooms/api/agent-run-api";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";

/** Opens the run in the side panel; called from both the main chat and nested inspectors. */
export function ChildAgentRunCard({ run }: { run: AgentRun }) {
	const { openRun } = useToolWorkbench();
	const name =
		run.label || run.workspaceName || run.executorLabel || "Child agent";
	const title = run.label || run.input || name;
	const isFailed = run.status === "FAILED" || run.status === "CANCELLED";
	const isWaiting = run.status === "INPUT_REQUIRED";
	const isDone = run.status === "COMPLETED";
	const isRunning = !isDone && !isFailed && !isWaiting;
	const duration = useRunDuration(run);

	return (
		<Button
			id={`run-${run.runId}`}
			data-preserve-reading-position
			type="button"
			variant="ghost"
			className="h-auto min-h-10 w-full min-w-0 justify-start gap-3 rounded-none border-border/60 border-b px-3 py-2.5 text-start last:border-b-0"
			onClick={() => openRun(run.runId)}
			aria-label={`Inspect ${name} run`}
		>
			<div
				aria-hidden="true"
				className={cn(
					"flex size-5 shrink-0 items-center justify-center rounded-full",
					isDone && "bg-success/10 text-success",
					isRunning && "bg-primary/10 text-primary",
					isWaiting && "bg-warning/10 text-warning",
					isFailed && "bg-destructive/10 text-destructive",
				)}
			>
				{isDone && <Check className="size-3" />}
				{isRunning && <Clock className="size-3" />}
				{isWaiting && <CircleAlert className="size-3" />}
				{isFailed && <CircleX className="size-3" />}
			</div>
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="wrap-anywhere line-clamp-1 font-medium text-foreground text-sm">
					{title}
				</span>
				<Muted
					className={cn(
						"text-xs",
						isFailed && "text-destructive",
						isWaiting && "text-warning",
					)}
				>
					{subtitle(run)}
				</Muted>
			</span>
			{duration && (
				<span className="shrink-0 font-mono text-muted-foreground text-xs tabular-nums">
					{duration}
				</span>
			)}
			<Badge
				variant={isFailed ? "destructive" : "outline"}
				className={cn(
					"shrink-0",
					isWaiting && "border-warning/50 text-warning",
					isDone && "border-success/50 text-success",
				)}
			>
				{statusLabel(run.status)}
			</Badge>
			<ChevronRight
				aria-hidden="true"
				className="size-4 shrink-0 text-muted-foreground"
			/>
		</Button>
	);
}

function statusLabel(status: AgentRun["status"]): string {
	switch (status) {
		case "COMPLETED":
			return "Done";
		case "INPUT_REQUIRED":
			return "Waiting for you";
		case "FAILED":
			return "Failed";
		case "CANCELLED":
			return "Cancelled";
		default:
			return "Running";
	}
}

function subtitle(run: AgentRun): string {
	if (run.status === "FAILED") return run.errorMessage || "Failed";
	if (run.status === "CANCELLED") return "Cancelled";
	if (run.status === "INPUT_REQUIRED") return "Waiting for your approval";
	if (run.status === "COMPLETED") {
		const text = run.finalText?.trim();
		return text ? text.slice(0, 80) : "Completed";
	}
	return (
		run.progress?.activity ||
		run.workspaceName ||
		run.executorLabel ||
		"Working…"
	);
}

/** Tracks elapsed time for a run; updates every second while running. */
function useRunDuration(run: AgentRun): string {
	const start = run.startedAt ?? run.dateCreated;
	const end = run.completedAt;
	const isLive = !run.completedAt && !!start;

	const compute = useCallback((): string => {
		if (!start) return "";
		const ms =
			(end ? new Date(end).getTime() : Date.now()) -
			new Date(start).getTime();
		if (ms < 0) return "";
		const totalSec = Math.floor(ms / 1000);
		const m = Math.floor(totalSec / 60);
		const s = totalSec % 60;
		return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
	}, [start, end]);

	const [dur, setDur] = useState(compute);

	useEffect(() => {
		if (!isLive) {
			setDur(compute());
			return;
		}
		const id = setInterval(() => setDur(compute()), 1000);
		return () => clearInterval(id);
	}, [isLive, compute]);

	return dur;
}
