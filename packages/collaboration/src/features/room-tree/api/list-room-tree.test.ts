import { beforeEach, describe, expect, it, vi } from "vitest";
import { listRoomsPage } from "@/features/rooms/api/list-rooms";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import { type InsightActions, pixel } from "@/lib/pixel";
import { listRoomTree } from "./list-room-tree";

vi.mock("@/features/rooms/api/list-rooms", async (importOriginal) => {
	const original =
		await importOriginal<
			typeof import("@/features/rooms/api/list-rooms")
		>();
	return { ...original, listRoomsPage: vi.fn(original.listRoomsPage) };
});

interface ApiFixture {
	topics?: unknown[];
	threads?: unknown[];
	readOptions?: (roomId: string) => unknown | Promise<unknown>;
}

interface Deferred<Value> {
	promise: Promise<Value>;
	resolve: (value: Value) => void;
}

function deferred<Value>(): Deferred<Value> {
	let complete: ((value: Value) => void) | undefined;
	const promise = new Promise<Value>((resolve) => {
		complete = resolve;
	});
	return {
		promise,
		resolve: (value) => {
			if (!complete)
				throw new Error("Deferred response is not initialized.");
			complete(value);
		},
	};
}

function response(output: unknown) {
	return { pixelReturn: [{ output, operationType: [] }] };
}

function offsetOf(statement: string): number {
	const match = statement.match(/offset=\[(\d+)\]/);
	if (!match?.[1]) throw new Error(`Missing directory offset: ${statement}`);
	return Number(match[1]);
}

function optionsRoomId(statement: string): string {
	const match = statement.match(/^GetRoomOptions\(roomId=(\[.*\])\);$/);
	if (!match?.[1])
		throw new Error(`Unexpected metadata statement: ${statement}`);
	const values: unknown = JSON.parse(match[1]);
	if (!Array.isArray(values) || typeof values[0] !== "string")
		throw new Error("Expected an encoded room ID.");
	return values[0];
}

/** Exercise existing Pixel statements while keeping directory fixtures readable. */
function transport({
	topics = [],
	threads = [],
	readOptions,
}: ApiFixture = {}) {
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("BrainListTopics(")) {
			const offset = offsetOf(statement);
			return response({
				items: topics.slice(offset, offset + 250),
				total: topics.length,
			});
		}
		if (statement.startsWith("BrainListThreads(")) {
			const offset = offsetOf(statement);
			return response({
				items: threads.slice(offset, offset + 250),
				total: threads.length,
			});
		}
		if (statement.startsWith("GetRoomOptions("))
			return response(
				await (readOptions?.(optionsRoomId(statement)) ?? {
					OPTIONS: {},
				}),
			);
		throw new Error(`Unexpected API call: ${statement}`);
	});
	return { actions: { run } as unknown as InsightActions, run };
}

function source(threadId: string) {
	return {
		version: 1,
		threadId,
		title: "Source",
		channel: "email",
		kind: "brain",
		file: { fileLocation: "source.md", fileName: "source.md" },
		messages: [],
	};
}

function room(roomId: string): RoomRow {
	return { roomId, roomName: roomId, dateCreated: "2026-10-01T10:00:00Z" };
}

beforeEach(() => {
	vi.mocked(listRoomsPage).mockReset();
	vi.mocked(listRoomsPage).mockResolvedValue({
		rooms: [],
		hasMore: false,
		nextOffset: 0,
	});
});

describe("frontend room list loading", () => {
	it("uses only existing read endpoints and encoded room IDs without opening transcripts", async () => {
		const original = await vi.importActual<
			typeof import("@/features/rooms/api/list-rooms")
		>("@/features/rooms/api/list-rooms");
		vi.mocked(listRoomsPage).mockImplementation(original.listRoomsPage);
		const roomId = 'room"quoted';
		const run = vi.fn(async (statement: string) => {
			switch (statement) {
				case "BrainListTopics(limit=[250], offset=[0]);":
					return response({
						items: [{ id: "topic", name: "Topic" }],
						total: 1,
					});
				case "BrainListThreads(limit=[250], offset=[0]);":
					return response({
						items: [
							{
								id: "thread",
								topicLinks: [{ topicId: "topic" }],
							},
						],
						total: 1,
					});
				case 'META | GetPlaygroundRooms(mode=["collaboration"], sort=["DESC"], limit=[25], offset=[0], includeUnnamedRooms=[true], pinned=[true]);':
					return response([
						{
							ROOM_ID: roomId,
							ROOM_NAME: null,
							PINNED: true,
							DATE_CREATED: "2026-10-01T10:00:00Z",
						},
					]);
				case pixel("GetRoomOptions", { roomId }):
					return response({ OPTIONS: { source: source("thread") } });
				default:
					throw new Error(`Unexpected API call: ${statement}`);
			}
		});
		const result = await listRoomTree({ run } as unknown as InsightActions);
		expect(run).toHaveBeenCalledTimes(4);
		expect(run).toHaveBeenCalledWith(
			'GetRoomOptions(roomId=["room\\"quoted"]);',
		);
		expect(result.rooms).toEqual([
			expect.objectContaining({
				roomId,
				roomName: undefined,
				topics: [{ topicId: "topic", name: "Topic" }],
			}),
		]);
		expect(result.warning).toBeUndefined();
	});

	it("continues topic and thread directories beyond previous loading caps", async () => {
		const topics = Array.from({ length: 1001 }, (_, index) => ({
			id: `topic-${index}`,
			name: `Topic ${index}`,
		}));
		const threads = Array.from({ length: 5001 }, (_, index) => ({
			id: `thread-${index}`,
			topicLinks: [{ topicId: "topic-1000" }],
		}));
		const { actions, run } = transport({
			topics,
			threads,
			readOptions: () => ({ OPTIONS: { source: source("thread-5000") } }),
		});
		vi.mocked(listRoomsPage).mockResolvedValue({
			rooms: [room("old-room")],
			hasMore: false,
			nextOffset: 1,
		});
		const result = await listRoomTree(actions);
		expect(result.rooms).toEqual([
			expect.objectContaining({
				roomId: "old-room",
				topics: [{ topicId: "topic-1000", name: "Topic 1000" }],
			}),
		]);
		expect(run).toHaveBeenCalledWith(
			"BrainListTopics(limit=[250], offset=[1000]);",
		);
		expect(run).toHaveBeenCalledWith(
			"BrainListThreads(limit=[250], offset=[5000]);",
		);
		expect(
			run.mock.calls.filter(([statement]) =>
				statement.startsWith("BrainListTopics("),
			),
		).toHaveLength(5);
		expect(
			run.mock.calls.filter(([statement]) =>
				statement.startsWith("BrainListThreads("),
			),
		).toHaveLength(21);
	});

	it("follows every room page and returns unique rooms with available topics in alphabetical order", async () => {
		const rooms = Array.from({ length: 7 }, (_, index) =>
			room(`room-${index}`),
		);
		const { actions, run } = transport({
			topics: [
				{ id: "one", name: "Zulu" },
				{ id: "two", name: "Alpha", short: "A" },
				{ id: "same-b", name: "Same" },
				{ id: "empty", name: "Empty" },
				{ id: "archived", name: "Archived", status: "archived" },
				{ id: "same-a", name: "Same" },
			],
			threads: [
				{
					id: "thread",
					topicLinks: [
						{ topicId: "one" },
						{ topicId: "two" },
						{ topicId: "one" },
						{ topicId: "archived" },
						{ topicId: "same-b" },
						{ topicId: "same-a" },
					],
				},
			],
			readOptions: () => ({ OPTIONS: { source: source("thread") } }),
		});
		vi.mocked(listRoomsPage)
			.mockResolvedValueOnce({
				rooms: rooms.slice(0, 3),
				hasMore: true,
				nextOffset: 3,
			})
			.mockResolvedValueOnce({
				rooms: rooms.slice(3, 6),
				hasMore: true,
				nextOffset: 6,
			})
			.mockResolvedValueOnce({
				rooms: rooms.slice(6),
				hasMore: false,
				nextOffset: 7,
			});
		const result = await listRoomTree(
			actions,
			new Map([["room-0", "2026-10-08T10:00:00Z"]]),
		);
		expect(
			vi.mocked(listRoomsPage).mock.calls.map(([, offset]) => offset),
		).toEqual([0, 3, 6]);
		expect(result.rooms.map((entry) => entry.roomId)).toEqual([
			"room-0",
			"room-6",
			"room-5",
			"room-4",
			"room-3",
			"room-2",
			"room-1",
		]);
		for (const entry of result.rooms)
			expect(entry.topics).toEqual([
				{ topicId: "two", name: "Alpha", short: "A" },
				{ topicId: "same-a", name: "Same" },
				{ topicId: "same-b", name: "Same" },
				{ topicId: "one", name: "Zulu" },
			]);
		expect(
			run.mock.calls.filter(([statement]) =>
				statement.startsWith("GetRoomOptions("),
			),
		).toHaveLength(7);
	});

	it("prioritizes explicit source and workThread metadata before legacy room links", async () => {
		const { actions } = transport({
			topics: [
				{ id: "explicit", name: "Explicit" },
				{ id: "legacy", name: "Legacy" },
			],
			threads: [
				{ id: "current-thread", topicLinks: [{ topicId: "explicit" }] },
				...["current", "work-thread", "absent", "missing-thread"].map(
					(roomId) => ({
						id: `legacy-${roomId}`,
						roomId,
						topicLinks: [{ topicId: "legacy" }],
					}),
				),
			],
			readOptions: (roomId) => {
				if (roomId === "current")
					return {
						OPTIONS: {
							source: source("current-thread"),
							workThread: { threadId: "legacy-current" },
						},
					};
				if (roomId === "work-thread")
					return {
						OPTIONS: { workThread: { threadId: "current-thread" } },
					};
				if (roomId === "missing-thread")
					return { OPTIONS: { source: source("unknown") } };
				return { OPTIONS: {} };
			},
		});
		vi.mocked(listRoomsPage).mockResolvedValue({
			rooms: ["current", "work-thread", "absent", "missing-thread"].map(
				room,
			),
			hasMore: false,
			nextOffset: 4,
		});
		const result = await listRoomTree(actions);
		expect(
			Object.fromEntries(
				result.rooms.map((entry) => [
					entry.roomId,
					entry.topics.map((topic) => topic.topicId),
				]),
			),
		).toEqual({
			"work-thread": ["explicit"],
			current: ["explicit"],
			absent: ["legacy"],
			"missing-thread": [],
		});
		expect(
			result.rooms.find((entry) => entry.roomId === "missing-thread")
				?.topicUnavailable,
		).toBeUndefined();
	});

	it("keeps rooms with malformed or failed metadata flagged without invented legacy associations", async () => {
		const roomIds = [
			"null-source",
			"partial-source",
			"invalid-work-thread",
			"failed",
			"unassigned",
		];
		const { actions } = transport({
			topics: [{ id: "topic", name: "Topic" }],
			threads: roomIds.map((roomId) => ({
				id: `thread-${roomId}`,
				roomId,
				topicLinks: [{ topicId: "topic" }],
			})),
			readOptions: (roomId) => {
				if (roomId === "failed")
					throw new Error("Metadata is unavailable.");
				if (roomId === "null-source")
					return {
						OPTIONS: {
							source: null,
							workThread: { threadId: "thread-null-source" },
						},
					};
				if (roomId === "partial-source")
					return {
						OPTIONS: {
							source: { threadId: "thread-partial-source" },
						},
					};
				if (roomId === "invalid-work-thread")
					return { OPTIONS: { workThread: { threadId: 42 } } };
				return { OPTIONS: { source: source("unknown-thread") } };
			},
		});
		vi.mocked(listRoomsPage).mockResolvedValue({
			rooms: roomIds.map(room),
			hasMore: false,
			nextOffset: 5,
		});
		const result = await listRoomTree(actions);
		expect(result.rooms).toHaveLength(5);
		expect(result.rooms.every((entry) => entry.topics.length === 0)).toBe(
			true,
		);
		expect(
			result.rooms
				.filter((entry) => entry.topicUnavailable)
				.map((entry) => entry.roomId)
				.sort(),
		).toEqual(roomIds.filter((id) => id !== "unassigned").sort());
		expect(result.warning).toContain("Some topic links could not be read");
	});

	it("limits metadata concurrency to four without fetching conversation content", async () => {
		const pending = new Map<string, Deferred<unknown>>();
		let activeReads = 0;
		let maximumReads = 0;
		const { actions, run } = transport({
			readOptions: async (roomId) => {
				activeReads += 1;
				maximumReads = Math.max(maximumReads, activeReads);
				const request = deferred<unknown>();
				pending.set(roomId, request);
				try {
					return await request.promise;
				} finally {
					activeReads -= 1;
				}
			},
		});
		vi.mocked(listRoomsPage).mockResolvedValue({
			rooms: Array.from({ length: 9 }, (_, index) =>
				room(`room-${index}`),
			),
			hasMore: false,
			nextOffset: 9,
		});
		const loading = listRoomTree(actions);
		for (const expected of [4, 8, 9]) {
			await vi.waitFor(() => expect(pending.size).toBe(expected));
			for (const request of pending.values())
				request.resolve({ OPTIONS: {} });
		}
		expect((await loading).rooms).toHaveLength(9);
		expect(maximumReads).toBe(4);
		expect(
			run.mock.calls.every(([statement]) =>
				/^(BrainListTopics|BrainListThreads|GetRoomOptions)\(/.test(
					statement,
				),
			),
		).toBe(true);
	});

	it("stops later metadata batches when the owning shell releases the refresh", async () => {
		let isActive = true;
		const pending: Deferred<unknown>[] = [];
		const { actions, run } = transport({
			readOptions: () => {
				const request = deferred<unknown>();
				pending.push(request);
				return request.promise;
			},
		});
		vi.mocked(listRoomsPage).mockResolvedValue({
			rooms: Array.from({ length: 8 }, (_, index) =>
				room(`room-${index}`),
			),
			hasMore: false,
			nextOffset: 8,
		});
		const loading = listRoomTree(actions, new Map(), () => isActive);
		const cancelled = expect(loading).rejects.toThrow("superseded");
		await vi.waitFor(() => expect(pending).toHaveLength(4));
		isActive = false;
		for (const request of pending) request.resolve({ OPTIONS: {} });
		await cancelled;
		expect(
			run.mock.calls.filter(([statement]) =>
				statement.startsWith("GetRoomOptions("),
			),
		).toHaveLength(4);
	});

	it("stops later directory and room pages when the owner becomes inactive", async () => {
		let isActive = true;
		const topicRequest = deferred<unknown>();
		const roomRequest =
			deferred<Awaited<ReturnType<typeof listRoomsPage>>>();
		const { actions, run } = transport();
		run.mockImplementation(async (statement) =>
			response(
				statement.startsWith("BrainListTopics(")
					? await topicRequest.promise
					: { items: [], total: 0 },
			),
		);
		vi.mocked(listRoomsPage).mockReturnValue(roomRequest.promise);
		const loading = listRoomTree(actions, new Map(), () => isActive);
		const cancelled = expect(loading).rejects.toThrow("superseded");
		isActive = false;
		topicRequest.resolve({ items: [{ id: "one", name: "One" }], total: 2 });
		roomRequest.resolve({
			rooms: [room("one")],
			hasMore: true,
			nextOffset: 1,
		});
		await cancelled;
		expect(
			run.mock.calls.filter(([statement]) =>
				statement.startsWith("BrainListTopics("),
			),
		).toHaveLength(1);
		expect(listRoomsPage).toHaveBeenCalledTimes(1);
		expect(
			run.mock.calls.some(([statement]) =>
				statement.startsWith("GetRoomOptions("),
			),
		).toBe(false);
	});

	it.each(["BrainListTopics", "BrainListThreads"] as const)(
		"rejects an empty %s page before its reported total",
		async (reactor) => {
			const { actions, run } = transport();
			run.mockImplementation(async (statement) =>
				response({
					items: [],
					total: statement.startsWith(reactor) ? 1 : 0,
				}),
			);
			await expect(listRoomTree(actions)).rejects.toThrow(
				"Could not finish loading topic links",
			);
		},
	);

	it("rejects repeated directory pages even when their offset reaches the reported total", async () => {
		const { actions, run } = transport();
		run.mockImplementation(async (statement) =>
			response(
				statement.startsWith("BrainListTopics(")
					? {
							items: [{ id: "repeated", name: "Repeated" }],
							total: 2,
						}
					: { items: [], total: 0 },
			),
		);
		await expect(listRoomTree(actions)).rejects.toThrow(
			"Could not finish loading topic links",
		);
	});

	it.each(["same offset", "repeated rooms", "repeated final page"] as const)(
		"rejects room pagination that makes no progress: %s",
		async (failure) => {
			const { actions } = transport();
			vi.mocked(listRoomsPage)
				.mockResolvedValueOnce({
					rooms: [room("one")],
					hasMore: true,
					nextOffset: 1,
				})
				.mockResolvedValueOnce({
					rooms: [room(failure === "same offset" ? "two" : "one")],
					hasMore: failure !== "repeated final page",
					nextOffset: failure === "same offset" ? 1 : 2,
				});
			await expect(listRoomTree(actions)).rejects.toThrow(
				"Could not finish loading rooms",
			);
		},
	);

	it("rejects invalid directory payloads instead of reporting an incomplete successful list", async () => {
		const { actions, run } = transport();
		run.mockResolvedValue(response({ items: [{ id: 12 }], total: 1 }));
		await expect(listRoomTree(actions)).rejects.toThrow("unexpected shape");
	});
});
