import { ExternalLink, Waypoints } from "lucide-react";
import type {
	AutomationNode,
	AutomationNodeTrace,
} from "../../domain/automation.types";

function configString(
	step: AutomationNode | undefined,
	key: string,
): string | null {
	const value = step?.workflowConfig?.[key];
	return typeof value === "string" && value.trim() ? value : null;
}

function systemAppUrl(app: "client" | "playground", route: string): string {
	const url = new URL(`../../${app}/dist/`, window.location.href);
	url.hash = route;
	return url.toString();
}

/** Links to the room/agent-run activity behind a step's execution, when available. */
export function TraceDetail({
	trace,
	step,
}: {
	trace: AutomationNodeTrace;
	step: AutomationNode | undefined;
}) {
	const roomId = trace.roomId?.trim();
	const modelMessageId = trace.modelMessageId?.trim();
	const agentRunId = trace.agentRunId?.trim();
	const workspaceId =
		configString(step, "workspaceId") ?? configString(step, "agentId");
	const modelRoomUrl =
		roomId && modelMessageId
			? systemAppUrl("playground", `/room/${encodeURIComponent(roomId)}`)
			: null;
	const agentActivityUrl =
		agentRunId && workspaceId
			? systemAppUrl(
					"client",
					`/agent/${encodeURIComponent(workspaceId)}/agent-activity${
						roomId
							? `?roomId=${encodeURIComponent(roomId)}&runId=${encodeURIComponent(agentRunId)}`
							: ""
					}`,
				)
			: null;

	if (!roomId && !modelMessageId && !agentRunId) return null;

	return (
		<div className="rounded-md border bg-muted/30 px-3 py-2 text-[11px]">
			<div className="flex items-center gap-1.5 font-medium text-foreground">
				<Waypoints className="h-3.5 w-3.5" aria-hidden />
				Activity trace
			</div>
			<dl className="mt-2 space-y-1 text-muted-foreground">
				{roomId && (
					<div>
						<dt className="inline font-medium">Room ID: </dt>
						<dd className="inline break-all font-mono">{roomId}</dd>
					</div>
				)}
				{modelMessageId && (
					<div>
						<dt className="inline font-medium">Message ID: </dt>
						<dd className="inline break-all font-mono">
							{modelMessageId}
						</dd>
					</div>
				)}
				{agentRunId && (
					<div>
						<dt className="inline font-medium">Agent run ID: </dt>
						<dd className="inline break-all font-mono">
							{agentRunId}
						</dd>
					</div>
				)}
			</dl>
			{(modelRoomUrl || agentActivityUrl) && (
				<div className="mt-2 flex flex-wrap gap-3">
					{modelRoomUrl && (
						<a
							href={modelRoomUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
						>
							Open model room
							<ExternalLink className="h-3 w-3" aria-hidden />
						</a>
					)}
					{agentActivityUrl && (
						<a
							href={agentActivityUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
						>
							Open Agent Activity
							<ExternalLink className="h-3 w-3" aria-hidden />
						</a>
					)}
				</div>
			)}
		</div>
	);
}
