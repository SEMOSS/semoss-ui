import type { ConversationTool } from "@/features/messages/types/message";
import { getDeclaredToolComponent, resolveToolUiUrl } from "./tool-metadata";

/**
 * Content kinds a tool can declare in SMSS_MCP_UI.component (Semoss
 * MCPUtility COMPONENT_*). Each page decides how to show a kind; a kind it
 * does not know falls back to the generic tool view. A tool with its own
 * MCP UI (resourceURI) shows that instead, so a custom UI always wins.
 */
export const TOOL_COMPONENTS = {
	emailCompose: "email-compose",
	emailDraft: "email-draft",
	emailSend: "email-send",
	calendarEvent: "calendar-event",
} as const;

export type ToolComponent =
	(typeof TOOL_COMPONENTS)[keyof typeof TOOL_COMPONENTS];

const KNOWN = new Set<string>(Object.values(TOOL_COMPONENTS));

/** The known component for a tool call; history saved without one falls back to the tool name. */
export function getToolComponent(
	tool: ConversationTool,
): ToolComponent | undefined {
	if (resolveToolUiUrl(tool)) return undefined;
	const declared = getDeclaredToolComponent(tool);
	if (declared)
		return KNOWN.has(declared) ? (declared as ToolComponent) : undefined;
	const names = [
		tool.name,
		tool.metadata?.SMSS_ORIGINAL_TOOL_NAME,
		tool.metadata?.SMSS_FUNCTION_NAME,
	];
	const endsWith = (suffix: string) =>
		names.some((name) => typeof name === "string" && name.endsWith(suffix));
	if (endsWith("SaveDraft")) return TOOL_COMPONENTS.emailDraft;
	if (endsWith("ComposeEmail")) return TOOL_COMPONENTS.emailCompose;
	if (endsWith("SendEmail")) return TOOL_COMPONENTS.emailSend;
	return undefined;
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
