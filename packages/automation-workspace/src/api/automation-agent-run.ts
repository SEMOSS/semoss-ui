import type { AgentRunSnapshot, PendingAgentAction } from "@semoss/sdk";
import { runPixel } from "@semoss/sdk";
import type { AutomationAgentRunMessage } from "../components/agent-run/agent-run.types";

export interface AutomationAgentRunContext {
	projectId: string;
	automationRunId: string;
	nodeId: string;
	agentRunId: string;
}

export type AutomationAgentRunSnapshot = AgentRunSnapshot & {
	canControl: boolean;
	messages?: AutomationAgentRunMessage[];
};

interface ResolveAutomationAgentRunActionParams
	extends AutomationAgentRunContext {
	action: PendingAgentAction;
	decision: "approve" | "edit" | "reject" | "respond";
	paramValues?: Record<string, unknown>;
}

const pixelList = (value: string | boolean): string => JSON.stringify([value]);

const contextArgs = ({
	projectId,
	automationRunId,
	nodeId,
	agentRunId,
}: AutomationAgentRunContext): string =>
	`project=${pixelList(projectId)}, automationRunId=${pixelList(automationRunId)}, nodeId=${pixelList(nodeId)}, agentRunId=${pixelList(agentRunId)}`;

const outputFrom = <T>(response: Awaited<ReturnType<typeof runPixel>>): T => {
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}
	const output = response.pixelReturn?.[0]?.output;
	if (output === undefined || output === null) {
		throw new Error("Automation agent-run request returned no result.");
	}
	return output as T;
};

/** Reads durable agent activity only through the trace-authorized Automation route. */
export async function getAutomationAgentRun(
	context: AutomationAgentRunContext,
): Promise<AutomationAgentRunSnapshot> {
	const response = await runPixel(
		`GetAutomationAgentRun(${contextArgs(context)}, includeMessages=${pixelList(true)});`,
	);
	const output = outputFrom<AutomationAgentRunSnapshot>(response);
	if (!output.runId || output.runId !== context.agentRunId) {
		throw new Error("Automation agent run was not found.");
	}
	return { ...output, pendingActions: output.pendingActions ?? [] };
}

/** Resolves one action through Automation's editor-only trace authorization route. */
export async function resolveAutomationAgentRunAction({
	action,
	decision,
	paramValues,
	...context
}: ResolveAutomationAgentRunActionParams): Promise<string> {
	const argumentsList = [
		contextArgs(context),
		`actionId=${pixelList(action.actionId)}`,
		`decision=${pixelList(decision)}`,
	];
	if (decision === "edit" && paramValues) {
		argumentsList.push(`paramValues=${JSON.stringify(paramValues)}`);
	}
	if (decision === "respond") {
		argumentsList.push(
			`mcpToolResult=${pixelList(JSON.stringify(paramValues ?? {}))}`,
		);
	}
	const response = await runPixel(
		`ResolveAutomationAgentRunAction(${argumentsList.join(", ")});`,
	);
	const output = outputFrom<{ result?: unknown }>(response);
	return typeof output.result === "string" ? output.result : "";
}

/** Stops a child agent run through Automation's editor-only trace authorization route. */
export async function stopAutomationAgentRun(
	context: AutomationAgentRunContext,
): Promise<AutomationAgentRunSnapshot> {
	const response = await runPixel(
		`StopAutomationAgentRun(${contextArgs(context)});`,
	);
	return outputFrom<AutomationAgentRunSnapshot>(response);
}
