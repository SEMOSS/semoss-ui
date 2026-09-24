import type { MCPToolResponse } from "@semoss/sdk";
import { z } from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";

const responseSchema = z.object({
	type: z.literal("SMSS_EXEC_TOOL"),
	tool: z.object({
		type: z.literal("MCP"),
		id: z.string(),
		roomId: z.string(),
		message: z.string(),
		name: z.string(),
		response: z.string(),
		tool_status: z
			.enum(["success", "error", "cancelled", "paused"])
			.optional(),
		executedParameters: z.record(z.string(), z.unknown()).optional(),
	}),
});

/** Accept only the mounted frame's response for the exact initialized tool. */
export function readToolFrameResponse(
	event: MessageEvent<unknown>,
	frame: Window | null,
	origin: string,
	tool: ConversationTool,
	roomId: string,
): MCPToolResponse | null {
	if (!frame || event.source !== frame || event.origin !== origin)
		return null;
	const parsed = responseSchema.safeParse(event.data);
	if (!parsed.success) return null;
	const response = parsed.data.tool;
	return response.id === tool.id &&
		response.roomId === (tool.roomId ?? roomId) &&
		response.message === tool.parentMessageId &&
		response.name === tool.name
		? response
		: null;
}
