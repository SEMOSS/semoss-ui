import { Bot, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Muted,
} from "@semoss/ui/next";
import type { AgentRun } from "@/features/rooms/api/agent-run-api";
import { RunDetails } from "./run-details";

/** Inspect a child beside its parent conversation without opening a side panel. */
export function ChildAgentRunCard({ run }: { run: AgentRun }) {
	const [isOpen, setIsOpen] = useState(false);
	const name = run.workspaceName || run.executorLabel || "Child agent";
	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="min-w-0 rounded-xl border border-border/60 bg-muted/20"
			data-scroll-anchor
		>
			<CollapsibleTrigger asChild>
				<Button
					id={`run-${run.runId}`}
					data-preserve-reading-position
					type="button"
					variant="ghost"
					className="h-auto min-h-10 w-full min-w-0 justify-start gap-2 rounded-xl px-3 py-2 text-start motion-reduce:transition-none"
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
								run.status === "INPUT_REQUIRED" &&
									"text-warning",
							)}
						>
							{run.status.toLowerCase().replaceAll("_", " ")}
						</Muted>
					</span>
					<ChevronDown
						aria-hidden="true"
						className={cn(
							"size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none",
							isOpen && "rotate-180",
						)}
					/>
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="overflow-hidden duration-200 ease-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
				<RunDetails runId={run.runId} isActive={isOpen} isInline />
			</CollapsibleContent>
		</Collapsible>
	);
}
