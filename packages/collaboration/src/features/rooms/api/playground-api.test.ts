import {
	getRoomMessages,
	latestAssistantTail,
} from "@/features/messages/api/get-room-messages";
import { createRoom } from "./create-room";
import { listRooms } from "./list-rooms";

function pixelResponse(output: unknown) {
	return {
		pixelReturn: [{ output, operationType: [] }],
	};
}

describe("playground room APIs", () => {
	it("creates, configures, names, and binds a room for the SEMOSS harness", async () => {
		const run = vi
			.fn()
			.mockResolvedValueOnce(pixelResponse({ roomId: "room-1" }))
			.mockResolvedValue(pixelResponse(true));

		await expect(
			createRoom({ run } as never, "insight-1", {
				workspaceId: "workspace-1",
				workspaceName: "Research",
				instructions: "Check sources.",
				modelId: "model-1",
				name: "Quarterly review",
			}),
		).resolves.toBe("room-1");

		expect(run.mock.calls.map(([statement]) => statement)).toEqual([
			'CreatePlaygroundRoom(workspaceId=["workspace-1"], mode=["collaboration"]);',
			expect.stringContaining("UpdateRoomOptions"),
			'SetRoomName(roomId=["room-1"], roomName=["Quarterly review"]);',
			'SetRoomForInsight(roomId=["room-1"]);',
		]);
		const optionsStatement = String(run.mock.calls[1]?.[0]);
		expect(optionsStatement).toContain('"workspace_id":"workspace-1"');
		expect(optionsStatement).toContain('"modelId":"model-1"');
		expect(optionsStatement).toContain('"harnessType":"semoss"');
	});

	it("retains an allocated room id and resumes setup without creating another room", async () => {
		const onCreated = vi.fn();
		const firstRun = vi
			.fn()
			.mockResolvedValueOnce(pixelResponse({ roomId: "room-1" }))
			.mockRejectedValueOnce(new Error("Options unavailable"));

		await expect(
			createRoom(
				{ run: firstRun } as never,
				"insight-1",
				{
					workspaceId: "workspace-1",
					workspaceName: "Research",
				},
				{ onCreated },
			),
		).rejects.toThrow("Options unavailable");
		expect(onCreated).toHaveBeenCalledWith("room-1");

		const retryRun = vi.fn().mockResolvedValue(pixelResponse(true));
		await expect(
			createRoom(
				{ run: retryRun } as never,
				"insight-1",
				{
					workspaceId: "workspace-1",
					workspaceName: "Research",
				},
				{ roomId: "room-1" },
			),
		).resolves.toBe("room-1");
		expect(retryRun.mock.calls.map(([statement]) => statement)).toEqual([
			expect.stringContaining("UpdateRoomOptions"),
			'SetRoomForInsight(roomId=["room-1"]);',
		]);
	});

	it("lists playground rooms once and maps uppercase fields", async () => {
		const run = vi.fn().mockResolvedValue(
			pixelResponse([
				{
					ROOM_ID: "room-1",
					ROOM_NAME: "Review",
					WORKSPACE_ID: "workspace-1",
					DATE_UPDATED: "2026-09-22T10:00:00Z",
					PINNED: true,
				},
			]),
		);
		await expect(listRooms({ run } as never)).resolves.toEqual([
			{
				roomId: "room-1",
				roomName: "Review",
				workspaceId: "workspace-1",
				dateUpdated: "2026-09-22T10:00:00Z",
				pinned: true,
			},
		]);
		expect(run).toHaveBeenCalledOnce();
		expect(run).toHaveBeenCalledWith(
			'META | GetPlaygroundRooms(sort=["DESC"], mode=["collaboration"]);',
		);
	});

	it("loads playground visibility and uses a hidden assistant as the durable tail", async () => {
		const run = vi.fn().mockResolvedValue(
			pixelResponse([
				{
					MESSAGE_ID: "visible-response",
					IO: "OUTPUT",
					VISIBLE: true,
					PARENT_MESSAGE_ID: "input-1",
					PARTS: [{ type: "TEXT", text: "Done", uiText: "Done" }],
				},
				{
					MESSAGE_ID: "hidden-response",
					IO: "OUTPUT",
					VISIBLE: false,
					PARENT_MESSAGE_ID: "hidden-input",
					PARTS: [],
				},
			]),
		);
		const messages = await getRoomMessages({ run } as never, "room-1");
		expect(messages[0]).toMatchObject({
			messageId: "visible-response",
			visible: true,
			parentMessageId: "input-1",
		});
		expect(latestAssistantTail(messages)).toBe("hidden-response");
		expect(run).toHaveBeenCalledWith(
			'GetPlaygroundMessages(roomId=["room-1"]);',
		);
	});
});
