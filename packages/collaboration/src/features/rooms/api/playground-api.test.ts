import {
	getRoomMessages,
	latestAssistantTail,
} from "@/features/messages/api/get-room-messages";
import { createRoom } from "./create-room";
import { listRooms } from "./list-rooms";
import {
	buildAddPlaygroundToolExecutionStatement,
	buildAskPlaygroundStatement,
	buildRunMcpToolStatement,
	getToolEngineId,
} from "./playground-chat";

function pixelResponse(output: unknown) {
	return {
		pixelReturn: [{ output, operationType: [] }],
	};
}

describe("playground room APIs", () => {
	it("creates, configures, names, and binds a room without a harness", async () => {
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
			'CreatePlaygroundRoom(workspaceId=["workspace-1"]);',
			expect.stringContaining("UpdateRoomOptions"),
			'SetRoomName(roomId=["room-1"], roomName=["Quarterly review"]);',
			'SetRoomForInsight(roomId=["room-1"]);',
		]);
		const optionsStatement = String(run.mock.calls[1]?.[0]);
		expect(optionsStatement).toContain('"workspace_id":"workspace-1"');
		expect(optionsStatement).toContain('"modelId":"model-1"');
		expect(optionsStatement).not.toContain("harnessType");
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
			'META | GetPlaygroundRooms(sort=["DESC"]);',
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

describe("playground turn statement builders", () => {
	it("encodes AskPlayground content, media, and parent ids", () => {
		const statement = buildAskPlaygroundStatement({
			engine: "model-1",
			roomId: "room-1",
			command: 'Review "this"',
			context: "Be concise.",
			media: ["/uploads/brief.txt"],
			parentMessageId: "response-0",
		});
		expect(statement).toContain('engine=["model-1"]');
		expect(statement).toContain(
			'command=["<encode>Review \\"this\\"</encode>"]',
		);
		expect(statement).toContain('media=["/uploads/brief.txt"]');
		expect(statement).toContain('parentMessageId=["response-0"]');
	});

	it("builds tool execution and result statements", () => {
		expect(
			buildRunMcpToolStatement({
				ownerId: "engine-1",
				roomId: "room-1",
				toolName: "send_email",
				argumentsValue: { to: "person@example.com" },
			}),
		).toBe(
			'RunMCPTool(project=["engine-1"], roomId="room-1", function=["send_email"], paramValues=[{"to":"person@example.com"}]);',
		);

		const result = buildAddPlaygroundToolExecutionStatement({
			engine: "model-1",
			roomId: "room-1",
			parentMessageId: "response-1",
			toolId: "tool-1",
			toolName: "send_email",
			toolExecutionResponse: "sent",
			mcpToolStatus: "success",
			toolParameterValues: { to: "person@example.com" },
		});
		expect(result).toContain("AddPlaygroundToolExecution(");
		expect(result).toContain('mcpToolStatus="success"');
		expect(result).toContain(
			'toolParameterValues=[{"to":"person@example.com"}]',
		);
	});

	it("prefers engine ownership, falls back to project, and retains room tools", () => {
		expect(
			getToolEngineId({
				SMSS_ENGINE_ID: "engine-1",
				SMSS_PROJECT_ID: "project-1",
			}),
		).toBe("engine-1");
		expect(getToolEngineId({ SMSS_PROJECT_ID: "project-1" })).toBe(
			"project-1",
		);
		expect(getToolEngineId({ SMSS_ENGINE_ID: "__room__" })).toBe(
			"__room__",
		);
	});
});
