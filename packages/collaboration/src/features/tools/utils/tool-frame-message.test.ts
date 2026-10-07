import type { ConversationTool } from "@/features/messages/types/message";
import { readToolFrameResponse } from "./tool-frame-message";

const tool: ConversationTool = {
	id: "tool-1",
	roomId: "child-room",
	parentMessageId: "message-1",
	name: "search",
	title: "Search",
	arguments: {},
	status: "INPUT_REQUIRED",
};
const origin = "https://tools.example.test";
const response = {
	type: "SMSS_EXEC_TOOL",
	tool: {
		type: "MCP",
		id: tool.id,
		roomId: tool.roomId,
		message: tool.parentMessageId,
		name: tool.name,
		response: "ok",
		executedParameters: { query: "edited" },
	},
};

it("accepts the exact tool response from its initialized frame", () => {
	const event = new MessageEvent("message", {
		source: window,
		origin,
		data: response,
	});
	expect(
		readToolFrameResponse(event, window, origin, tool, "parent-room")
			?.executedParameters,
	).toEqual({ query: "edited" });
});
it.each([
	{ source: null, origin, data: response },
	{ source: window, origin: "https://other.example.test", data: response },
	{
		source: window,
		origin,
		data: {
			...response,
			tool: { ...response.tool, roomId: "parent-room" },
		},
	},
	{
		source: window,
		origin,
		data: { ...response, tool: { ...response.tool, id: "different" } },
	},
	{
		source: window,
		origin,
		data: {
			...response,
			tool: { ...response.tool, executedParameters: [] },
		},
	},
])("ignores unrelated or malformed frame messages", (options) => {
	expect(
		readToolFrameResponse(
			new MessageEvent<unknown>("message", options),
			window,
			origin,
			tool,
			"parent-room",
		),
	).toBeNull();
});
