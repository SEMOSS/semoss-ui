import { describe, expect, test, vi } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import type { PendingAgentAction } from "@semoss/sdk";
import { createMemoryFileSource } from "../../../test/memory-file-source";
import type { RoomStore } from "../../room/store/room.store";
import type { ToolStore } from "../../room/store/tool.store";
import { ChatTools } from "./chat-tools";
import { DesktopFolders } from "./desktop-folders";
import { DESKTOP_TOOL_NAMES } from "./folder-tools";

// jsdom's Blob has no arrayBuffer; browsers and Electron do
vi.stubGlobal("Blob", NodeBlob);

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	getI18n: () => ({ t: (key: string) => key }),
}));

/** A room with one attached folder, notes, holding `q3.md`. */
const createRoom = (mode: "chat" | "agent", hasFolders = true) => {
	const notes = createMemoryFileSource({ "/q3.md": "# Q3" });
	const toolFolder = new DesktopFolders([{ name: "notes", source: notes }]);
	const decide = vi.fn(async () => "ok");
	const room = {
		roomId: "room-1",
		insightId: "insight-1",
		mode: mode,
		options: { mcp: [] } as Record<string, unknown>,
		localFolders: hasFolders
			? { folders: [{ id: "f1", name: "notes" }], toolFolder }
			: null,
		refreshWorkbenchFileExplorer: vi.fn(),
		refreshLocalFolderPanels: vi.fn(),
		agentTurns: { getOrCreateAgent: vi.fn(() => ({ decide })) },
	};
	return { room: room as unknown as RoomStore, notes, decide, raw: room };
};

/** An agent run's paused desktop call. */
const pausedTool = (
	room: RoomStore,
	name: string,
	args: Record<string, unknown>,
): ToolStore => {
	const action = {
		actionId: `action-${name}`,
		runId: "run-1",
		toolArgs: args,
		editedArgs: null,
	} as unknown as PendingAgentAction;
	return {
		room: room,
		json: { name: `__room__${name}`, _meta: { SMSS_FUNCTION_NAME: name } },
		parameters: args,
		pendingAction: action,
	} as unknown as ToolStore;
};

describe("ChatTools client tools", () => {
	test("a chat turn offers the client tools beside Room Files'", () => {
		const { room } = createRoom("chat");
		const names = new ChatTools(room).chatToolDefinitions.map(
			(tool) => tool.name,
		);

		expect(names).toEqual(
			expect.arrayContaining(Object.values(DESKTOP_TOOL_NAMES)),
		);
		const [list] = new ChatTools(room).clientToolDefinitions;
		expect(list?.description).toContain('"notes"');
	});

	test("no client tools without attached folders, or in an agent turn", () => {
		expect(
			new ChatTools(createRoom("chat", false).room).clientToolDefinitions,
		).toEqual([]);
		expect(
			new ChatTools(createRoom("agent").room).chatToolDefinitions,
		).toEqual([]);
	});

	test("a desktop write lands in the folder and refreshes its panels", async () => {
		const { room, notes, raw } = createRoom("chat");
		const outcome = await new ChatTools(room).runFolderCall(
			DESKTOP_TOOL_NAMES.WRITE,
			{ path: "notes/todo.md", content: "- ship" },
		);

		expect(outcome.isError).toBe(false);
		expect(notes.files.get("/todo.md")).toBe("- ship");
		expect(raw.refreshLocalFolderPanels).toHaveBeenCalled();
		expect(raw.refreshWorkbenchFileExplorer).not.toHaveBeenCalled();
	});

	test("a desktop call where the folders are not says so", async () => {
		const { room } = createRoom("chat", false);
		const outcome = await new ChatTools(room).runFolderCall(
			DESKTOP_TOOL_NAMES.READ,
			{ path: "notes/q3.md" },
		);

		expect(outcome).toMatchObject({ isError: true });
		expect(String(outcome.payload.error)).toContain("desktop app");
	});

	test("an agent run's read is answered at once, and only once", async () => {
		const { room, decide } = createRoom("agent");
		const chatTools = new ChatTools(room);
		const tool = pausedTool(room, DESKTOP_TOOL_NAMES.READ, {
			path: "notes/q3.md",
		});

		chatTools.answerAgentClientCalls([tool]);
		chatTools.answerAgentClientCalls([tool]);
		await vi.waitFor(() => expect(decide).toHaveBeenCalled());

		expect(decide).toHaveBeenCalledTimes(1);
		const [, decision, payload] = decide.mock.calls[0] as unknown as [
			unknown,
			string,
			Record<string, unknown>,
		];
		expect(decision).toBe("respond");
		expect(payload).toMatchObject({ content: "# Q3" });
	});

	test("an agent run's write waits for the user, then runs when allowed", async () => {
		const { room, decide, notes } = createRoom("agent");
		const chatTools = new ChatTools(room);
		const tool = pausedTool(room, DESKTOP_TOOL_NAMES.WRITE, {
			path: "notes/todo.md",
			content: "- ship",
		});

		chatTools.answerAgentClientCalls([tool]);
		await Promise.resolve();
		expect(decide).not.toHaveBeenCalled();

		await chatTools.approveChatTool(tool);

		expect(notes.files.get("/todo.md")).toBe("- ship");
		expect(decide).toHaveBeenCalledWith(
			tool.pendingAction,
			"respond",
			expect.objectContaining({ path: "notes/todo.md" }),
		);
	});

	test("a desktop call where the folders are not is answered, so the run goes on", async () => {
		const { room, decide } = createRoom("agent", false);
		const chatTools = new ChatTools(room);
		const tool = pausedTool(room, DESKTOP_TOOL_NAMES.WRITE, {
			path: "notes/todo.md",
			content: "x",
		});

		chatTools.answerAgentClientCalls([tool]);
		await vi.waitFor(() => expect(decide).toHaveBeenCalled());

		const [, , payload] = decide.mock.calls[0] as unknown as [
			unknown,
			string,
			Record<string, unknown>,
		];
		expect(String(payload.error)).toContain("desktop app");
	});

	test("a desktop call is decorated with its title and the room's setting", () => {
		const { room } = createRoom("chat");
		const decorated = new ChatTools(room).decorateToolCall({
			id: "call-1",
			type: "function",
			name: DESKTOP_TOOL_NAMES.WRITE,
			arguments: { path: "notes/todo.md" },
			_tool_found: false,
			original_name: DESKTOP_TOOL_NAMES.WRITE,
			description: "",
		});

		expect(decorated.title).toBe("chatTools:tools.titles.desktop_write");
		expect(decorated._meta).toMatchObject({
			SMSS_MCP_EXECUTION: "ask",
			SMSS_CLIENT_TOOL: true,
		});
	});
});
