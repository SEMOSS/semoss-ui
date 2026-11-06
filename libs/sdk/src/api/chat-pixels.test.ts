import { describe, expect, it } from "vitest";
import { chatPixels } from "./chat-pixels";

describe("chatPixels", () => {
	it("creates rooms through CreatePlaygroundRoom", () => {
		expect(chatPixels.createRoom()).toBe("CreatePlaygroundRoom()");
		expect(chatPixels.createRoom({ workspaceId: "agent-1" })).toBe(
			'CreatePlaygroundRoom(workspaceId="agent-1")',
		);
		expect(
			chatPixels.createRoom({
				workspaceId: "agent-1",
				mode: "collaboration",
			}),
		).toBe(
			'CreatePlaygroundRoom(workspaceId="agent-1", mode="collaboration")',
		);
	});

	it("asks through AskPlayground with the client tools in paramValues", () => {
		const params = {
			engine: "model-1",
			roomId: "room-1",
			command: "Hello",
			media: ["a.png"],
			parentMessageId: "message-1",
			paramValues: { tools: [{ name: "folder_list" }], temperature: 0.2 },
		};
		expect(chatPixels.ask(params)).toBe(`AskPlayground(engine=["model-1"],
roomId=["room-1"],
command=["<encode>Hello</encode>"],
context=[],
media=["a.png"],
parentMessageId=["message-1"],
paramValues=[{"tools":[{"name":"folder_list"}],"temperature":0.2}]);`);
	});

	it("leaves out the parent of a first turn and sends its context", () => {
		expect(
			chatPixels.ask({
				engine: "m",
				roomId: "r",
				command: "Hi",
				context: "Be brief",
			}),
		).toBe(`AskPlayground(engine=["m"],
roomId=["r"],
command=["<encode>Hi</encode>"],
context=["<encode>Be brief</encode>"],
media=[],

paramValues=[{}]);`);
	});

	it("commits a stopped turn by replaying it with its parts and a hidden note", () => {
		const turn = { engine: "m", roomId: "r", command: "Hi" };
		const pixel = chatPixels.ask(turn, {
			responseParts: [{ type: "TEXT", text: "Hel" }],
			hiddenMessage: "stopped",
		});
		expect(pixel).toBe(
			`${chatPixels.ask(turn).slice(0, -2)}, responseParts=[{"type":"TEXT","text":"Hel"}], hiddenMessage=["<encode>stopped</encode>"]);`,
		);
	});

	it("saves tool results through AddPlaygroundToolExecution", () => {
		expect(
			chatPixels.addToolExecution({
				engine: "m",
				roomId: "r",
				parentMessageId: "p",
				toolId: "call-1",
				toolName: "folder_read",
				toolExecutionResponse: "contents",
				paramValues: { tools: [] },
				mcpToolStatus: "success",
				toolParameterValues: { path: "a.txt" },
			}),
		).toBe(`AddPlaygroundToolExecution(engine=["m"],
roomId=["r"],
parentMessageId=["p"],
toolId=["call-1"],
toolName=["folder_read"],
toolExecutionResponse=["<encode>contents</encode>"],
paramValues=[{"tools":[]}],
mcpToolStatus="success",
toolParameterValues=[{"path":"a.txt"}]);`);
	});

	it("lists rooms through GetPlaygroundRooms", () => {
		expect(chatPixels.getRooms({ pinned: true })).toBe(
			'META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);',
		);
		expect(
			chatPixels.getRooms({ search: "plan", limit: 25, offset: 50 }),
		).toBe(
			'META | GetPlaygroundRooms(search="<encode>plan</encode>", limit=25, offset=50, sort=["DESC"]);',
		);
		expect(
			chatPixels.getRooms({
				roomOptionsSearch: "scope:widget",
				sort: "ASC",
				mode: "collaboration",
			}),
		).toBe(
			'META | GetPlaygroundRooms(roomOptionsSearch="scope:widget", sort=["ASC"], mode="collaboration");',
		);
	});

	it("builds the other room pixels", () => {
		expect(chatPixels.getMessages("r")).toBe(
			'GetPlaygroundMessages(roomId=["r"]);',
		);
		expect(chatPixels.getRoomOptions("r")).toBe(
			'GetRoomOptions(roomId="r");',
		);
		expect(chatPixels.setRoomForInsight("r")).toBe(
			'SetRoomForInsight(roomId="r");',
		);
		expect(chatPixels.updateRoomOptions("r", { modelId: "m" })).toBe(
			'UpdateRoomOptions(roomId="r", roomOptions=[{"modelId":"m"}]);',
		);
		expect(chatPixels.removeRoom("r")).toBe(
			'RemoveUserRoom(roomId=["r"]);',
		);
		expect(chatPixels.renameRoom("r", "Plans")).toBe(
			'META | RenameRoom(roomId=["r"], name=["<encode>Plans</encode>"]);',
		);
		expect(chatPixels.pinRoom("r", false)).toBe(
			'PinRoom(roomId=["r"], pinned=[false]);',
		);
		expect(chatPixels.stopJob("job-1")).toBe(
			'StopPixelExecution(id=["job-1"]);',
		);
		expect(
			chatPixels.submitFeedback({
				roomId: "r",
				messageId: "m",
				rating: true,
			}),
		).toBe(
			'SubmitLlmFeedback(messageId="m", feedbackText="", rating=true, roomId="r");',
		);
		expect(
			chatPixels.exportMarkdown({
				markdown: "# Hi",
				fileName: "Chat Room Export",
				format: "pdf",
			}),
		).toBe(
			'ToPdf(markdown=["<encode># Hi</encode>"], fileName="Chat Room Export");',
		);
		expect(
			chatPixels.compactMessages({
				roomId: "r",
				parentMessageId: "p",
				strategy: "SUMMARY",
			}),
		).toBe(
			'CompactRoomMessages(roomId="r", parentMessageId="p", compactionTypes=["SUMMARY"]);',
		);
		expect(chatPixels.generateRoomName({ roomId: "r", engine: "m" })).toBe(
			'GenerateRoomName(roomId="r", engine="m");',
		);
	});
});
