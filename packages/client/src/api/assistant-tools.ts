import { runPixel } from "@semoss/sdk";

/** Read the selected agent's attached resources using the existing workspace endpoint. */
export const agentResourcesQuery = (agentId: string): string =>
	agentId ? `GetWorkspace(workspaceId=${JSON.stringify([agentId])});` : "";

/** A result already produced by an embedded tool, never a request to execute it again. */
export interface AssistantToolResult {
	response: string;
	status: "success" | "error" | "cancelled";
	/** Actual inputs reported by the UI, when its SDK supplies them. */
	executedParameters?: Record<string, unknown>;
}

/** Submit completed UI work through the existing RunMCPTool decision endpoint. */
export const submitAssistantToolResult = async (
	insightId: string,
	actionId: string,
	result: AssistantToolResult,
): Promise<void> => {
	const clauses = [
		`actionId=${JSON.stringify([actionId])}`,
		`decision=${JSON.stringify([result.status === "cancelled" ? "reject" : "respond"])}`,
		`mcpToolResult=${JSON.stringify([result.response])}`,
		`mcpToolStatus=${JSON.stringify([result.status])}`,
		...(result.executedParameters
			? [`paramValues=${JSON.stringify([result.executedParameters])}`]
			: []),
	];
	const response = await runPixel<[string]>(
		`RunMCPTool(${clauses.join(", ")});`,
		insightId,
	);
	if (response.errors.length) throw new Error(response.errors.join("\n"));
};

/** Catalog query for a portal's resource owner; system apps need no catalog lookup. */
export const toolOwnerQuery = (id: string, engineType: unknown): string =>
	!id || id === "__room__"
		? ""
		: !engineType || engineType === "PROJECT"
			? `ProjectInfo(project=${JSON.stringify([id])});`
			: `EngineInfo(engine=${JSON.stringify([id])});`;
