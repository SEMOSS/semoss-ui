import { beforeEach, expect, test, vi } from "vitest";
import { withPlaygroundDefaults } from "@/stores/root/playground-theme";
import type { Engine } from "@/types";
import { ChatStore } from "./chat.store";

const mocks = vi.hoisted(() => {
	const user = (textGeneration: string) => ({
		id: "user-1",
		name: "Tester",
		lastLogin: "2026-11-10",
		defaultModels: { textGeneration, codeGeneration: "" },
	});
	return {
		user,
		snapshot: { status: "AUTHENTICATED", user: user("model-b") },
		run: vi.fn(),
		reloadUser: vi.fn(),
	};
});

vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	// the page's session: a signed in user whose profile names model-b
	Session: {
		getSnapshot: () => mocks.snapshot,
		reloadUser: mocks.reloadUser,
		insight: { run: mocks.run },
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
	sessionStorage.clear();
	mocks.snapshot = { status: "AUTHENTICATED", user: mocks.user("model-b") };
	mocks.run
		.mockReset()
		.mockImplementation(async (pixel: string) => answer(pixel));
	mocks.reloadUser.mockReset();
});

const createStore = async () => {
	const store = new ChatStore(withPlaygroundDefaults(null), {});
	await store.initialize();
	return store;
};

test("reads the user and their profile default model from the session", async () => {
	const store = await createStore();

	expect(store.user).toEqual({
		id: "user-1",
		name: "Tester",
		lastLogin: "2026-11-10",
	});
	expect(store.profileDefaultModelId).toBe("model-b");
	expect(store.models.selected.engine_id).toBe("model-b");
	// the user is not read again: only the models and the context window are
	for (const [pixel] of mocks.run.mock.calls) {
		expect(pixel).not.toMatch(/GetUserInfo|GetUserMetadata/);
	}
});

test("selects a changed profile default after reading the user again", async () => {
	const store = await createStore();
	mocks.reloadUser.mockImplementation(async () => {
		mocks.snapshot = {
			status: "AUTHENTICATED",
			user: mocks.user("model-c"),
		};
		return mocks.snapshot;
	});

	await store.refreshProfileDefaultModel();

	expect(mocks.reloadUser).toHaveBeenCalledTimes(1);
	expect(store.models.selected.engine_id).toBe("model-c");
});

test("keeps a model the user picked when the profile default is unchanged", async () => {
	const store = await createStore();
	store.setSelectedModel(MODELS[0]);
	mocks.reloadUser.mockResolvedValue(mocks.snapshot);

	await store.refreshProfileDefaultModel();

	expect(store.models.selected.engine_id).toBe("model-a");
});

test("pixel errors from the session's insight reject, as the insight's did", async () => {
	const store = await createStore();

	await expect(store.pinRoom("room-1", true)).rejects.toThrow(
		"Room not found",
	);
	await expect(
		store.renameRoom("room-1", "Renamed"),
	).resolves.toBeUndefined();
	expect(mocks.run).toHaveBeenCalledWith(
		expect.stringContaining('RenameRoom(roomId=["room-1"]'),
	);
});
