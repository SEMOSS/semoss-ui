import { isRecord } from "@semoss/utility/object";
import type { AssistantToolResult } from "@/api/assistant-tools";

/** Call identity sent in SMSS_INIT_TOOL and required on the response. */
export interface EmbeddedToolIdentity {
	id: string;
	roomId: string;
	message: string;
	name: string;
}

/** Accept only a completed response from this frame, origin, and exact invocation. */
export const readEmbeddedToolResult = (
	event: MessageEvent<unknown>,
	frame: Window | null,
	origin: string,
	identity: EmbeddedToolIdentity,
): AssistantToolResult | null => {
	if (!frame || event.source !== frame || event.origin !== origin)
		return null;
	const data = event.data;
	if (
		!data ||
		typeof data !== "object" ||
		!("type" in data) ||
		data.type !== "SMSS_EXEC_TOOL" ||
		!("tool" in data)
	)
		return null;
	const tool = data.tool;
	if (
		!tool ||
		typeof tool !== "object" ||
		!("type" in tool) ||
		tool.type !== "MCP" ||
		!("id" in tool) ||
		tool.id !== identity.id ||
		("roomId" in tool && tool.roomId !== identity.roomId) ||
		!("message" in tool) ||
		tool.message !== identity.message ||
		!("name" in tool) ||
		tool.name !== identity.name ||
		!("response" in tool) ||
		("executedParameters" in tool && !isRecord(tool.executedParameters))
	)
		return null;
	const status = "tool_status" in tool ? tool.tool_status : "success";
	if (status !== "success" && status !== "error" && status !== "cancelled")
		return null;
	// Older SDKs (including beta.29 and Blocks) omit roomId and return raw
	// JSON. The mounted frame, origin, message, call ID, and name still bind
	// the result to its owning run; a supplied roomId must match above.
	try {
		const response =
			typeof tool.response === "string"
				? tool.response
				: JSON.stringify(tool.response);
		if (response === undefined) return null;
		return {
			response,
			status,
			...("executedParameters" in tool &&
			isRecord(tool.executedParameters)
				? { executedParameters: tool.executedParameters }
				: {}),
		};
	} catch {
		return null;
	}
};
