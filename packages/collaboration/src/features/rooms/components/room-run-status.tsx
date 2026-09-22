import { ShieldCheck, TriangleAlert } from "lucide-react";
import type { PendingAgentAction } from "@semoss/sdk";
import { Button, Spinner, useIsMobile } from "@semoss/ui/next";
import type { Agent } from "@/features/agents/types/agent";
import { pendingActionToolId } from "@/features/messages/utils/thread-items";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";

/** Run/transport error banners, pending tool approvals, and the "is working" banner. */
export function RoomRunStatus({
	agent,
	runError,
	transportError,
	pendingActions,
	isRunning,
}: {
	agent: Agent;
	runError: string | null;
	transportError: Error | null;
	pendingActions: PendingAgentAction[];
	isRunning: boolean;
}) {
	const isMobile = useIsMobile();
	const { tools, openInline, openWorkbench } = useToolWorkbench();

	return (
		<>
			{runError && (
				<div
					className="flex shrink-0 items-start gap-3 border-t bg-destructive/5 px-5 py-3"
					role="alert"
				>
					<TriangleAlert
						aria-hidden="true"
						className="mt-0.5 size-4 shrink-0 text-destructive"
					/>
					<span className="min-w-0 flex-1">
						<span className="block font-medium text-xs">
							{agent.name} could not finish this turn
						</span>
						<span className="block text-muted-foreground text-xs">
							{runError}
						</span>
					</span>
				</div>
			)}
			{transportError && (
				<output className="flex shrink-0 items-start gap-3 border-t bg-warning/5 px-5 py-3">
					<TriangleAlert
						aria-hidden="true"
						className="mt-0.5 size-4 shrink-0 text-warning"
					/>
					<span className="min-w-0 flex-1">
						<span className="block font-medium text-xs">
							Trouble reaching the server
						</span>
						<span className="block text-muted-foreground text-xs">
							Any run keeps going on the server; this view will
							catch up. {transportError.message}
						</span>
					</span>
				</output>
			)}
			{pendingActions.length > 0 && (
				<section
					className="shrink-0 space-y-3 border-t bg-warning/5 px-5 py-3"
					aria-label="Actions awaiting your approval"
				>
					{pendingActions.map((action) => {
						const toolId = pendingActionToolId(action);
						return (
							<div
								key={action.actionId}
								className="flex flex-wrap items-center gap-3"
							>
								<ShieldCheck
									aria-hidden="true"
									className="size-4 shrink-0 text-warning"
								/>
								<span className="min-w-0 flex-1">
									<span className="block font-medium text-xs">
										{agent.name} wants to run{" "}
										{action.toolName ?? "a tool"}
									</span>
									<span className="block text-muted-foreground text-xs">
										Review its UI and arguments before
										continuing.
									</span>
								</span>
								<Button
									type="button"
									size="sm"
									disabled={!tools[toolId]}
									onClick={() =>
										isMobile
											? openInline(toolId)
											: openWorkbench(toolId)
									}
								>
									Review
								</Button>
							</div>
						);
					})}
				</section>
			)}
			{isRunning && pendingActions.length === 0 && (
				<div className="flex shrink-0 items-center gap-3 border-t bg-primary/5 px-5 py-3">
					<Spinner
						aria-hidden="true"
						className="size-4 shrink-0 text-primary motion-reduce:animate-none"
					/>
					<span className="min-w-0 flex-1">
						<span className="block font-medium text-xs">
							{agent.name} is working
						</span>
					</span>
				</div>
			)}
		</>
	);
}
