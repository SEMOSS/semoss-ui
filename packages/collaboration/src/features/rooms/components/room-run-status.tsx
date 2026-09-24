import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Alert, Button, P, useIsMobile } from "@semoss/ui/next";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import type { PendingToolApproval } from "../types/room";

/** Actionable errors and approvals beside the composer. */
export function RoomRunStatus({
	agent,
	turnError,
	transportError,
	pendingApprovals,
	onReconnect,
}: {
	agent: AgentConfiguration;
	turnError: string | null;
	transportError: Error | null;
	pendingApprovals: PendingToolApproval[];
	onReconnect?: () => Promise<void>;
}) {
	const isMobile = useIsMobile();
	const { tools, openInline, openWorkbench } = useToolWorkbench();

	return (
		<>
			{turnError && (
				<Alert
					variant="destructive"
					className="flex shrink-0 items-start gap-3 rounded-none border-0 border-t bg-destructive/5 px-5 py-3"
				>
					<TriangleAlert
						aria-hidden="true"
						className="mt-0.5 size-4 shrink-0 text-destructive"
					/>
					<div className="min-w-0 flex-1">
						<P className="font-medium text-base text-foreground">
							{agent.name} could not finish this turn
						</P>
						<P className="text-base text-muted-foreground">
							{turnError}
						</P>
					</div>
				</Alert>
			)}
			{transportError && !turnError && (
				<output className="flex shrink-0 items-start gap-3 border-t bg-warning/5 px-5 py-3">
					<TriangleAlert
						aria-hidden="true"
						className="mt-0.5 size-4 shrink-0 text-warning"
					/>
					<div className="min-w-0 flex-1">
						<P className="font-medium text-base">
							Trouble reaching the server
						</P>
						<P className="text-base text-muted-foreground">
							Reconnect to check the run's latest state.{" "}
							{transportError.message}
						</P>
					</div>
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
					className="max-h-64 shrink-0 space-y-3 overflow-y-auto border-t bg-warning/5 px-5 py-3"
					aria-label="Tools awaiting your approval"
				>
					<P className="font-medium text-sm">
						{pendingApprovals.length} pending{" "}
						{pendingApprovals.length === 1
							? "decision"
							: "decisions"}
					</P>
					{pendingApprovals.map((approval) => (
						<div
							key={approval.actionId ?? approval.toolId}
							className="flex flex-wrap items-center gap-3"
						>
							<ShieldCheck
								aria-hidden="true"
								className="size-4 shrink-0 text-warning"
							/>
							<div className="min-w-0 flex-1">
								<P className="font-medium text-base">
									{approval.ownerName ?? agent.name}
									{approval.requiresResponse
										? " needs your input"
										: ` wants to run ${tools[approval.toolId]?.title ?? approval.toolName}`}
								</P>
								<P className="text-base text-muted-foreground">
									{approval.task ||
										(approval.requiresResponse
											? "Answer the questions to continue."
											: "Review its UI and arguments before continuing.")}
								</P>
							</div>
							<Button
								type="button"
								size="sm"
								disabled={
									!tools[approval.toolId] ||
									approval.isDeciding
								}
								onClick={() =>
									isMobile
										? openInline(approval.toolId)
										: openWorkbench(approval.toolId)
								}
							>
								{approval.isDeciding
									? "Saving…"
									: approval.requiresResponse
										? "Answer"
										: "Review"}
							</Button>
						</div>
					))}
				</section>
			)}
		</>
	);
}
