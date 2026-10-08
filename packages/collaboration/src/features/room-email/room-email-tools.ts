import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import {
	getToolComponent,
	TOOL_COMPONENTS,
} from "@/features/tools/utils/tool-components";

/** Editor-owned SendEmail calls must save the reviewed draft before approval. */
export function getEditorSendId(
	tool: ConversationTool | undefined,
	action: PendingToolApproval,
): string | undefined {
	const id = action.arguments.openEmailId;
	return !action.requiresResponse &&
		tool &&
		getToolComponent(tool) === TOOL_COMPONENTS.emailSend &&
		typeof id === "string" &&
		id.trim()
		? id
		: undefined;
}
