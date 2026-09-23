import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Button, Spinner, useIsMobile } from "@semoss/ui/next";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import type { PlaygroundTurnPhase } from "@/features/messages/types/message";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import type { PendingToolApproval } from "../types/room";

function phaseLabel(agentName: string, phase: PlaygroundTurnPhase): string {
	switch (phase) {
		case "streaming":
			return `${agentName} is responding`;
		case "executing_tools":
			return `${agentName} is using tools`;
		case "cancelling":
			return "Cancelling this turn";
		case "awaiting_approval":
			return "Waiting for your approval";
		case "completed":
			return "Turn completed";
		case "failed":
			return "Turn failed";
	}
}

/** Turn errors, approvals, and the current playground phase. */
export function RoomRunStatus({
	agent,
	turnError,
	transportError,
	pendingApprovals,
	phase,
	onReconnect,
}: {
	agent: AgentConfiguration;
	turnError: string | null;
	transportError: Error | null;
	pendingApprovals: PendingToolApproval[];
	phase: PlaygroundTurnPhase | null;
	onReconnect?: () => Promise<void>;
}) {
	const isMobile = useIsMobile();
	const { tools, openInline, openWorkbench } = useToolWorkbench();

	return (
		<>
			{turnError && (
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
							{turnError}
						</span>
					</span>
				</div>
			)}
			{transportError && !turnError && (
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
							Reconnect to check the run's latest state.{" "}
							{transportError.message}
						</span>
					</span>
					{onReconnect && (
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => void onReconnect()}
						>
							Reconnect
						</Button>
					)}
				</output>
			)}
			{pendingApprovals.length > 0 && (
				<section
					className="shrink-0 space-y-3 border-t bg-warning/5 px-5 py-3"
					aria-label="Tools awaiting your approval"
				>
					{pendingApprovals.map((approval) => (
						<div
							key={approval.toolId}
							className="flex flex-wrap items-center gap-3"
						>
							<ShieldCheck
								aria-hidden="true"
								className="size-4 shrink-0 text-warning"
							/>
							<span className="min-w-0 flex-1">
								<span className="block font-medium text-xs">
									{agent.name} wants to run{" "}
									{approval.toolName}
								</span>
								<span className="block text-muted-foreground text-xs">
									Review its UI and arguments before
									continuing.
								</span>
							</span>
							<Button
								type="button"
								size="sm"
								disabled={!tools[approval.toolId]}
								onClick={() =>
									isMobile
										? openInline(approval.toolId)
										: openWorkbench(approval.toolId)
								}
							>
								Review
							</Button>
						</div>
					))}
				</section>
			)}
			{phase &&
				phase !== "completed" &&
				phase !== "failed" &&
				phase !== "awaiting_approval" && (
					<output className="flex shrink-0 items-center gap-3 border-t bg-primary/5 px-5 py-3">
						<Spinner
							aria-hidden="true"
							className="size-4 shrink-0 text-primary motion-reduce:animate-none"
						/>
						<span className="min-w-0 flex-1 font-medium text-xs">
							{phaseLabel(agent.name, phase)}
						</span>
					</output>
				)}
		</>
	);
}
