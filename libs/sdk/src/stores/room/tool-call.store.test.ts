import { describe, expect, it } from "vitest";
import type { ClientToolProvider } from "./chat-tools/client-tool-provider";
import { ResponseMessageStore } from "./message/response-message.store";
import type {
	PixelMessageToolCallPart,
	ResponsePixelMessage,
} from "./room.types";
import { RoomEngine } from "./room-engine.store";

/** A provider that decorates its calls, as the folder and desktop tools do. */
const decoratingProvider: ClientToolProvider = {
	id: "decorating",
	getTools: () => [],
	canHandle: (call) => call.name === "decorated",
	execute: async () => ({ output: "" }),
	// a new object on every call, like every real provider
	decorateToolCall: (call, room) =>
		call.name === "decorated"
			? {
					...call,
					title: `Decorated (${String(room.options.instructions)})`,
				}
			: call,
};

const callPart = (
	name: string,
	args: Record<string, unknown> = {},
): PixelMessageToolCallPart => ({
	type: "TOOL_CALL",
	toolCall: {
		id: "call-1",
		type: "function",
		name: name,
		arguments: args,
		_tool_found: true,
		original_name: name,
		description: "",
	},
});

const response = (room: RoomEngine): ResponseMessageStore =>
	new ResponseMessageStore(room, {
		io: "OUTPUT",
		messageId: "out-1",
		parentMessageId: "in-1",
		visible: true,
		platform_generated: false,
		modelId: "model-1",
		modelType: "MODEL",
		dateCreated: "2026-11-05 10:00:01",
		parts: [],
		tokens: 0,
		ornaments: {},
		pruneToolsAbove: false,
	} as ResponsePixelMessage);

const setup = (name: string) => {
	const room = new RoomEngine({
		roomId: "room-1",
		insightId: "insight-1",
		config: { clientTools: [decoratingProvider] },
	});
	const message = response(room);
	room.syncTool("call-1", message, callPart(name));
	return { room, message, tool: room.getTool("call-1") };
};

describe("ToolCallStore.json", () => {
	it("is the same object between changes, for a decorated call", () => {
		const { tool } = setup("decorated");
		const first = tool.json;
		expect(first.title).toBe("Decorated ()");
		// reads that change nothing must not make a new object: views key
		// their effects on it
		for (let read = 0; read < 5; read += 1) {
			expect(tool.json).toBe(first);
		}
	});

	it("is the same object between changes, for a call no provider decorates", () => {
		const { tool } = setup("plain");
		expect(tool.json).toBe(tool.json);
	});

	it("is the same object between reads of a streaming placeholder", () => {
		const { room, message } = setup("plain");
		room.syncTool("call-2", message, callPart("decorated"), {
			placeholder: true,
		});
		const placeholder = room.getTool("call-2");
		expect(placeholder.json).toBe(placeholder.json);
	});

	it("is remade when the call's part changes", () => {
		const { room, message, tool } = setup("decorated");
		const before = tool.json;
		room.syncTool("call-1", message, callPart("decorated", { a: 1 }));
		const after = tool.json;
		expect(after).not.toBe(before);
		expect(after.arguments).toEqual({ a: 1 });
		expect(tool.json).toBe(after);
	});

	it("is remade when the room's options change, which decide a decoration", () => {
		const { room, tool } = setup("decorated");
		const before = tool.json;
		room.setOptions({ instructions: "brief" });
		expect(tool.json).not.toBe(before);
		expect(tool.json.title).toBe("Decorated (brief)");
	});

	it("is remade when the placeholder gives way to the final part", () => {
		const { room, message } = setup("plain");
		room.syncTool("call-3", message, callPart("decorated"), {
			placeholder: true,
		});
		const tool = room.getTool("call-3");
		const streaming = tool.json;
		room.syncTool("call-3", message, callPart("decorated"));
		expect(tool.json).not.toBe(streaming);
		expect(tool.json.title).toBe("Decorated ()");
	});
});
