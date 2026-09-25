import { searchRoomMessages } from "./search-room-messages";

function pixelResponse(output: unknown) {
	return {
		pixelReturn: [{ output, operationType: [] }],
	};
}

describe("searchRoomMessages", () => {
	it("searches room content through the playground project without loading messages", async () => {
		const run = vi.fn().mockResolvedValue(
			pixelResponse([
				{
					room_id: "room-1",
					room_name: "Quarterly review",
					date_created: "2026-09-22T10:00:00Z",
				},
			]),
		);

		await expect(
			searchRoomMessages({ run } as never, 'launch "notes"'),
		).resolves.toEqual([
			{
				roomId: "room-1",
				roomName: "Quarterly review",
				dateCreated: "2026-09-22T10:00:00Z",
			},
		]);
		expect(run).toHaveBeenCalledOnce();
		expect(run).toHaveBeenCalledWith(
			'META | SearchRoomMessages(search=["launch \\"notes\\""], project=["SYSTEM__PLAYGROUND"], limit=[50], offset=[0]);',
		);
		expect(String(run.mock.calls[0]?.[0])).not.toMatch(
			/GetPlaygroundRooms|GetPlaygroundMessages/,
		);
	});

	it("does not call the backend for an empty search", async () => {
		const run = vi.fn();

		await expect(
			searchRoomMessages({ run } as never, "   "),
		).resolves.toEqual([]);
		expect(run).not.toHaveBeenCalled();
	});

	it("rejects an invalid backend response", async () => {
		const run = vi
			.fn()
			.mockResolvedValue(pixelResponse([{ ROOM_ID: "wrong-shape" }]));

		await expect(
			searchRoomMessages({ run } as never, "launch"),
		).rejects.toThrow("unexpected shape");
	});
});
