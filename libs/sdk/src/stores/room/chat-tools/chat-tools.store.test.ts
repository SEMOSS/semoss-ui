import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PixelMessageToolCallPart } from "../room.types";
import type { RoomEngine } from "../room-engine.store";
import type { ToolCallStore } from "../tool-call.store";
import { createChatFilesToolProvider } from "./chat-files-tool-provider";
import { ChatToolsStore } from "./chat-tools.store";
import { FOLDER_TOOL_NAMES } from "./folder-tools";

/** The files tools, labelled the way a host's translations would. */
const provider = createChatFilesToolProvider({
	labels: {
		title: (name) => `chatTools:tools.titles.${name}`,
		summarize: () => "",
	},
});

type ToolCall = PixelMessageToolCallPart["toolCall"];

/**
 * A room with just what the chat tools reach for. Its pixels answer with
 * `outputFor`, standing in for the chat's files on the server.
 */
const createRoom = (
	mode: "chat" | "agent" = "chat",
	outputFor: (pixel: string) => unknown = () => [],
) => {
	const room = {
		roomId: "room-1",
		insightId: "insight-1",
		mode: mode,
		options: { mcp: [] } as Record<string, unknown>,
		setOptions: vi.fn((options: Record<string, unknown>) => {
			room.options = { ...room.options, ...options };
		}),
		runRoomPixel: vi.fn(async (pixel: string) => ({
			errors: [],
			insightId: "insight-1",
			pixelReturn: [{ output: outputFor(pixel) }],
		})),
		refreshFiles: vi.fn(),
	};
	return room as unknown as RoomEngine;
};

/** A tool call as the room receives it. */
const toolCall = (name: string, meta?: ToolCall["_meta"]): ToolCall => ({
	id: `call-${name}`,
	type: "function",
	name: name,
	arguments: { path: "notes/today.md" },
	_tool_found: false,
	original_name: name,
	description: "",
	...(meta ? { _meta: meta } : {}),
});

describe("ChatToolsStore", () => {
	let chatTools: ChatToolsStore;

	beforeEach(() => {
		chatTools = new ChatToolsStore(createRoom(), [provider]);
	});

	test("a chat turn carries every default tool the room does not disable", () => {
		const room = createRoom();
		chatTools = new ChatToolsStore(room, [provider]);
		const names = () =>
			(chatTools.chatParamValues.tools as { name: string }[]).map(
				(tool) => tool.name,
			);
		expect(names()).toEqual(Object.values(FOLDER_TOOL_NAMES));
		const [list] = chatTools.chatParamValues.tools as {
			description: string;
		}[];
		expect(list.description).toContain(
			"Room Files (this room's own files)",
		);

		room.setOptions({
			defaultTools: {
				[FOLDER_TOOL_NAMES.DELETE]: "disabled",
				[FOLDER_TOOL_NAMES.WRITE]: "disabled",
			},
		});
		expect(names()).not.toContain(FOLDER_TOOL_NAMES.WRITE);
		expect(names()).not.toContain(FOLDER_TOOL_NAMES.DELETE);
		expect(names()).toContain(FOLDER_TOOL_NAMES.READ);
	});

	test("an agent room sends no folder tools", () => {
		chatTools = new ChatToolsStore(createRoom("agent"), [provider]);
		expect(chatTools.chatToolDefinitions).toEqual([]);
		expect(chatTools.chatParamValues).toEqual({});
	});

	test("the room folder never lists or touches the chat's tool settings", async () => {
		const room = createRoom("chat", (pixel) =>
			pixel.startsWith("BrowseInsightAssets")
				? [
						{ name: "mcp", type: "directory" },
						{ name: "notes.md", type: "file" },
					]
				: [],
		);
		const store = new ChatToolsStore(room, [provider]);
		const listing = await store.runFolderCall(FOLDER_TOOL_NAMES.LIST, {});
		expect(JSON.stringify(listing.payload)).not.toContain("mcp");
		expect(JSON.stringify(listing.payload)).toContain("notes.md");

		const removal = await store.runFolderCall(FOLDER_TOOL_NAMES.WRITE, {
			path: "mcp/pixel_mcp.json",
			content: "{}",
		});
		expect(removal.isError).toBe(true);
		expect(
			vi
				.mocked(room.runRoomPixel)
				.mock.calls.some(([pixel]) => pixel.includes("pixel_mcp.json")),
		).toBe(false);
	});

	test("a chat folder call runs the way the room's settings say", () => {
		const read = chatTools.decorateToolCall(
			toolCall(FOLDER_TOOL_NAMES.READ),
		);
		expect(read._meta?.SMSS_MCP_EXECUTION).toBe("auto");
		expect(read._meta?.SMSS_CLIENT_TOOL).toBe(true);
		expect(read.title).toBe(
			`chatTools:tools.titles.${FOLDER_TOOL_NAMES.READ}`,
		);

		const write = chatTools.decorateToolCall(
			toolCall(FOLDER_TOOL_NAMES.WRITE),
		);
		expect(write._meta?.SMSS_MCP_EXECUTION).toBe("ask");
		expect(write._meta?.SMSS_MCP_UI).toEqual({
			displayLocation: "inline",
			autoOpen: true,
		});

		const room = createRoom();
		room.setOptions({
			defaultTools: {
				[FOLDER_TOOL_NAMES.WRITE]: "auto",
				[FOLDER_TOOL_NAMES.READ]: "ask",
			},
		});
		chatTools = new ChatToolsStore(room, [provider]);
		expect(
			chatTools.decorateToolCall(toolCall(FOLDER_TOOL_NAMES.WRITE))._meta
				?.SMSS_MCP_EXECUTION,
		).toBe("auto");
		expect(
			chatTools.decorateToolCall(toolCall(FOLDER_TOOL_NAMES.READ))._meta
				?.SMSS_MCP_EXECUTION,
		).toBe("ask");
	});

	test("refuses a default tool the room's settings disable", async () => {
		const room = createRoom();
		room.setOptions({
			defaultTools: { [FOLDER_TOOL_NAMES.READ]: "disabled" },
		});
		chatTools = new ChatToolsStore(room, [provider]);
		const refused = await chatTools.runFolderCall(FOLDER_TOOL_NAMES.READ, {
			path: "a.md",
		});
		expect(refused.isError).toBe(true);
		expect(String(refused.payload.error)).toContain("disabled");
		expect(room.runRoomPixel).not.toHaveBeenCalled();
	});

	test("a change a folder tool makes refreshes Room Files", async () => {
		const room = createRoom();
		chatTools = new ChatToolsStore(room, [provider]);
		const outcome = await chatTools.runFolderCall(FOLDER_TOOL_NAMES.WRITE, {
			path: "notes.md",
			content: "hello",
		});
		expect(outcome.isError).toBe(false);
		expect(room.refreshFiles).toHaveBeenCalled();
	});

	test("runs an allowed connector call through its message, against the room's toolbox", async () => {
		const runMcpToolCall = vi.fn(async () => undefined);
		const tool = {
			status: "INITIAL",
			message: { runMcpToolCall: runMcpToolCall },
		} as unknown as ToolCallStore;

		await chatTools.approveConnectorChatTool(tool);
		expect(runMcpToolCall).toHaveBeenCalledWith(tool);

		runMcpToolCall.mockClear();
		await chatTools.approveConnectorChatTool({
			...tool,
			status: "SUCCESS",
		} as unknown as ToolCallStore);
		expect(runMcpToolCall).not.toHaveBeenCalled();
	});
});
