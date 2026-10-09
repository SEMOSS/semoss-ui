import { expect, it, vi } from "vitest";
import { readRoomSourceAssociation } from "./read-room-source-association";
import { linkRoomTopic, listRoomTopics } from "./room-topics";

it("reads canonical room links and excludes dismissed and suggested associations", async () => {
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [
			{
				output: {
					roomId: "room",
					topics: [
						{ topicId: "direct", state: "linked" },
						{ topicId: "dismissed", state: "dismissed" },
						{ topicId: "suggested", state: "suggested" },
					],
				},
				operationType: [],
			},
		],
	});
	await expect(
		readRoomSourceAssociation({ run } as never, "room"),
	).resolves.toEqual({ threadId: null, topicIds: ["direct"] });
	expect(run).toHaveBeenCalledExactlyOnceWith(
		'BrainListRoomTopics(roomId=["room"]);',
	);
});
it.each([{ roomId: "other", topics: [] }, { roomId: "room" }, {}])(
	"rejects mismatched or incomplete associations %j",
	async (output) => {
		const run = vi.fn().mockResolvedValue({
			pixelReturn: [{ output, operationType: [] }],
		});
		await expect(
			readRoomSourceAssociation({ run } as never, "room"),
		).rejects.toThrow();
	},
);

it("shares loaded room associations and keeps a confirmed owner change over an older read", async () => {
	let finish: (value: unknown) => void = () => undefined;
	const response = (topics: unknown[]) => ({
		pixelReturn: [
			{ output: { roomId: "room", topics }, operationType: [] },
		],
	});
	const run = vi
		.fn()
		.mockResolvedValueOnce(response([{ topicId: "one", state: "linked" }]))
		.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		)
		.mockResolvedValueOnce(
			response([{ topicId: "one", state: "dismissed" }]),
		);
	const actions = { run } as never;
	await listRoomTopics(actions, "room");
	expect(await readRoomSourceAssociation(actions, "room")).toEqual({
		threadId: null,
		topicIds: ["one"],
	});
	expect(run).toHaveBeenCalledOnce();
	const old = listRoomTopics(actions, "room", true);
	await linkRoomTopic(actions, "room", "one", true);
	finish(response([{ topicId: "one", state: "linked" }]));
	expect(await old).toEqual([{ topicId: "one", state: "dismissed" }]);
	expect((await readRoomSourceAssociation(actions, "room")).topicIds).toEqual(
		[],
	);
	expect(run).toHaveBeenCalledTimes(3);
});

it("invalidates every association returned by a first read or owner write, including backend-seeded links", async () => {
	const events: unknown[] = [];
	const listen = (event: Event) => events.push((event as CustomEvent).detail);
	window.addEventListener("collaboration:room-tree-changed", listen);
	try {
		const actions = {
			run: vi.fn(async () => ({
				pixelReturn: [
					{
						output: {
							roomId: "room",
							topics: [
								{ topicId: "seeded", state: "linked" },
								{ topicId: "chosen", state: "linked" },
							],
						},
						operationType: [],
					},
				],
			})),
		} as never;
		await listRoomTopics(actions, "room");
		await linkRoomTopic(actions, "room", "chosen");
		expect(events).toHaveLength(2);
		expect(events[0]).toMatchObject({ topicIds: ["seeded", "chosen"] });
		expect(events[1]).toMatchObject({ topicIds: ["seeded", "chosen"] });
	} finally {
		window.removeEventListener("collaboration:room-tree-changed", listen);
	}
});
