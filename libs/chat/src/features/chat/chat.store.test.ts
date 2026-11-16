import { beforeEach, expect, test, vi } from "vitest";
import type { Engine } from "../../types";
import { DEFAULT_CHAT_THEME } from "../chat-config/chat-theme";
import { ChatStore } from "./chat.store";

const mocks = vi.hoisted(() => {
	const user = (defaultModelId: string) => ({
		id: "user-1",
		name: "Tester",
		lastLogin: "2026-11-10",
		meta: defaultModelId
			? { "playground--default-input-text-model": [defaultModelId] }
			: {},
		// the platform's default, which the playground does not read
		defaultModels: { textGeneration: "model-a", codeGeneration: "" },
	});
	return {
		user,
		snapshot: { status: "AUTHENTICATED", user: user("model-b") },
		run: vi.fn(),
		pinUserRoom: vi.fn(),
		renameUserRoom: vi.fn(),
	};
});

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	pinUserRoom: mocks.pinUserRoom,
	renameUserRoom: mocks.renameUserRoom,
	getModelContextWindow: async () => 4096,
}));

vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	// the page's session: a signed in user whose new chat default is model-b
	Session: {
		getSnapshot: () => mocks.snapshot,
		insight: {
			run: mocks.run,
			withInsight: <R>(task: (insightId: string) => Promise<R>) =>
				task("session-insight"),
		},
	},
}));

const MODELS: Engine[] = [
	{ engine_id: "model-a", engine_name: "A", engine_type: "MODEL" },
	{ engine_id: "model-b", engine_name: "B", engine_type: "MODEL" },
	{ engine_id: "model-c", engine_name: "C", engine_type: "MODEL" },
];

/** Answer each pixel the store runs in the session's insight. */
const answer = (pixel: string) => {
	if (pixel.includes("MyEngines")) {
		return { errors: [], pixelReturn: [{ output: MODELS }] };
	}
	if (pixel.includes("GetContextWindow")) {
		return { errors: [], pixelReturn: [{ output: 4096 }] };
	}
	if (pixel.includes("PinRoom")) {
		return { errors: ["Room not found"], pixelReturn: [] };
	}
	return { errors: [], pixelReturn: [{ output: true }] };
};

beforeEach(() => {
	mocks.snapshot = { status: "AUTHENTICATED", user: mocks.user("model-b") };
	mocks.pinUserRoom
		.mockReset()
		.mockRejectedValue(new Error("Room not found"));
	mocks.renameUserRoom.mockReset().mockResolvedValue(undefined);
	mocks.run
		.mockReset()
		.mockImplementation(async (pixel: string) => answer(pixel));
});

const createStore = async () => {
	const store = new ChatStore(DEFAULT_CHAT_THEME, {});
	await store.initialize();
	return store;
};

test("reads the user's new chat default model from the session", async () => {
	const store = await createStore();

	expect(store.models.selected.engine_id).toBe("model-b");
	// the user is not read again: only the models and the context window are
	for (const [pixel] of mocks.run.mock.calls) {
		expect(pixel).not.toMatch(/GetUserInfo|GetUserMetadata/);
	}
});

test("falls back to the deployment's default, then the first model", async () => {
	mocks.snapshot = { status: "AUTHENTICATED", user: mocks.user("gone") };
	const theme = DEFAULT_CHAT_THEME;
	const store = new ChatStore(
		{
			...theme,
			defaultRoomSettings: {
				model: MODELS[2],
			},
		},
		{},
	);
	await store.initialize();

	expect(store.models.selected.engine_id).toBe("model-c");

	const plain = await createStore();

	expect(plain.models.selected.engine_id).toBe("model-a");
});

test("selects the new chat default when nothing else names a model", async () => {
	const store = await createStore();
	store.setSelectedModel(MODELS[2]);

	store.selectNewChatDefaultModel();

	expect(store.models.selected.engine_id).toBe("model-b");
});

test("room calls run in the session's insight, and their errors reject", async () => {
	const store = await createStore();

	await expect(store.pinRoom("room-1", true)).rejects.toThrow(
		"Room not found",
	);
	await expect(
		store.renameRoom("room-1", "  Renamed "),
	).resolves.toBeUndefined();
	expect(mocks.renameUserRoom).toHaveBeenCalledWith(
		"session-insight",
		"room-1",
		"Renamed",
	);
});

test("a cached room replaces the rooms map and bumps nothing else", async () => {
	const store = await createStore();
	const listener = vi.fn();
	store.subscribe(listener);
	const before = store.getSnapshot();

	store.addOptimisticRoom({
		ROOM_ID: "room-1",
		ROOM_NAME: "Plan",
		DATE_CREATED: "2026-01-01",
	});
	store.removeOptimisticRoom("room-1");

	const after = store.getSnapshot();
	expect(after.optimisticRooms).toEqual({});
	expect(after.models).toBe(before.models);
	expect(after.keys).toBe(before.keys);
	expect(listener).toHaveBeenCalledTimes(2);
});
