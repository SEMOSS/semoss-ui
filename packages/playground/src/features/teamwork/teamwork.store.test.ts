import { runInAction } from "mobx";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RoomStore } from "@/stores/room/room.store";
import type { PixelMessageToolCallPart } from "@/types";
import {
	readUserConnectorTools,
	syncRoomConnectorTools,
	writeUserConnectorTools,
} from "./connectors/connectors.api";
import { TeamworkStore } from "./teamwork.store";
import { FOLDER_TOOL_NAMES } from "./tools/folder-tools";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	getI18n: () => ({ t: (key: string) => key }),
}));

// the session's logins, its login settings, and the user's connector file
// come from the server; the room's tool file is read through the room, which
// the tests stand in for
vi.mock("./connectors/connectors.api", async (importOriginal) => {
	const catalog = await import("./connectors/connector.catalog");
	return {
		...(await importOriginal<
			typeof import("./connectors/connectors.api")
		>()),
		getSessionLogins: vi.fn(async () => ({})),
		readSessionLoginConfig: vi.fn(async () => ({
			connectorAccess: null,
			availableProviders: null,
		})),
		readUserConnectorTools: vi.fn(async () => null),
		// the tools the backend writes for the services switched on
		writeUserConnectorTools: vi.fn(async (services: readonly string[]) =>
			catalog.CONNECTOR_SERVICES.filter((service) =>
				services.includes(service.id),
			).flatMap((service) =>
				service.tools.map((tool) => ({
					name: tool.reactor,
					_meta: {
						SMSS_FUNCTION_NAME: tool.reactor,
						SMSS_MCP_EXECUTION: tool.execution,
						SMSS_MCP_GENERATOR: catalog.CONNECTORS_GENERATOR,
					},
				})),
			),
		),
		syncRoomConnectorTools: vi.fn(async () => undefined),
	};
});

type ToolCall = PixelMessageToolCallPart["toolCall"];

/** A room with just what the teamwork store reaches for. */
const createRoom = (
	runRoomPixel: (pixel: string) => Promise<unknown> = async () => ({
		errors: [],
		insightId: "insight-1",
		pixelReturn: [{ output: [] }],
	}),
	mode: "chat" | "agent" = "chat",
) => {
	const layout = { actions: { findPanels: () => [], closePanel: vi.fn() } };
	const room = {
		roomId: "room-1",
		insightId: "insight-1",
		mode: mode,
		options: { mcp: [] } as Record<string, unknown>,
		setOptions: vi.fn((options: Record<string, unknown>) => {
			room.options = { ...room.options, ...options };
		}),
		runRoomPixel: vi.fn(runRoomPixel),
		syncRoomOptions: vi.fn(async () => undefined),
		refreshSidebarFileExplorer: vi.fn(),
		openSidebarPanel: vi.fn(),
		workbench: { getState: () => ({ layout: layout }) },
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

describe("TeamworkStore", () => {
	let teamwork: TeamworkStore;

	beforeEach(() => {
		teamwork = new TeamworkStore(createRoom());
	});

	test("a chat turn carries every default tool the room does not disable", () => {
		const room = createRoom();
		teamwork = new TeamworkStore(room);
		const names = () =>
			(teamwork.chatParamValues.tools as { name: string }[]).map(
				(tool) => tool.name,
			);
		expect(names()).toEqual(Object.values(FOLDER_TOOL_NAMES));
		const [list] = teamwork.chatParamValues.tools as {
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

	test("takes the user's saved connectors and brings this room's copy up to date", async () => {
		const room = createRoom();
		teamwork = new TeamworkStore(room);
		const saved = await writeUserConnectorTools(["outlook", "teams"]);
		await teamwork.applyUserConnectorTools(saved);

		expect(syncRoomConnectorTools).toHaveBeenLastCalledWith(room, saved);
		expect(teamwork.connectors).toEqual(["outlook", "teams"]);
		expect(teamwork.isSavingConnectors).toBe(false);
	});

	test("a new chat's draft only takes the user's connectors", async () => {
		vi.mocked(syncRoomConnectorTools).mockClear();
		const draft = createRoom();
		(draft as unknown as { insightId: string }).insightId = "new";
		teamwork = new TeamworkStore(draft);
		await teamwork.applyUserConnectorTools(
			await writeUserConnectorTools(["gmail"]),
		);

		expect(teamwork.connectors).toEqual(["gmail"]);
		expect(syncRoomConnectorTools).not.toHaveBeenCalled();
	});

	test("copies the user's connectors into a room when it loads, and into a new one before its first message", async () => {
		const tools = await writeUserConnectorTools(["gmail"]);
		vi.mocked(readUserConnectorTools).mockResolvedValue(tools);
		vi.mocked(syncRoomConnectorTools).mockClear();
		try {
			const room = createRoom();
			teamwork = new TeamworkStore(room);
			await teamwork.restore();
			expect(teamwork.connectors).toEqual(["gmail"]);
			expect(syncRoomConnectorTools).toHaveBeenCalledWith(room, tools);

			vi.mocked(syncRoomConnectorTools).mockClear();
			const created = new TeamworkStore(createRoom());
			await created.restore({ isNew: true });
			expect(syncRoomConnectorTools).not.toHaveBeenCalled();
			await created.adopt(teamwork);
			expect(syncRoomConnectorTools).toHaveBeenCalledTimes(1);
		} finally {
			vi.mocked(readUserConnectorTools).mockResolvedValue(null);
		}
	});

	test("reads the tool file of a room it loads, but not of one just created", async () => {
		const room = createRoom();
		teamwork = new TeamworkStore(room);

		await teamwork.restore({ isNew: true });
		expect(room.runRoomPixel).not.toHaveBeenCalled();

		await teamwork.restore();
		expect(room.runRoomPixel).toHaveBeenCalledWith(
			expect.stringContaining("/mcp/pixel_mcp.json"),
			false,
			false,
			false,
		);
	});

	test("an agent room sends no folder tools", () => {
		teamwork = new TeamworkStore(createRoom(undefined, "agent"));
		expect(teamwork.chatToolDefinitions).toEqual([]);
		expect(teamwork.chatParamValues).toEqual({});
	});

	test("the room folder never lists or touches the chat's tool settings", async () => {
		const room = createRoom(async (pixel) => ({
			errors: [],
			insightId: "insight-1",
			pixelReturn: [
				{
					output: pixel.startsWith("BrowseInsightAssets")
						? [
								{ name: "mcp", type: "directory" },
								{ name: "notes.md", type: "file" },
							]
						: [],
				},
			],
		}));
		const store = new TeamworkStore(room);
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
				.mock.calls.some(([pixel]) =>
					String(pixel).includes("pixel_mcp.json"),
				),
		).toBe(false);
	});

	test("a chat folder call runs the way the room's settings say", () => {
		const read = teamwork.decorateToolCall(
			toolCall(FOLDER_TOOL_NAMES.READ),
		);
		expect(read._meta?.SMSS_MCP_EXECUTION).toBe("auto");
		expect(read._meta?.SMSS_CLIENT_TOOL).toBe(true);
		expect(read.title).toBe(
			`teamwork:tools.titles.${FOLDER_TOOL_NAMES.READ}`,
		);

		const write = teamwork.decorateToolCall(
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
		teamwork = new TeamworkStore(room);
		expect(
			teamwork.decorateToolCall(toolCall(FOLDER_TOOL_NAMES.WRITE))._meta
				?.SMSS_MCP_EXECUTION,
		).toBe("auto");
		expect(
			teamwork.decorateToolCall(toolCall(FOLDER_TOOL_NAMES.READ))._meta
				?.SMSS_MCP_EXECUTION,
		).toBe("ask");
	});

	test("a connector call that asks opens inline", () => {
		const call = teamwork.decorateToolCall(
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
		expect(teamwork.decorateToolCall(call)).toBe(call);
	});

	test("refuses a default tool the room's settings disable", async () => {
		const room = createRoom();
		room.setOptions({
			defaultTools: { [FOLDER_TOOL_NAMES.READ]: "disabled" },
		});
		teamwork = new TeamworkStore(room);
		const refused = await teamwork.runFolderCall(FOLDER_TOOL_NAMES.READ, {
			path: "a.md",
		});
		expect(refused.isError).toBe(true);
		expect(String(refused.payload.error)).toContain("disabled");
		expect(room.runRoomPixel).not.toHaveBeenCalled();
	});

	test("a change a folder tool makes refreshes Chat Files", async () => {
		const room = createRoom(async () => ({
			errors: [],
			insightId: "insight-1",
			pixelReturn: [{ output: [] }],
		}));
		teamwork = new TeamworkStore(room);
		const outcome = await teamwork.runFolderCall(FOLDER_TOOL_NAMES.WRITE, {
			path: "notes.md",
			content: "hello",
		});
		expect(outcome.isError).toBe(false);
		expect(room.refreshSidebarFileExplorer).toHaveBeenCalled();
	});

	test("queues a saved file for the next message once", () => {
		const file = {
			path: "/Email - Budget.md",
			name: "Email - Budget.md",
			service: "outlook-mail" as const,
		};
		teamwork.addContextItem(file);
		teamwork.addContextItem(file);
		expect(teamwork.contextItems).toEqual([
			{
				id: "/Email - Budget.md",
				name: "Email - Budget.md",
				path: "/Email - Budget.md",
				service: "outlook-mail",
			},
		]);

		teamwork.removeContextItem("/Email - Budget.md");
		expect(teamwork.contextItems).toEqual([]);
	});

	test("puts taken files back ahead of newer ones when a send fails", () => {
		teamwork.addContextItem({
			path: "q3.xlsx",
			name: "q3.xlsx",
			service: "onedrive",
		});
		const taken = teamwork.takeContextItems();
		expect(teamwork.contextItems).toEqual([]);

		teamwork.addContextItem({
			path: "deck.pptx",
			name: "deck.pptx",
			service: "teams-files",
		});
		teamwork.restoreContextItems(taken);
		expect(teamwork.contextItems.map((item) => item.path)).toEqual([
			"q3.xlsx",
			"deck.pptx",
		]);
	});

	test("opens a viewer in the sidebar under its name", () => {
		const room = createRoom();
		const store = new TeamworkStore(room);
		store.openSourcePanel("teams-channels");
		expect(room.openSidebarPanel).toHaveBeenCalledWith(
			"room-teams-channels",
			{},
			"connectors:services.teamsChannels",
		);
	});

	test("offers a viewer only once its connector is on and its account signed in", async () => {
		await teamwork.applyUserConnectorTools(
			await writeUserConnectorTools(["onedrive", "teams", "gmail"]),
		);
		expect(
			teamwork.availableSources.map((source) => source.service),
		).toEqual([
			"onedrive",
			"teams-channels",
			"teams-files",
			"teams-chats",
			"gmail",
		]);

		runInAction(() => {
			teamwork.connectedProviders = ["MICROSOFT"];
		});
		expect(
			teamwork.availableSources.some(
				(source) => source.provider === "GOOGLE",
			),
		).toBe(false);
	});

	test("asks for a sign in when a switched on connector's account is not signed in", async () => {
		await teamwork.applyUserConnectorTools(
			await writeUserConnectorTools(["outlook", "gmail"]),
		);
		expect(teamwork.missingSignIns).toEqual([]);

		runInAction(() => {
			teamwork.connectedProviders = ["GOOGLE"];
		});
		expect(teamwork.missingSignIns).toEqual(["MICROSOFT"]);

		teamwork.dismissSignIn("MICROSOFT");
		expect(teamwork.missingSignIns).toEqual([]);
	});

	test("hides viewers and flags connectors the server says the sign in cannot cover", async () => {
		await teamwork.applyUserConnectorTools(
			await writeUserConnectorTools(["outlook", "gmail"]),
		);
		runInAction(() => {
			teamwork.connectorAccess = {
				MICROSOFT: { outlook: true, calendar: false },
				GOOGLE: { gmail: false },
			};
		});

		expect(
			teamwork.availableSources.map((source) => source.service),
		).toEqual(["outlook-mail"]);
		expect(teamwork.uncoveredConnectors).toEqual([
			{ providerId: "GOOGLE", services: ["gmail"] },
		]);

		teamwork.dismissScopeNotice("GOOGLE");
		expect(teamwork.uncoveredConnectors).toEqual([]);
	});

	test("does not ask for a sign in the server does not offer", async () => {
		await teamwork.applyUserConnectorTools(
			await writeUserConnectorTools(["gmail"]),
		);
		runInAction(() => {
			teamwork.connectedProviders = [];
			teamwork.offeredProviders = ["MICROSOFT"];
		});
		expect(teamwork.missingSignIns).toEqual([]);
		expect(teamwork.unofferedProviders).toEqual(["GOOGLE"]);
		expect(teamwork.availableSources).toEqual([]);
	});
});
