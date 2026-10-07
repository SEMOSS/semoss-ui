import { Bot, UserRound } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@semoss/ui/next";
import { roomPath } from "@/lib/workspace-paths";
import { useDashboard } from "./dashboard.context";
import { DashboardResourceStatus } from "./dashboard-resource-status";
import { useAgentAttention } from "./use-agent-attention";

/** Open the original room/action so the existing approval UI owns all decisions. */
export function DashboardAgents({ visible }: { visible: boolean }) {
	const { refreshRevision } = useDashboard();
	const attention = useAgentAttention(visible, refreshRevision);
	const delegations = attention.delegations.data ?? [];
	return (
		<div className="space-y-3">
			<DashboardResourceStatus
				error={
					attention.delegations.error ||
					attention.scan.errors.join(" ")
				}
				onRetry={attention.refresh}
			/>
			{delegations.map((delegation) => (
				<article
					key={delegation.actionId}
					className="dashboard-row space-y-2 border-b py-3"
				>
					<p className="flex items-center gap-2 text-muted-foreground text-xs">
						<UserRound aria-hidden="true" className="size-4" />
						{delegation.requesterName || "A teammate"} needs your
						input
					</p>
					<h3 className="font-medium text-sm">
						{delegation.question || "Review a pending delegation"}
					</h3>
					{delegation.context && (
						<p className="line-clamp-3 text-muted-foreground text-xs">
							{delegation.context}
						</p>
					)}
					{delegation.roomId ? (
						<Button size="sm" variant="secondary" asChild>
							<Link to={roomPath(delegation.roomId)}>
								Respond
							</Link>
						</Button>
					) : (
						<p className="text-muted-foreground text-xs">
							The response room is unavailable. Ask the requester
							to reopen this delegation.
						</p>
					)}
				</article>
			))}
			{attention.runs.map((run) => (
				<article
					key={run.runId}
					className="dashboard-row space-y-2 border-b py-3"
				>
					<p className="flex items-center gap-2 text-muted-foreground text-xs">
						<Bot aria-hidden="true" className="size-4" />
						{run.workspaceName || run.executorLabel || "Assistant"}
					</p>
					<h3 className="line-clamp-3 font-medium text-sm">
						{run.input ||
							run.progress?.activity ||
							"Your input is needed"}
					</h3>
					{run.pendingActions.length
						? run.pendingActions.map((action) => (
								<div
									key={action.actionId}
									className="space-y-2"
								>
									<p className="text-muted-foreground text-xs">
										{action.toolName || "Pending decision"}
									</p>
									{run.roomId ? (
										<Button
											size="sm"
											variant="secondary"
											asChild
										>
											<Link
												to={roomPath(
													run.roomId,
													action.toolCallId,
												)}
											>
												Review action
											</Link>
										</Button>
									) : (
										<p className="text-muted-foreground text-xs">
											This action’s conversation is
											unavailable.
										</p>
									)}
								</div>
							))
						: run.roomId && (
								<Button size="sm" variant="secondary" asChild>
									<Link to={roomPath(run.roomId)}>
										Open conversation
									</Link>
								</Button>
							)}
				</article>
			))}
			{!delegations.length && !attention.runs.length && (
				<p className="py-4 text-muted-foreground text-sm">
					{attention.isLoading || attention.delegations.isLoading
						? "Checking for decisions and questions…"
						: attention.scan.complete &&
								!attention.delegations.error
							? "No pending input found in accessible agent activity."
							: "No pending input discovered yet."}
				</p>
			)}
			<output className="block text-muted-foreground text-xs">
				{attention.isLoading
					? `Inspecting activity · ${attention.scan.checked} records checked`
					: attention.scan.complete
						? "Accessible agent activity checked"
						: "Partial coverage · discovered actions are retained"}
			</output>
		</div>
	);
}
