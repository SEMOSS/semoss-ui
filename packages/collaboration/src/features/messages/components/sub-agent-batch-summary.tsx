import { Bot, Users } from "lucide-react";
import { Muted } from "@semoss/ui/next";
import type { ConversationTool } from "../types/message";

/** Tool names the semoss harness uses to spawn and track sub-agents. */
export const SUB_AGENT_TOOL_NAMES = new Set([
	"SpawnSubAgent",
	"CheckSubAgentStatus",
	"WaitForSubAgent",
]);

/** True for a tool call that only spawns or polls a sub-agent, not ordinary work. */
export function isSubAgentTool(tool: ConversationTool): boolean {
	return SUB_AGENT_TOOL_NAMES.has(tool.name);
}

const TERMINAL: ReadonlySet<ConversationTool["status"]> = new Set([
	"COMPLETED",
	"FAILED",
	"REJECTED",
	"CANCELLED",
]);

/** The sub-agent this wait/status call tracks, so repeated polls count once. */
function jobKey(tool: ConversationTool): string {
	const jobId = tool.arguments.jobId;
	return typeof jobId === "string" && jobId ? jobId : tool.id;
}

/**
 * One line standing in for the sub-agent spawn/wait/status tool calls, so the
 * chat shows "Working with 4 sub-agents: 1 done, 3 running" while they run and
 * collapses to "4 sub-agents finished" once they are all done, instead of a
 * row of orchestration tool cards. The named sub-agent cards render separately.
 */
export function SubAgentBatchSummary({ tools }: { tools: ConversationTool[] }) {
	// One spawn is one sub-agent. A block with no spawn is a later "collect" step,
	// so count the distinct sub-agents its wait/status calls name by jobId.
	const spawns = tools.filter((tool) => tool.name === "SpawnSubAgent");
	const counted =
		spawns.length > 0
			? spawns
			: [...new Map(tools.map((tool) => [jobKey(tool), tool])).values()];
	const count = counted.length;
	const done = counted.filter((tool) => tool.status === "COMPLETED").length;
	const failed = counted.filter(
		(tool) => tool.status === "FAILED" || tool.status === "CANCELLED",
	).length;
	const allSettled = tools.every((tool) => TERMINAL.has(tool.status));
	const noun = count === 1 ? "sub-agent" : "sub-agents";

	let text: string;
	if (allSettled) {
		text =
			failed > 0
				? `${count} ${noun} finished, ${failed} failed`
				: `${count} ${noun} finished`;
	} else {
		const running = Math.max(count - done - failed, 0);
		const parts = [
			done > 0 ? `${done} done` : null,
			failed > 0 ? `${failed} failed` : null,
			running > 0 ? `${running} running` : null,
		].filter((part): part is string => part !== null);
		text = `Working with ${count} ${noun}${
			parts.length > 0 ? `: ${parts.join(", ")}` : ""
		}`;
	}

	const Icon = allSettled ? Users : Bot;
	return (
		<div className="my-1 flex min-h-10 w-full items-center gap-2 px-3 py-2 text-muted-foreground">
			<Icon aria-hidden="true" className="size-4 shrink-0" />
			<Muted
				className="wrap-anywhere min-w-0 text-sm"
				aria-live={allSettled ? undefined : "polite"}
			>
				{text}
			</Muted>
		</div>
	);
}
