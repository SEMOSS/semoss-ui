import { roomOptionsEnvelopeSchema } from "@/features/rooms/api/room-schemas";
import { THREAD_ASSISTANT_INSTRUCTIONS } from "../thread-context";
import { findThreadRoom, prepareThreadRoom } from "./thread-room";

const response = (output: unknown) => ({
	pixelReturn: [{ output, operationType: [] }],
});
const metadata = {
	version: 1 as const,
	threadId: "thread-1",
	contextRevision: "revision-1",
	modelId: "model-1",
};

function replacementBackend(
	initialOptions: Record<string, unknown>,
	afterUpdate?: (options: Record<string, unknown>) => void,
) {
	let savedOptions = structuredClone(initialOptions);
	const writes: Record<string, unknown>[] = [];
	const run = vi.fn().mockImplementation(async (statement: string) => {
		if (statement.startsWith("CreatePlaygroundRoom"))
			return response({ roomId: "room-1" });
		if (statement.startsWith("GetRoomOptions"))
			return response({ OPTIONS: structuredClone(savedOptions) });
		if (statement.startsWith("UpdateRoomOptions")) {
			const submitted = JSON.parse(
				statement.slice(statement.indexOf("roomOptions=") + 12, -2),
			) as unknown[];
			savedOptions = roomOptionsEnvelopeSchema.parse({
				OPTIONS: submitted[0],
			}).OPTIONS;
			writes.push(structuredClone(savedOptions));
			afterUpdate?.(savedOptions);
		}
		return response(true);
	});
	return {
		run,
		writes,
		read: () => savedOptions,
		replace: (options: Record<string, unknown>) => {
			savedOptions = structuredClone(options);
		},
	};
}

it("creates ad-hoc collaboration rooms and merges association metadata without copying source content", async () => {
	const backend = replacementBackend({
		modelId: "default-model",
		preserveMe: { source: "server configuration" },
		temperature: 0.4,
		workspace: { workspace_id: "old-workspace", name: "Old workspace" },
		mcp: [{ id: "old-tool", name: "Old tool", type: "FUNCTION" }],
	});
	const { run } = backend;
	const onCreated = vi.fn();
	const room = await prepareThreadRoom(
		{ run } as never,
		"insight-1",
		"Review",
		metadata,
		{ onCreated },
	);
	expect(onCreated).toHaveBeenCalledWith("room-1");
	expect(run.mock.calls[0]?.[0]).toBe(
		'CreatePlaygroundRoom(mode=["collaboration"]);',
	);
	expect(room).toMatchObject({
		roomId: "room-1",
		metadata,
		options: {
			preserveMe: { source: "server configuration" },
			temperature: 0.4,
			workThread: metadata,
		},
	});
	expect(backend.read()).toEqual(room.options);
	expect(backend.writes).toHaveLength(2);
	for (const options of backend.writes) {
		expect(options).toMatchObject({
			preserveMe: { source: "server configuration" },
			temperature: 0.4,
			instructions: THREAD_ASSISTANT_INSTRUCTIONS,
			modelId: "model-1",
			mcp: [],
			harnessType: "semoss",
		});
		expect(options).not.toHaveProperty("workspace");
	}
	expect(run.mock.calls.at(-1)?.[0]).not.toContain("contextText");
	expect(run.mock.calls.map(([statement]) => statement)).not.toContain(
		expect.stringContaining("Microsoft"),
	);
});

it("re-reads a partially saved room before retrying without losing its association or other options", async () => {
	let loseAssociationResponse = true;
	const backend = replacementBackend(
		{ preserveMe: { source: "initial configuration" }, temperature: 0.6 },
		(options) => {
			if (options.workThread && loseAssociationResponse) {
				loseAssociationResponse = false;
				throw new Error("Connection lost after saving the association");
			}
		},
	);
	const onCreated = vi.fn();
	await expect(
		prepareThreadRoom(
			{ run: backend.run } as never,
			"insight-1",
			"Review",
			metadata,
			{ onCreated },
		),
	).rejects.toThrow("Connection lost after saving the association");
	expect(onCreated).toHaveBeenCalledWith("room-1");
	expect(backend.read().workThread).toEqual(metadata);
	backend.replace({
		...backend.read(),
		updatedElsewhere: { keep: true },
		workspace: { workspace_id: "unexpected-workspace", name: "Other" },
		mcp: [{ id: "unexpected-tool", name: "Other", type: "FUNCTION" }],
	});
	const writesBeforeRetry = backend.writes.length;
	const room = await prepareThreadRoom(
		{ run: backend.run } as never,
		"insight-1",
		"Review",
		metadata,
		{ roomId: "room-1", onCreated },
	);
	for (const options of backend.writes.slice(writesBeforeRetry)) {
		expect(options).toMatchObject({
			preserveMe: { source: "initial configuration" },
			updatedElsewhere: { keep: true },
			temperature: 0.6,
			workThread: metadata,
			mcp: [],
		});
		expect(options).not.toHaveProperty("workspace");
	}
	expect(backend.read()).toEqual(room.options);
	expect(onCreated).toHaveBeenCalledOnce();
	expect(
		backend.run.mock.calls.filter(([statement]) =>
			String(statement).startsWith("CreatePlaygroundRoom"),
		),
	).toHaveLength(1);
});

it("only recovers associations in the owner's room list with a matching thread and saved model", async () => {
	const run = vi.fn().mockImplementation(async (statement: string) => {
		if (statement.includes("GetPlaygroundRooms"))
			return response([
				{ ROOM_ID: "other-thread" },
				{ ROOM_ID: "wrong-model" },
				{ ROOM_ID: "matching" },
			]);
		const options = statement.includes("other-thread")
			? {
					modelId: "model-1",
					workThread: { ...metadata, threadId: "other" },
				}
			: statement.includes("wrong-model")
				? { modelId: "model-2", workThread: metadata }
				: { modelId: "model-1", workThread: metadata };
		return response({ OPTIONS: options });
	});
	expect(await findThreadRoom({ run } as never, "thread-1")).toMatchObject({
		roomId: "matching",
		metadata,
	});
	expect(run.mock.calls[0]?.[0]).toContain('mode=["collaboration"]');
	expect(run).toHaveBeenCalledTimes(4);
});

it("does not turn a failed room lookup into permission to create a duplicate", async () => {
	const run = vi
		.fn()
		.mockResolvedValueOnce(response([{ ROOM_ID: "unknown" }]))
		.mockRejectedValueOnce(new Error("Connection lost"));
	await expect(findThreadRoom({ run } as never, "thread-1")).rejects.toThrow(
		"Connection lost",
	);
});
