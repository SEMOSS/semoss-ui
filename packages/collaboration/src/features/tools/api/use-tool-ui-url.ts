import { usePixel } from "@semoss/sdk/react";
import type { ConversationTool } from "@/features/messages/types/message";
import { pixel } from "@/lib/pixel";
import { resolveToolUiUrl } from "../utils/tool-metadata";

/** Resolve Blocks resources while keeping explicit action URLs and system UIs authoritative. */
export function useToolUiUrl(
	tool: ConversationTool | undefined,
): string | undefined {
	const owner =
		tool?.metadata?.SMSS_ENGINE_ID || tool?.metadata?.SMSS_PROJECT_ID;
	const type = tool?.metadata?.SMSS_ENGINE_TYPE;
	const ordinary = tool ? resolveToolUiUrl(tool) : undefined;
	const projectResource = ordinary?.includes("/public_home/");
	const query = usePixel<unknown>(
		projectResource &&
			typeof owner === "string" &&
			(!type || type === "PROJECT")
			? pixel("ProjectInfo", { project: owner })
			: "",
	);
	const data = query.data;
	const isBlocks =
		typeof data === "object" &&
		data !== null &&
		"project_type" in data &&
		data.project_type === "BLOCKS";
	if (!tool || tool.serverTool) return undefined;
	if (tool.uiUrl && tool.uiUrl !== ordinary) return tool.uiUrl;
	return resolveToolUiUrl(tool, isBlocks) ?? tool.uiUrl;
}
