import type { PendingAgentAction } from "@semoss/sdk";
import type { AutomationAgentRunToolGroup } from "./agent-run.types";

/** A tool call is still in flight until its result part arrives. */
export const isActiveToolInvocationStatus = (status?: string): boolean =>
	!status;

export const isFailedToolInvocationStatus = (status?: string): boolean =>
	Boolean(status && /error|fail/i.test(status));

/**
 * One status for the whole group, in priority order: needs input > actively
 * running > failed > done. Drives the group node's color/pulse and which
 * card the detail panel highlights as "active".
 */
export const toolGroupStatus = (group: AutomationAgentRunToolGroup): string => {
	if (group.invocations.some((call) => call.status === "INPUT_REQUIRED")) {
		return "INPUT_REQUIRED";
	}
	if (
		group.invocations.some((call) =>
			isActiveToolInvocationStatus(call.status),
		)
	) {
		return "RUNNING";
	}
	if (
		group.invocations.some((call) =>
			isFailedToolInvocationStatus(call.status),
		)
	) {
		return "FAILED";
	}
	return "COMPLETED";
};

/** Return a concise user-facing label for an agent or tool status. */
export const agentRunStatusLabel = (status: string): string => {
	switch (status.toUpperCase()) {
		case "SUBMITTED":
			return "Queued";
		case "RUNNING":
			return "Running";
		case "INPUT_REQUIRED":
			return "Needs input";
		case "COMPLETED":
			return "Completed";
		case "FAILED":
			return "Failed";
		case "CANCELLED":
			return "Cancelled";
		case "QUEUED":
			return "Queued";
		case "REJECTED":
			return "Rejected";
		default:
			return status.toLowerCase().replace(/_/g, " ");
	}
};

/** True if a status is a terminal agent-run state. */
export const isTerminalAgentRunStatus = (status: string): boolean =>
	["COMPLETED", "FAILED", "CANCELLED"].includes(status.toUpperCase());

/** Return a semantic status class for a compact run or activity badge. */
export const agentRunStatusClass = (status: string): string => {
	switch (status.toUpperCase()) {
		case "FAILED":
		case "REJECTED":
		case "CANCELLED":
			return "border-destructive/50 bg-destructive/10 text-destructive";
		case "COMPLETED":
			return "border-success/50 bg-success/10 text-success";
		case "INPUT_REQUIRED":
			return "border-warning/50 bg-warning/10 text-warning";
		case "RUNNING":
		case "SUBMITTED":
		case "QUEUED":
			return "border-primary/50 bg-primary/10 text-primary";
		default:
			return "border-border bg-muted text-muted-foreground";
	}
};

/**
 * Resolve the human-readable name for an agent tool, stripping its MCP
 * routing alias when the durable metadata includes the original name.
 */
export const agentToolLabel = (
	name: string | null | undefined,
	metadata?: Record<string, unknown> | null,
): string => {
	const originalName = metadata?.SMSS_ORIGINAL_TOOL_NAME;
	const source =
		typeof originalName === "string" && originalName.trim()
			? originalName
			: (name ?? "");
	const unaliased =
		source.match(
			/^a(?:[0-9a-f]{8}(?:[0-9a-f-]{0,28})?|[a-z0-9]+(?:-[a-z0-9]+)+)_(.+)$/i,
		)?.[1] ?? source;

	return (
		unaliased
			.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
			.replace(/[_-]+/g, " ")
			.trim()
			.replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Tool"
	);
};

/** Format one pending action's arguments without letting malformed data throw. */
export const formatAgentActionArguments = (
	action: Pick<PendingAgentAction, "toolArgs">,
): string => {
	try {
		return JSON.stringify(action.toolArgs ?? {}, null, 2);
	} catch {
		return "{}";
	}
};
