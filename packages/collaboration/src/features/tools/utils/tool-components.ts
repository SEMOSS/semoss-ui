import type { ConversationTool } from "@/features/messages/types/message";
import { getDeclaredToolView } from "./tool-metadata";

/**
 * Flat component names supported by Collaboration's native tool views.
 * Only SMSS_MCP_UI.resourceURI selects a view; unsupported declarations
 * and historical calls without a resource use the generic tool view.
 */
export const TOOL_COMPONENTS = {
	emailCompose: "email-compose",
	emailDraft: "email-draft",
	emailSend: "email-send",
	memory: "memory",
	delegationRequest: "delegation-request",
	delegationSubmit: "delegation-submit",
} as const;

export type ToolComponent =
	(typeof TOOL_COMPONENTS)[keyof typeof TOOL_COMPONENTS];

const KNOWN = Object.values(TOOL_COMPONENTS);

/** The supported component explicitly named by the tool's resource URI. */
export function getToolComponent(
	tool: ConversationTool,
): ToolComponent | undefined {
	const declared = getDeclaredToolView(tool);
	return KNOWN.find((name) => name === declared?.componentName);
}

/** Whether the tool's content is an email, saved as a draft or sent. */
export function isEmailComponent(
	component: ToolComponent | undefined,
): component is "email-draft" | "email-send" {
	return (
		component === TOOL_COMPONENTS.emailDraft ||
		component === TOOL_COMPONENTS.emailSend
	);
}
