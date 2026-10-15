import { runInAction } from "mobx";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RoomStore } from "@/stores/room/room.store";
import { readRoomToolFile } from "@/stores/room/room-tool-file";
import {
	readUserConnectorTools,
	syncRoomConnectorTools,
	writeUserConnectorTools,
} from "./connector-tools";
import { ConnectorsStore } from "./connectors.store";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	getI18n: () => ({ t: (key: string) => key }),
}));

// the user's connector file comes from the server, and so does the room's
// tool file, which the tests leave out. The session's logins come from the
// SDK, which the tests set through setSessionLogins.
vi.mock("@/stores/room/room-tool-file", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/stores/room/room-tool-file")>()),
	readRoomToolFile: vi.fn(async () => null),
	saveRoomToolFile: vi.fn(async () => undefined),
}));

vi.mock("./connector-tools", async (importOriginal) => {
	const catalog = await import("./connector.catalog");
	return {
		...(await importOriginal<typeof import("./connector-tools")>()),
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

/** A room with just what the connectors store reaches for. */
const createRoom = () => {
	const room = {
		roomId: "room-1",
		insightId: "insight-1",
		syncRoomOptions: vi.fn(async () => undefined),
		openSidebarPanel: vi.fn(),
	};
	return room as unknown as RoomStore;
};

describe("ConnectorsStore", () => {
	let connectors: ConnectorsStore;

	beforeEach(() => {
		connectors = new ConnectorsStore(createRoom());
	});

	test("takes the user's saved connectors and brings this room's copy up to date", async () => {
		const room = createRoom();
		connectors = new ConnectorsStore(room);
		const saved = await writeUserConnectorTools(["outlook", "teams"]);
		await connectors.applyUserConnectorTools(saved);

		expect(syncRoomConnectorTools).toHaveBeenLastCalledWith(room, saved);
		expect(connectors.services).toEqual(["outlook", "teams"]);
		expect(connectors.isSavingConnectors).toBe(false);
	});

	test("a new chat's draft only takes the user's connectors", async () => {
		vi.mocked(syncRoomConnectorTools).mockClear();
		const draft = createRoom();
		(draft as unknown as { insightId: string }).insightId = "new";
		connectors = new ConnectorsStore(draft);
		await connectors.applyUserConnectorTools(
			await writeUserConnectorTools(["gmail"]),
		);

		expect(connectors.services).toEqual(["gmail"]);
		expect(syncRoomConnectorTools).not.toHaveBeenCalled();
	});

	test("copies the user's connectors into a room when it loads, and into a new one before its first message", async () => {
		const tools = await writeUserConnectorTools(["gmail"]);
		vi.mocked(readUserConnectorTools).mockResolvedValue(tools);
		vi.mocked(syncRoomConnectorTools).mockClear();
		try {
			const room = createRoom();
			connectors = new ConnectorsStore(room);
			await connectors.restore();
			expect(connectors.services).toEqual(["gmail"]);
			expect(syncRoomConnectorTools).toHaveBeenCalledWith(room, tools);

			vi.mocked(syncRoomConnectorTools).mockClear();
			const created = new ConnectorsStore(createRoom());
			await created.restore({ isNew: true });
			expect(syncRoomConnectorTools).not.toHaveBeenCalled();
			await created.adopt(connectors);
			expect(syncRoomConnectorTools).toHaveBeenCalledTimes(1);
		} finally {
			vi.mocked(readUserConnectorTools).mockResolvedValue(null);
		}
	});

	test("reads the tool file of a room it loads, but not of one just created", async () => {
		const room = createRoom();
		connectors = new ConnectorsStore(room);

		vi.mocked(readRoomToolFile).mockClear();
		await connectors.restore({ isNew: true });
		expect(readRoomToolFile).not.toHaveBeenCalled();

		await connectors.restore();
		expect(readRoomToolFile).toHaveBeenCalledWith(room);
	});

	test("opens a viewer in the sidebar under its name", () => {
		const room = createRoom();
		const store = new ConnectorsStore(room);
		store.openSourcePanel("teams-channels");
		expect(room.openSidebarPanel).toHaveBeenCalledWith(
			"room-teams-channels",
			{},
			"connectors:services.teamsChannels",
		);
	});

	test("offers a viewer only once its connector is on and its account signed in", async () => {
		await connectors.applyUserConnectorTools(
			await writeUserConnectorTools(["onedrive", "teams", "gmail"]),
		);
		expect(
			connectors.availableSources.map((source) => source.service),
		).toEqual([
			"onedrive",
			"teams-channels",
			"teams-files",
			"teams-chats",
			"gmail",
		]);

		runInAction(() => {
			connectors.connectedProviders = ["MICROSOFT"];
		});
		expect(
			connectors.availableSources.some(
				(source) => source.provider === "GOOGLE",
			),
		).toBe(false);
	});

	test("takes the session's sign ins from the SDK, leaving an unchanged answer alone", () => {
		const store = new ConnectorsStore(createRoom());
		const connectorAccess = { MICROSOFT: { outlook: true } };
		store.setSessionLogins({
			logins: { NATIVE: "Ada", MICROSOFT: "Ada" },
			connectorAccess: connectorAccess,
			availableProviders: [{ provider: "ms", isOauth: true }],
		});
		expect(store.connectedProviders).toEqual(["MICROSOFT"]);
		expect(store.offeredProviders).toEqual(["MICROSOFT"]);

		const connected = store.connectedProviders;
		const offered = store.offeredProviders;
		store.setSessionLogins({
			logins: { MICROSOFT: "Ada" },
			connectorAccess: null,
			availableProviders: [{ provider: "ms", isOauth: true }],
		});
		expect(store.connectedProviders).toBe(connected);
		expect(store.offeredProviders).toBe(offered);
		// a config that no longer says keeps what it said
		expect(store.connectorAccess).toBe(connectorAccess);

		store.setSessionLogins({
			logins: null,
			connectorAccess: undefined,
			availableProviders: undefined,
		});
		expect(store.connectedProviders).toBeNull();
		expect(store.offeredProviders).toBe(offered);
	});

	test("asks for a sign in when a switched on connector's account is not signed in", async () => {
		await connectors.applyUserConnectorTools(
			await writeUserConnectorTools(["outlook", "gmail"]),
		);
		expect(connectors.missingSignIns).toEqual([]);

		runInAction(() => {
			connectors.connectedProviders = ["GOOGLE"];
		});
		expect(connectors.missingSignIns).toEqual(["MICROSOFT"]);

		connectors.dismissSignIn("MICROSOFT");
		expect(connectors.missingSignIns).toEqual([]);
	});

	test("hides viewers and flags connectors the server says the sign in cannot cover", async () => {
		await connectors.applyUserConnectorTools(
			await writeUserConnectorTools(["outlook", "gmail"]),
		);
		runInAction(() => {
			connectors.connectorAccess = {
				MICROSOFT: { outlook: true, calendar: false },
				GOOGLE: { gmail: false },
			};
		});

		expect(
			connectors.availableSources.map((source) => source.service),
		).toEqual(["outlook-mail"]);
		expect(connectors.uncoveredConnectors).toEqual([
			{ providerId: "GOOGLE", services: ["gmail"] },
		]);

		connectors.dismissScopeNotice("GOOGLE");
		expect(connectors.uncoveredConnectors).toEqual([]);
	});

	test("does not ask for a sign in the server does not offer", async () => {
		await connectors.applyUserConnectorTools(
			await writeUserConnectorTools(["gmail"]),
		);
		runInAction(() => {
			connectors.connectedProviders = [];
			connectors.offeredProviders = ["MICROSOFT"];
		});
		expect(connectors.missingSignIns).toEqual([]);
		expect(connectors.unofferedProviders).toEqual(["GOOGLE"]);
		expect(connectors.availableSources).toEqual([]);
	});
});
