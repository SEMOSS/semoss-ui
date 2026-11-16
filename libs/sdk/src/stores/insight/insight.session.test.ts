import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../../env";
import type { RoomOptions } from "../../types";

const {
	mockGetSystemConfig,
	mockGetRoomForInsight,
	mockGetRoomOptions,
	mockSetRoomForInsight,
	mockCreateRoom,
	mockLogin,
	mockLogout,
	mockRunPixel,
	session,
} = vi.hoisted(() => ({
	mockGetSystemConfig: vi.fn(),
	mockGetRoomForInsight: vi.fn(),
	mockGetRoomOptions: vi.fn(),
	mockSetRoomForInsight: vi.fn(),
	mockCreateRoom: vi.fn(),
	mockLogin: vi.fn(),
	mockLogout: vi.fn(),
	mockRunPixel: vi.fn(),
	session: {
		getSnapshot: vi.fn(() => ({ status: "AUTHENTICATED" })),
		subscribe: vi.fn(() => () => {}),
		refresh: vi.fn(),
		logins: { seed: vi.fn(), reset: vi.fn(), refresh: vi.fn() },
	},
}));

vi.mock("../../api", () => ({
	getSystemConfig: mockGetSystemConfig,
	getRoomForInsight: mockGetRoomForInsight,
	getRoomOptions: mockGetRoomOptions,
	setRoomForInsight: mockSetRoomForInsight,
	login: mockLogin,
	logout: mockLogout,
	runPixel: mockRunPixel,
}));

vi.mock("../room", async (importOriginal) => ({
	...(await importOriginal<typeof import("../room")>()),
	createRoom: mockCreateRoom,
}));

vi.mock("../session/session.store", () => ({ Session: session }));

import { Config } from "../config/config.store";
import { RoomStore } from "../room/room.store";
import { InsightStore } from "./insight.store";

const backendConfig = (logins: Record<string, string>) => ({
	logins,
	availableProviders: [],
	theme: {},
	databaseMetaKeys: [
		{ metakey: "b", display_order: 2 },
		{ metakey: "a", display_order: 1 },
	],
});

const ROOM_OPTIONS: RoomOptions = {
	predefinedPrompts: [],
	instructions: "",
	mcp: [],
	modelId: "",
};

describe("InsightStore baseline lifecycle", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		Config.reset();
		Env.update({
			MODULE: "http://localhost/Monolith",
			APP: "",
			ACCESS_KEY: "",
			SECRET_KEY: "",
			TOOL: null,
		});
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockGetRoomOptions.mockResolvedValue(ROOM_OPTIONS);
		mockRunPixel.mockResolvedValue({
			insightId: "insight-1",
			errors: [],
			pixelReturn: [],
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("shares the normalized config without subscribing to the frontend session", async () => {
		const first = new InsightStore();
		const second = new InsightStore();
		await Promise.all([first.initialize(), second.initialize()]);

		expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
		expect(first.system?.config.databaseMetaKeys).toEqual([
			{ metakey: "a", display_order: 1 },
			{ metakey: "b", display_order: 2 },
		]);
		expect(session.logins.seed).toHaveBeenCalled();
		expect(session.getSnapshot).not.toHaveBeenCalled();
		expect(session.subscribe).not.toHaveBeenCalled();
	});

	it("keeps its own login and logout explicit without refreshing Session", async () => {
		mockGetSystemConfig.mockResolvedValueOnce(backendConfig({}));
		mockLogin.mockResolvedValue(true);
		mockLogout.mockResolvedValue(true);
		const insight = new InsightStore();
		await insight.initialize();
		expect(insight.isAuthorized).toBe(false);

		await insight.actions.login({
			type: "native",
			username: "test-user",
			password: "test-password",
		});
		expect(insight.isReady).toBe(true);
		await insight.actions.logout();

		expect(insight.isAuthorized).toBe(false);
		expect(insight.insightId).toBe("");
		expect(session.refresh).not.toHaveBeenCalled();
		expect(session.subscribe).not.toHaveBeenCalled();
	});

	it("destroys its workspace only when explicitly requested", async () => {
		const insight = new InsightStore();
		await insight.initialize({ insightId: "owned-insight" });
		expect(mockRunPixel).not.toHaveBeenCalled();

		await insight.destroy();

		expect(mockRunPixel).toHaveBeenCalledWith(
			"DropInsight()",
			"owned-insight",
		);
		expect(insight.isInitialized).toBe(false);
		expect(insight.isReady).toBe(false);
		expect(session.subscribe).not.toHaveBeenCalled();
	});

	it("looks up and caches an existing room", async () => {
		mockGetRoomForInsight.mockResolvedValue({
			roomId: "room-1",
			name: "Room",
		});
		const insight = new InsightStore();
		await insight.initialize({ insightId: "workspace" });

		const room = await insight.actions.getRoom();

		expect(room?.roomId).toBe("room-1");
		expect(room?.insightId).toBe("workspace");
		expect(await insight.actions.getRoom()).toBe(room);
		expect(mockGetRoomForInsight).toHaveBeenCalledTimes(1);
		expect(mockGetRoomOptions).toHaveBeenCalledWith("workspace", "room-1");
	});

	it("uses the tool's room before looking up another room", async () => {
		Env.update({
			TOOL: {
				type: "MCP",
				message: "",
				id: "tool",
				name: "Tool",
				parameters: {},
				roomId: "tool-room",
				original_name: "Tool",
			},
		});
		const insight = new InsightStore();
		await insight.initialize({ insightId: "workspace" });

		expect((await insight.actions.getRoom())?.roomId).toBe("tool-room");
		expect(mockSetRoomForInsight).toHaveBeenCalledWith(
			"workspace",
			"tool-room",
		);
		expect(mockGetRoomForInsight).not.toHaveBeenCalled();
	});

	it("creates and caches a room when none is bound", async () => {
		mockGetRoomForInsight.mockResolvedValue(null);
		const created = new RoomStore(
			"created-room",
			"workspace",
			ROOM_OPTIONS,
		);
		mockCreateRoom.mockResolvedValue(created);
		const insight = new InsightStore();
		await insight.initialize({ insightId: "workspace" });

		expect(await insight.actions.getRoom()).toBe(created);
		expect(await insight.actions.getRoom()).toBe(created);
		expect(mockCreateRoom).toHaveBeenCalledExactlyOnceWith("workspace");
	});

	it("returns no room only when room handling is disabled", async () => {
		const insight = new InsightStore();
		await insight.initialize({ insightId: "workspace", disableRoom: true });

		expect(await insight.actions.getRoom()).toBeNull();
		expect(mockGetRoomForInsight).not.toHaveBeenCalled();
		expect(mockCreateRoom).not.toHaveBeenCalled();
	});
});
