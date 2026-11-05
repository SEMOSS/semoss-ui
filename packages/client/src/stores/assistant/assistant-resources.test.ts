import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkbenchStore } from "@semoss/workbench";
import type { RoomOptionsMap } from "@/api/rooms";
import { createAssistantStore } from "./assistant.store";
import { readRoomResources } from "./assistant-resources";

const api = vi.hoisted(() => ({
	read: vi.fn(),
	write: vi.fn(),
	create: vi.fn(),
	bind: vi.fn(),
	messages: vi.fn(),
	run: vi.fn(),
	model: vi.fn(),
}));
vi.mock("@/api/rooms", async (original) => ({
	...(await original<typeof import("@/api/rooms")>()),
	getRoomOptions: api.read,
	updateRoomOptions: api.write,
	createWorkbenchRoom: api.create,
	setRoomForInsight: api.bind,
	getPlaygroundMessages: api.messages,
	getDefaultWorkbenchAssistantModel: api.model,
}));
vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	runAgent: api.run,
}));
const base = { id: "base", name: "Workbench", type: "PROJECT" };
const addition = { id: "custom", name: "My tools", type: "PROJECT" };
const skill = { skill_id: "skill", name: "My skill" };
const stores: ReturnType<typeof createAssistantStore>[] = [];
const rooms = new Map<string, RoomOptionsMap>();

/** Deferred transport for overlapping room/save requests. */
const deferred = <T>() => {
	let resolve: (value: T) => void = () => undefined;
	let reject: (error: Error) => void = () => undefined;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
};

/** Isolated mounted workbench, with its own resource defaults. */
const makeStore = () => {
	const store = createAssistantStore({
		workbenchId: "test",
		workbench: createWorkbenchStore({ components: {} }),
	});
	store.setState({
		insightId: "insight",
		roomId: "room",
		mcp: [base],
		model: {
			engine_id: "model",
			engine_name: "Model",
			engine_type: "MODEL",
		},
	});
	stores.push(store);
	return store;
};
beforeEach(() => {
	vi.resetAllMocks();
	rooms.clear();
	api.read.mockImplementation(
		async (_insight, room) => rooms.get(room) ?? null,
	);
	api.write.mockImplementation(async (_insight, room, options) => {
		rooms.set(room, structuredClone(options));
	});
	api.messages.mockResolvedValue([]);
	api.create.mockResolvedValue("new-room");
	api.run.mockRejectedValue(new Error("Run construction verified"));
});
afterEach(() => {
	for (const store of stores.splice(0)) store.getState().destroy();
});

describe("assistant room additions", () => {
	it("deduplicates tools and skills, preserves base tools and unrelated options on removal and submission", async () => {
		const store = makeStore();
		rooms.set("room", {
			temperature: 0.4,
			predefinedPrompts: ["keep"],
			builtinTools: { search: true },
		});
		await store.getState().saveCustomMcp([addition, addition, base]);
		expect(store.getState().customMcp).toEqual([addition]);
		await store.getState().saveCustomSkills([skill, skill]);
		expect(rooms.get("room")).toMatchObject({
			mcp: [base, addition],
			skills: [skill],
			temperature: 0.4,
			predefinedPrompts: ["keep"],
			builtinTools: { search: true },
		});
		store.getState().setAgent({ workspace_id: "agent" });
		store
			.getState()
			.configure({ mcp: [base], systemPrompt: "New context" });
		await store.getState().submit("hello");
		expect(rooms.get("room")).toMatchObject({
			skills: [skill],
			mcp: [base, addition],
			workspace: { workspace_id: "agent" },
			temperature: 0.4,
		});
		await store.getState().saveCustomMcp([]);
		await store.getState().saveCustomSkills([]);
		expect(rooms.get("room")).toMatchObject({
			mcp: [base],
			skills: [],
			temperature: 0.4,
		});
	});
	it("restores mcp selections and persists removals when reopening a room", async () => {
		const store = makeStore();
		rooms.set("saved-room", {
			mcp: [base, addition],
			temperature: 0.4,
		});
		await store.getState().resumeRoom("saved-room");
		expect(store.getState().customMcp).toEqual([addition]);
		await store.getState().saveCustomSkills([skill]);
		expect(rooms.get("saved-room")).toMatchObject({
			mcp: [base, addition],
			skills: [skill],
			temperature: 0.4,
		});
		await store.getState().submit("Use the saved toolbox");
		expect(rooms.get("saved-room")?.mcp).toEqual([base, addition]);
		await store.getState().saveCustomMcp([]);
		await store.getState().resumeRoom("other");
		await store.getState().resumeRoom("saved-room");
		expect(store.getState().customMcp).toEqual([]);
		expect(rooms.get("saved-room")?.mcp).toEqual([base]);
	});
	it("keeps formerly required tools editable when restoring against different workbench defaults", async () => {
		const store = makeStore();
		const nextBase = {
			id: "new-base",
			name: "New workbench tools",
			type: "PROJECT",
		};
		rooms.set("saved-room", { mcp: [base, addition] });
		store.getState().configure({ mcp: [nextBase] });
		await store.getState().resumeRoom("saved-room");
		expect(store.getState().customMcp).toEqual([base, addition]);
		await store.getState().saveCustomMcp([addition]);
		expect(rooms.get("saved-room")?.mcp).toEqual([nextBase, addition]);
	});
	it("validates and deduplicates saved mcp entries while preserving their metadata", () => {
		const options: RoomOptionsMap = JSON.parse(
			'{"mcp":[null,{},false,{"id":"bad","name":"Bad","type":5},{"id":"base","name":"Workbench","type":"PROJECT"},{"id":"custom","name":"Old","type":"PROJECT"},{"id":"custom","name":"My tools","type":"PROJECT","fromRoom":true}]}',
		);
		const restored = readRoomResources(options, [base]);
		expect(restored.customMcp).toEqual([{ ...addition, fromRoom: true }]);
		expect(restored.customMcp[0]).not.toBe(options.mcp?.at(-1));
		expect(readRoomResources(null, [base]).customMcp).toEqual([]);
		expect(
			readRoomResources(JSON.parse('{"mcp":{}}'), [base]).customMcp,
		).toEqual([]);
	});
	it("copies additions independently into new rooms, restores saved selections, and starts fresh sessions empty", async () => {
		const store = makeStore();
		await store.getState().saveCustomMcp([addition]);
		await store.getState().saveCustomSkills([skill]);
		const previous = store.getState().customSkills;
		const previousTools = store.getState().customMcp;
		await store.getState().newRoom();
		expect(store.getState().customSkills).toEqual(previous);
		expect(store.getState().customSkills).not.toBe(previous);
		expect(store.getState().customMcp).toEqual([addition]);
		expect(store.getState().customMcp).not.toBe(previousTools);
		expect(rooms.get("new-room")).toMatchObject({
			mcp: [base, addition],
			skills: [skill],
		});
		await store.getState().saveCustomSkills([]);
		await store.getState().resumeRoom("room");
		expect(store.getState().customMcp).toEqual([addition]);
		expect(store.getState().customSkills).toEqual([skill]);
		expect(makeStore().getState().customMcp).toEqual([]);
		await store.getState().resumeRoom("empty-room");
		expect(store.getState().customMcp).toEqual([]);
		expect(store.getState().customSkills).toEqual([]);
	});
	it("retains the saved state after failures and supports retry", async () => {
		const store = makeStore();
		api.write.mockRejectedValueOnce(new Error("Save unavailable"));
		await expect(
			store.getState().saveCustomSkills([skill]),
		).rejects.toThrow("Save unavailable");
		expect(store.getState().customSkills).toEqual([]);
		expect(store.getState().isSavingResources).toBe(false);
		await store.getState().saveCustomSkills([skill]);
		expect(store.getState().customSkills).toEqual([skill]);
	});
	it("does not overwrite unread options when the read fails", async () => {
		const store = makeStore();
		api.read.mockRejectedValueOnce(new Error("Read unavailable"));
		await expect(
			store.getState().saveCustomMcp([addition]),
		).rejects.toThrow("Read unavailable");
		expect(api.write).not.toHaveBeenCalled();
	});
	it("ignores a save response after switching conversations", async () => {
		const store = makeStore();
		const pending = deferred<void>();
		api.write.mockReturnValueOnce(pending.promise);
		const save = store.getState().saveCustomSkills([skill]);
		const rejected = expect(save).rejects.toThrow("Conversation changed");
		await vi.waitFor(() => expect(api.write).toHaveBeenCalled());
		await store.getState().resumeRoom("other");
		pending.resolve();
		await rejected;
		expect(store.getState().roomId).toBe("other");
		expect(store.getState().customSkills).toEqual([]);
		expect(store.getState().isSavingResources).toBe(false);
	});
	it("ignores an old room read after a newer conversation loads", async () => {
		const store = makeStore();
		const read = deferred<RoomOptionsMap>();
		api.read.mockReturnValueOnce(read.promise);
		const old = store.getState().resumeRoom("old");
		await vi.waitFor(() => expect(api.read).toHaveBeenCalled());
		await store.getState().resumeRoom("latest");
		read.resolve({ skills: [skill] });
		await old;
		expect(store.getState().roomId).toBe("latest");
		expect(store.getState().customSkills).toEqual([]);
	});
	it.each([
		"isSending",
		"isInitializing",
		"isSavingResources",
		"activeRunId",
	] as const)(
		"locks resource changes during %s, including paused runs",
		async (field) => {
			const store = makeStore();
			store.setState({
				[field]: field === "activeRunId" ? "paused" : true,
			});
			await expect(
				store.getState().saveCustomMcp([addition]),
			).rejects.toThrow("Wait");
			expect(api.write).not.toHaveBeenCalled();
		},
	);
	it("blocks submission while a resource save is pending and prevents stale submission", async () => {
		const store = makeStore();
		const write = deferred<void>();
		api.write.mockReturnValueOnce(write.promise);
		const save = store.getState().saveCustomMcp([addition]);
		expect(await store.getState().submit("hello")).toBe(false);
		write.resolve();
		await save;
		const read = deferred<RoomOptionsMap>();
		api.read.mockReturnValueOnce(read.promise);
		const submission = store.getState().submit("late");
		await store.getState().resumeRoom("other");
		read.resolve({});
		expect(await submission).toBe(false);
		expect(api.run).not.toHaveBeenCalled();
	});
});
