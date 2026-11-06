import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "../../api/base";
import type { RoomEngine } from "./room-engine.store";
import { type ChatPreferencesAdapter, RoomsClient } from "./rooms-client.store";

vi.mock("../../api/base", () => ({
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	getPixelJobStreaming: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	console: vi.fn(),
}));

const session = vi.hoisted(() => ({
	run: vi.fn(),
	user: {
		lastLogin: "login-1",
		defaultModels: { textGeneration: "", codeGeneration: "" },
	} as {
		lastLogin: string;
		defaultModels: { textGeneration: string; codeGeneration: string };
	},
}));

vi.mock("../session/session.store", () => ({
	Session: {
		insight: { run: session.run },
		getSnapshot: () => ({ status: "AUTHENTICATED", user: session.user }),
	},
}));

const mockRunPixel = vi.mocked(runPixel);

/** A run answer with one statement per output. */
const answer = (outputs: unknown[], insightId = "insight-1") => ({
	errors: [],
	insightId: insightId,
	pixelReturn: outputs.map((output) => ({
		isMeta: false,
		operationType: ["OPERATION"],
		output: output,
		pixelExpression: "",
		pixelId: "",
		timeToRun: 0,
	})),
});

const models = [
	{ engine_id: "a", engine_name: "A", engine_type: "MODEL" as const },
	{ engine_id: "b", engine_name: "B", engine_type: "MODEL" as const },
];

describe("RoomsClient", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		session.user.defaultModels.textGeneration = "";
	});

	it("creates a room in a fresh insight and shows it before it is listed", async () => {
		mockRunPixel.mockResolvedValueOnce(
			answer([{ roomId: "room-1" }], "room-insight") as Awaited<
				ReturnType<typeof runPixel>
			>,
		);
		const client = new RoomsClient();
		const room = await client.createRoomShell("chat", "Plan a trip");

		expect(mockRunPixel).toHaveBeenCalledWith(
			"CreatePlaygroundRoom()",
			"new",
		);
		expect(room.roomId).toBe("room-1");
		expect(room.insightId).toBe("room-insight");
		expect(room.metadata.name).toBe("Plan a trip");

		const before = client.roomsVersion;
		client.registerRoom(room);
		client.addOptimisticRoom({
			ROOM_ID: "room-1",
			ROOM_NAME: "Plan a trip",
			DATE_CREATED: "",
		});
		expect(client.getCachedRoom("room-1")).toBe(room);
		expect(Object.keys(client.optimisticRooms)).toEqual(["room-1"]);
		client.removeOptimisticRoom("room-1");
		expect(client.optimisticRooms).toEqual({});
		client.bumpRoomsVersion();
		expect(client.roomsVersion).toBe(before + 1);
	});

	it("closes a room: forgets it in the session and drops its insight", async () => {
		session.run.mockResolvedValue(answer([true]));
		mockRunPixel.mockResolvedValue(
			answer([{}]) as Awaited<ReturnType<typeof runPixel>>,
		);
		const client = new RoomsClient();
		client.registerRoom({
			roomId: "room-1",
			insightId: "room-insight",
		} as RoomEngine);

		await client.closeRoom("room-1");

		expect(session.run).toHaveBeenCalledWith(
			'RemoveUserRoom(roomId=["room-1"]);',
		);
		expect(mockRunPixel).toHaveBeenCalledWith(
			"DropInsight()",
			"room-insight",
		);
		expect(client.getCachedRoom("room-1")).toBeNull();
	});

	it("lists only the rooms in the host's scope", async () => {
		session.run.mockResolvedValue(answer([[]]));
		const client = new RoomsClient({
			engine: { roomScope: { token: "scope:widget" } },
		});
		await client.listRooms({ limit: 10, offset: 0 });
		expect(session.run).toHaveBeenCalledWith(
			'META | GetPlaygroundRooms(roomOptionsSearch="scope:widget", limit=10, offset=0, sort=["DESC"]);',
		);
	});

	it("restores the model picked earlier in the same login", async () => {
		session.run.mockResolvedValue(answer([models]));
		const preferences: ChatPreferencesAdapter = {
			readSelectedModel: () => ({
				model: models[1],
				lastLogin: "login-1",
			}),
			writeSelectedModel: vi.fn(),
		};
		const client = new RoomsClient({
			enableModelSelect: true,
			preferences: preferences,
		});
		await client.initialize();
		expect(client.models.selected.engine_id).toBe("b");
		expect(client.isInitialized).toBe(true);
	});

	it("prefers the profile default model, and follows it when it changes", async () => {
		session.user.defaultModels.textGeneration = "a";
		session.run.mockResolvedValue(answer([models]));
		const client = new RoomsClient({ enableModelSelect: true });
		await client.initialize();
		expect(client.models.selected.engine_id).toBe("a");

		client.applyProfileDefaultModel("b");
		expect(client.models.selected.engine_id).toBe("b");
	});
});
