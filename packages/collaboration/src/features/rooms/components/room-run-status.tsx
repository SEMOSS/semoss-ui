import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Alert, Button, P, useIsMobile } from "@semoss/ui/next";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import type { PendingToolApproval } from "../types/room";
import { turnErrorSummary } from "../utils/turn-error";

/** Actionable errors and approvals beside the composer. */
export function RoomRunStatus({
	agent,
	turnError,
	transportError,
	pendingApprovals,
	onReconnect,
	onNewConversation,
	reviewInWorkbench = false,
}: {
	agent: AgentConfiguration;
	turnError: string | null;
	transportError: Error | null;
	pendingApprovals: PendingToolApproval[];
	onReconnect?: () => Promise<void>;
	/** Offered on a failed turn, so a stuck room can be left for a fresh one. */
	onNewConversation?: () => void;
	/** Work keeps approvals reachable even when the owning timeline message is hidden. */
	reviewInWorkbench?: boolean;
}) {
	const isMobile = useIsMobile();
	const { tools, openInline, openWorkbench, onApproveTool, onRejectTool } =
		useToolWorkbench();
	const summary = turnError ? turnErrorSummary(turnError) : "";

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
						<P className="font-medium text-foreground text-sm">
							{agent.name} could not finish this turn
						</P>
						<P className="text-muted-foreground text-sm">
							{summary}
						</P>
						{summary !== turnError && (
							<details className="mt-1 text-muted-foreground text-xs">
								<summary className="cursor-pointer">
									Details
								</summary>
								<pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-all">
									{turnError}
								</pre>
							</details>
						)}
					</div>
					{onNewConversation && (
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={onNewConversation}
						>
							New conversation
						</Button>
					)}
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
					className="max-h-40 shrink-0 divide-y overflow-y-auto border-t bg-warning/5"
					aria-label="Tools awaiting your approval"
				>
					{pendingApprovals.map((approval) => {
						const tool = tools[approval.toolId];
						const title = tool?.title ?? approval.toolName;
						// a tool UI or a question has to be opened; a plain call can be decided here
						const canDecideHere =
							!approval.requiresResponse && !approval.uiUrl;
						const isDisabled = !tool || approval.isDeciding;
						return (
							<div
								key={approval.actionId ?? approval.toolId}
								className="flex items-center gap-2 px-5 py-2"
							>
								<ShieldCheck
									aria-hidden="true"
									className="size-4 shrink-0 text-warning"
								/>
								<P
									className="min-w-0 flex-1 truncate text-sm"
									title={approval.task}
								>
									<span className="font-medium">
										{approval.requiresResponse
											? `${approval.ownerName ?? agent.name} needs your input`
											: approval.ownerName
												? `${approval.ownerName}: ${title}`
												: title}
									</span>
									{approval.task && (
										<span className="text-muted-foreground">
											{" \u00b7 "}
											{approval.task}
										</span>
									)}
								</P>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									disabled={isDisabled}
									onClick={() =>
										isMobile && !reviewInWorkbench
											? openInline(approval.toolId)
											: openWorkbench(approval.toolId)
									}
								>
									{approval.requiresResponse
										? "Answer"
										: "Review"}
								</Button>
								{canDecideHere && (
									<>
										<Button
											type="button"
											size="sm"
											variant="outline"
											disabled={isDisabled}
											onClick={() =>
												void onRejectTool(approval)
											}
										>
											Deny
										</Button>
										<Button
											type="button"
											size="sm"
											disabled={isDisabled}
											onClick={() =>
												void onApproveTool(
													approval,
													approval.arguments,
												)
											}
										>
											{approval.isDeciding
												? "Saving\u2026"
												: "Approve"}
										</Button>
									</>
								)}
							</div>
						);
					})}
				</section>
			)}
		</>
	);
}
