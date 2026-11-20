import { describe, expect, test, vi } from "vitest";
import type { PendingAgentAction } from "@semoss/sdk";
import type { RoomStore } from "../../room/store/room.store";
import type { ToolStore } from "../../room/store/tool.store";
import { ChatTools } from "./chat-tools";
import type { ClientTool, ToolsHost } from "./tools-host";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	getI18n: () => ({ t: (key: string) => key }),
}));

/** A tool that has nothing to do with folders: it runs on its own. */
const echoTool = (): ClientTool => ({
	name: "host_echo",
	title: "Echo",
	description: "Says the text back.",
	inputSchema: {
		type: "object",
		properties: { text: { type: "string" } },
		required: ["text"],
	},
	usualMode: "auto",
	summarize: (args) => String(args.text ?? ""),
	run: vi.fn(async (args) => ({
		isError: false,
		payload: { echoed: args.text },
	})),
});

/** A tool that changes something: it waits for the user, as `folder_write` says. */
const saveTool = (): ClientTool => ({
	name: "host_save",
	title: "Save",
	description: "Saves the text.",
	inputSchema: { type: "object", properties: {}, required: [] },
	usualMode: "ask",
	modeKey: "folder_write",
	approvalNote: "The user approves each save.",
	run: vi.fn(async () => ({ isError: false, payload: { saved: true } })),
});

/** A host with the given tools for room-1, whose names start `host_`. */
const createHost = (tools: ClientTool[]): ToolsHost => ({
	owns: (name) => name.startsWith("host_"),
	list: (roomId) => (roomId === "room-1" ? tools : []),
	subscribe: () => () => undefined,
	unavailableMessage: "Open this chat in the host.",
});

/** A room with a host, or none. */
const createRoom = (
	mode: "chat" | "agent",
	host: ToolsHost | null,
	defaultTools?: Record<string, string>,
) => {
	const decide = vi.fn(async () => "ok");
	const room = {
		roomId: "room-1",
		insightId: "insight-1",
		mode: mode,
		options: { mcp: [], defaultTools } as Record<string, unknown>,
		toolsHost: host,
		refreshWorkbenchFileExplorer: vi.fn(),
		agentTurns: { getOrCreateAgent: vi.fn(() => ({ decide })) },
	};
	return { room: room as unknown as RoomStore, decide };
};

/** An agent run's paused call to a client tool. */
const pausedTool = (
	room: RoomStore,
	name: string,
	args: Record<string, unknown>,
	meta: Record<string, unknown> = {},
): ToolStore => {
	const action = {
		actionId: `action-${name}`,
		runId: "run-1",
		toolArgs: args,
		editedArgs: null,
	} as unknown as PendingAgentAction;
	return {
		room: room,
		json: {
			name: `__room__${name}`,
			_meta: { SMSS_FUNCTION_NAME: name, ...meta },
		},
		parameters: args,
		pendingAction: action,
	} as unknown as ToolStore;
};

describe("ChatTools client tools", () => {
	test("a chat turn offers the host's tools beside Room Files'", () => {
		const host = createHost([echoTool(), saveTool()]);
		const chatTools = new ChatTools(createRoom("chat", host).room);
		const names = chatTools.chatToolDefinitions.map((tool) => tool.name);

		expect(names).toEqual(
			expect.arrayContaining(["folder_read", "host_echo", "host_save"]),
		);
		const save = chatTools.clientToolDefinitions.find(
			(tool) => tool.name === "host_save",
		);
		expect(save?.description).toBe(
			"Saves the text. The user approves each save.",
		);
	});

	test("no client tools without a host, in an agent turn, or when disabled", () => {
		expect(
			new ChatTools(createRoom("chat", null).room).clientToolDefinitions,
		).toEqual([]);
		const host = createHost([echoTool()]);
		expect(
			new ChatTools(createRoom("agent", host).room).chatToolDefinitions,
		).toEqual([]);
		expect(
			new ChatTools(
				createRoom("chat", host, { host_echo: "disabled" }).room,
			).clientToolDefinitions,
		).toEqual([]);
	});

	test("a tool's mode follows its setting, else its usual way", () => {
		const chatTools = new ChatTools(
			createRoom("chat", createHost([]), { folder_write: "auto" }).room,
		);

		expect(chatTools.getClientToolMode(saveTool())).toBe("auto");
		expect(chatTools.getClientToolMode(echoTool())).toBe("auto");
		expect(
			new ChatTools(
				createRoom("chat", createHost([])).room,
			).getClientToolMode(saveTool()),
		).toBe("ask");
	});

	test("a call runs through the host's tool", async () => {
		const echo = echoTool();
		const { room } = createRoom("chat", createHost([echo]));
		const outcome = await new ChatTools(room).runFolderCall("host_echo", {
			text: "hi",
		});

		expect(outcome).toEqual({ isError: false, payload: { echoed: "hi" } });
		expect(echo.run).toHaveBeenCalledWith({ text: "hi" });
	});

	test("a call to a tool the room does not have says so", async () => {
		const withHost = await new ChatTools(
			createRoom("chat", createHost([])).room,
		).runFolderCall("host_echo", {});
		const withoutHost = await new ChatTools(
			createRoom("chat", null).room,
		).runFolderCall("host_echo", {});

		expect(withHost).toMatchObject({
			isError: true,
			payload: { error: "Open this chat in the host." },
		});
		expect(String(withoutHost.payload.error)).toContain(
			"only in the app it was offered in",
		);
	});

	test("an agent run's auto call is answered at once, and only once", async () => {
		const { room, decide } = createRoom("agent", createHost([echoTool()]));
		const chatTools = new ChatTools(room);
		const tool = pausedTool(room, "host_echo", { text: "hi" });

		chatTools.answerAgentClientCalls([tool]);
		chatTools.answerAgentClientCalls([tool]);
		await vi.waitFor(() => expect(decide).toHaveBeenCalled());

		expect(decide).toHaveBeenCalledTimes(1);
		expect(decide).toHaveBeenCalledWith(tool.pendingAction, "respond", {
			echoed: "hi",
		});
	});

	test("an agent run's call that asks waits for the user, then runs when allowed", async () => {
		const save = saveTool();
		const { room, decide } = createRoom("agent", createHost([save]));
		const chatTools = new ChatTools(room);
		const tool = pausedTool(room, "host_save", {});

		chatTools.answerAgentClientCalls([tool]);
		await Promise.resolve();
		expect(decide).not.toHaveBeenCalled();

		await chatTools.approveChatTool(tool);

		expect(save.run).toHaveBeenCalled();
		expect(decide).toHaveBeenCalledWith(tool.pendingAction, "respond", {
			saved: true,
		});
	});

	test("a client call no host here can run is answered, so the run goes on", async () => {
		const { room, decide } = createRoom("agent", null);
		const tool = pausedTool(
			room,
			"desktop_write",
			{},
			{ SMSS_CLIENT_TOOL: true },
		);

		new ChatTools(room).answerAgentClientCalls([tool]);
		await vi.waitFor(() => expect(decide).toHaveBeenCalled());

		const [, , payload] = decide.mock.calls[0] as unknown as [
			unknown,
			string,
			Record<string, unknown>,
		];
		expect(String(payload.error)).toContain(
			"only in the app it was offered in",
		);
	});

	test("a host's call is decorated with its title, summary and the room's setting", () => {
		const { room } = createRoom(
			"chat",
			createHost([echoTool(), saveTool()]),
		);
		const chatTools = new ChatTools(room);
		const call = (name: string) => ({
			id: "call-1",
			type: "function",
			name: name,
			arguments: { text: "hi" },
			_tool_found: false,
			original_name: name,
			description: "",
		});

		expect(chatTools.decorateToolCall(call("host_echo"))).toMatchObject({
			title: "Echo",
			description: "hi",
			_meta: { SMSS_MCP_EXECUTION: "auto", SMSS_CLIENT_TOOL: true },
		});
		expect(
			chatTools.decorateToolCall(call("host_save"))._meta,
		).toMatchObject({ SMSS_MCP_EXECUTION: "ask", SMSS_CLIENT_TOOL: true });
		// a past call to a tool the host has not loaded still renders as its own
		expect(chatTools.decorateToolCall(call("host_gone"))).toMatchObject({
			title: "host_gone",
			_meta: { SMSS_MCP_EXECUTION: "ask", SMSS_CLIENT_TOOL: true },
		});
	});
});
