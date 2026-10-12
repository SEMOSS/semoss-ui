import { readRoomSourceAssociation } from "./read-room-source-association";

const source = {
	version: 1,
	threadId: "source-one",
	title: "Pricing",
	channel: "email",
	kind: "brain",
	file: { fileLocation: "source.md", fileName: "source.md" },
	messages: [],
};

it("reads only options and returns the validated source identity", async () => {
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [{ output: { OPTIONS: { source } }, operationType: [] }],
	});
	await expect(
		readRoomSourceAssociation({ run } as never, "room-one"),
	).resolves.toEqual({ threadId: "source-one", isDelegation: false });
	expect(run).toHaveBeenCalledExactlyOnceWith(
		'GetRoomOptions(roomId=["room-one"]);',
	);
});

it.each([{ OPTIONS: {} }, {}])(
	"recognizes a room without an explicit source",
	async (output) => {
		const run = vi.fn().mockResolvedValue({
			pixelReturn: [{ output, operationType: [] }],
		});
		await expect(
			readRoomSourceAssociation({ run } as never, "room-one"),
		).resolves.toEqual({ threadId: null, isDelegation: false });
	},
);

it.each([
	["action-one", true],
	[" ", false],
	[null, false],
	[undefined, false],
	[42, true],
])(
	"recognizes delegation room options without an extra read",
	async (delegation, isDelegation) => {
		const run = vi.fn().mockResolvedValue({
			pixelReturn: [
				{
					output: { OPTIONS: { delegation_action_id: delegation } },
					operationType: [],
				},
			],
		});
		await expect(
			readRoomSourceAssociation({ run } as never, "room-one"),
		).resolves.toEqual({ threadId: null, isDelegation });
		expect(run).toHaveBeenCalledOnce();
	},
);

it.each([null, { threadId: "source-one" }])(
	"does not treat malformed source metadata as an absent source",
	async (invalidSource) => {
		const run = vi.fn().mockResolvedValue({
			pixelReturn: [
				{
					output: { OPTIONS: { source: invalidSource } },
					operationType: [],
				},
			],
		});
		await expect(
			readRoomSourceAssociation({ run } as never, "room-one"),
		).rejects.toThrow("source link could not be read");
	},
);
