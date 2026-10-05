import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RoomStore } from "@/stores/room/room.store";
import type { ToolStore } from "@/stores/tool/tool.store";
import type { PixelMessageToolCallPart } from "@/types";
import { ChatToolsStore } from "./chat-tools.store";
import { FOLDER_TOOL_NAMES } from "./tools/folder-tools";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	getI18n: () => ({ t: (key: string) => key }),
}));

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
		refreshSidebarFileExplorer: vi.fn(),
		openSidebarPanel: vi.fn(),
	};
	return room as unknown as RoomStore;
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
		chatTools = new ChatToolsStore(createRoom());
	});

	test("a chat turn carries every default tool the room does not disable", () => {
		const room = createRoom();
		chatTools = new ChatToolsStore(room);
		const names = () =>
			(chatTools.chatParamValues.tools as { name: string }[]).map(
				(tool) => tool.name,
			);
		expect(names()).toEqual(Object.values(FOLDER_TOOL_NAMES));
		const [list] = chatTools.chatParamValues.tools as {
			description: string;
		}[];
		expect(list.description).toContain(
			"Chat Files (this chat's own files)",
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
		chatTools = new ChatToolsStore(createRoom("agent"));
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
		const store = new ChatToolsStore(room);
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
		chatTools = new ChatToolsStore(room);
		expect(
			chatTools.decorateToolCall(toolCall(FOLDER_TOOL_NAMES.WRITE))._meta
				?.SMSS_MCP_EXECUTION,
		).toBe("auto");
		expect(
			chatTools.decorateToolCall(toolCall(FOLDER_TOOL_NAMES.READ))._meta
				?.SMSS_MCP_EXECUTION,
		).toBe("ask");
	});

	test("a connector call that asks opens inline", () => {
		const call = chatTools.decorateToolCall(
			toolCall("room__MicrosoftOutlookSendMail", {
				SMSS_ENGINE_NAME: "",
				SMSS_ENGINE_ID: "__room__",
				SMSS_ENGINE_TYPE: "",
				SMSS_PROJECT_NAME: "",
				SMSS_PROJECT_ID: "",
				SMSS_MCP_EXECUTION: "ask",
				SMSS_FUNCTION_NAME: "MicrosoftOutlookSendMail",
			}),
		);
		expect(call._meta?.SMSS_MCP_UI).toMatchObject({
			displayLocation: "inline",
			autoOpen: true,
		});
	});

	test("leaves every other tool call untouched", () => {
		const call = toolCall("SomeProjectTool", {
			SMSS_ENGINE_NAME: "Project",
			SMSS_ENGINE_ID: "project-1",
			SMSS_ENGINE_TYPE: "PROJECT",
			SMSS_PROJECT_NAME: "",
			SMSS_PROJECT_ID: "",
			SMSS_MCP_EXECUTION: "auto",
		});
		expect(chatTools.decorateToolCall(call)).toBe(call);
	});

	test("refuses a default tool the room's settings disable", async () => {
		const room = createRoom();
		room.setOptions({
			defaultTools: { [FOLDER_TOOL_NAMES.READ]: "disabled" },
		});
		chatTools = new ChatToolsStore(room);
		const refused = await chatTools.runFolderCall(FOLDER_TOOL_NAMES.READ, {
			path: "a.md",
		});
		expect(refused.isError).toBe(true);
		expect(String(refused.payload.error)).toContain("disabled");
		expect(room.runRoomPixel).not.toHaveBeenCalled();
	});

	test("a change a folder tool makes refreshes Chat Files", async () => {
		const room = createRoom();
		chatTools = new ChatToolsStore(room);
		const outcome = await chatTools.runFolderCall(FOLDER_TOOL_NAMES.WRITE, {
			path: "notes.md",
			content: "hello",
		});
		expect(outcome.isError).toBe(false);
		expect(room.refreshSidebarFileExplorer).toHaveBeenCalled();
	});

	test("runs an allowed connector call through its message, against the room's toolbox", async () => {
		const runMcpToolCall = vi.fn(async () => undefined);
		const tool = {
			status: "INITIAL",
			message: { runMcpToolCall: runMcpToolCall },
		} as unknown as ToolStore;

		await chatTools.approveConnectorChatTool(tool);
		expect(runMcpToolCall).toHaveBeenCalledWith(tool);

		runMcpToolCall.mockClear();
		await chatTools.approveConnectorChatTool({
			...tool,
			status: "SUCCESS",
		} as unknown as ToolStore);
		expect(runMcpToolCall).not.toHaveBeenCalled();
	});
});
