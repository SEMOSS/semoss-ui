import type { ConversationMessagePart } from "@/features/messages/types/message";

let next = 0;

/** A completed ComposeEmail call, as the assistant's response carries it. */
export function composeEmailPart(
	args: Record<string, unknown>,
	id = `compose-${++next}`,
	status: "COMPLETED" | "FAILED" | "RUNNING" = "COMPLETED",
): ConversationMessagePart {
	return {
		type: "tool",
		tool: {
			id,
			parentMessageId: "answer",
			name: "ComposeEmail",
			title: "Compose Email",
			arguments: args,
			metadata: { SMSS_MCP_UI: { component: "email-compose" } },
			status,
		},
	};
}
