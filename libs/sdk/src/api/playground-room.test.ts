import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "./base";
import {
	addPlaygroundToolExecutionPixel,
	askPlaygroundPixel,
	compactPlaygroundRoom,
	createPlaygroundRoom,
	getFollowUpQuestionsPixel,
	getModelContextWindow,
	getPlaygroundMessages,
	getPlaygroundRoomOptions,
	getPlaygroundRoomsPixel,
	loadPlaygroundRoom,
	pinUserRoom,
	removeUserRoom,
	renameUserRoom,
	submitLlmFeedback,
	throwOnPixelErrors,
} from "./playground-room";

vi.mock("./base", () => ({
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);

/** A pixel response with the given statements and errors. */
const answer = (pixelReturn: { output: unknown }[], errors: string[] = []) =>
	({
		errors,
		insightId: "insight-1",
		pixelReturn,
	}) as unknown as Awaited<ReturnType<typeof runPixel>>;

beforeEach(() => {
	mockRunPixel.mockReset();
});

describe("throwOnPixelErrors", () => {
	it("passes a clean result through and throws every error", () => {
		const clean = { errors: [], value: 1 };
		expect(throwOnPixelErrors(clean)).toBe(clean);
		expect(() => throwOnPixelErrors({ errors: ["a", "b"] })).toThrow("ab");
	});
});

describe("playground rooms", () => {
	it("runs each call in the insight it is given", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: true }]));

		await removeUserRoom("insight-1", "room-1");
		await renameUserRoom("insight-1", "room-1", "Plan");
		await pinUserRoom("insight-1", "room-1", true);

		expect(mockRunPixel.mock.calls).toEqual([
			['RemoveUserRoom(roomId=["room-1"]);', "insight-1"],
			[
				'META | RenameRoom(roomId=["room-1"], name=["<encode>Plan</encode>"]);',
				"insight-1",
			],
			['PinRoom(roomId=["room-1"], pinned=[true]);', "insight-1"],
		]);
	});

	it("throws what the backend reports", async () => {
		mockRunPixel.mockResolvedValue(answer([], ["No access to that room"]));
		await expect(removeUserRoom("insight-1", "room-1")).rejects.toThrow(
			"No access to that room",
		);
	});

	it("reads a model's context window", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: 200_000 }]));
		await expect(
			getModelContextWindow("insight-1", "engine-1"),
		).resolves.toBe(200_000);
		expect(mockRunPixel).toHaveBeenCalledWith(
			'META | GetContextWindow("engine-1");',
			"insight-1",
		);
	});
});

describe("loadPlaygroundRoom", () => {
	it("reads the messages and options and binds the room in one pixel", async () => {
		mockRunPixel.mockResolvedValue(
			answer([
				{ output: [{ messageId: "m-1" }] },
				{ output: { OPTIONS: { mode: "chat" }, ROOM_NAME: "Notes" } },
				{ output: true },
			]),
		);

		await expect(loadPlaygroundRoom("new", "room-1")).resolves.toEqual({
			insightId: "insight-1",
			messages: [{ messageId: "m-1" }],
			options: { mode: "chat" },
			name: "Notes",
		});
		expect(mockRunPixel).toHaveBeenCalledTimes(1);
		expect(mockRunPixel).toHaveBeenCalledWith(
			'GetPlaygroundMessages(roomId=["room-1"]); GetRoomOptions(roomId="room-1"); SetRoomForInsight(roomId="room-1");',
			"new",
		);
	});

	it("reads a room with no options, and throws the backend's errors", async () => {
		mockRunPixel.mockResolvedValueOnce(
			answer([{ output: undefined }, { output: {} }, { output: true }]),
		);
		await expect(
			loadPlaygroundRoom("insight-1", "room-1"),
		).resolves.toEqual({
			insightId: "insight-1",
			messages: [],
			options: undefined,
			name: undefined,
		});

		mockRunPixel.mockResolvedValueOnce(answer([], ["No room"]));
		await expect(loadPlaygroundRoom("insight-1", "room-1")).rejects.toThrow(
			"No room",
		);
	});
});

describe("getPlaygroundRoomOptions", () => {
	it("reads the options and the name", async () => {
		mockRunPixel.mockResolvedValue(
			answer([{ output: { OPTIONS: { instructions: "Hi" } } }]),
		);

		await expect(
			getPlaygroundRoomOptions("insight-1", "room-1"),
		).resolves.toEqual({
			options: { instructions: "Hi" },
			name: undefined,
		});
		expect(mockRunPixel).toHaveBeenCalledWith(
			'GetRoomOptions(roomId="room-1");',
			"insight-1",
		);
	});
});

describe("getPlaygroundMessages", () => {
	it("reads the messages and the insight they were read in", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: [{ io: "INPUT" }] }]));

		await expect(getPlaygroundMessages("new", "room-1")).resolves.toEqual({
			insightId: "insight-1",
			messages: [{ io: "INPUT" }],
		});
		expect(mockRunPixel).toHaveBeenCalledWith(
			'GetPlaygroundMessages(roomId=["room-1"]);',
			"new",
		);
	});
});

describe("createPlaygroundRoom", () => {
	it("creates a room, for an agent or for none", async () => {
		mockRunPixel.mockResolvedValue(
			answer([{ output: { roomId: "room-9" } }]),
		);

		await expect(createPlaygroundRoom("new")).resolves.toEqual({
			roomId: "room-9",
			insightId: "insight-1",
		});
		await createPlaygroundRoom("new", "agent-1");

		expect(mockRunPixel.mock.calls).toEqual([
			["CreatePlaygroundRoom()", "new"],
			['CreatePlaygroundRoom(workspaceId="agent-1")', "new"],
		]);
	});

	it("throws when the backend names no room", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: {} }]));

		await expect(createPlaygroundRoom("new")).rejects.toThrow(
			"CreatePlaygroundRoom returned no room.",
		);
	});
});

describe("compactPlaygroundRoom", () => {
	it("compacts into a response, with one method or the backend's pick", async () => {
		const results = [{ type: "SUMMARY", success: true }];
		mockRunPixel.mockResolvedValue(answer([{ output: results }]));

		await expect(
			compactPlaygroundRoom("insight-1", {
				roomId: "room-1",
				parentMessageId: "m-2",
			}),
		).resolves.toBe(results);
		await compactPlaygroundRoom("insight-1", {
			roomId: "room-1",
			parentMessageId: "m-2",
			strategy: "TOOL_PRUNE",
		});

		expect(mockRunPixel.mock.calls.map(([pixel]) => pixel)).toEqual([
			'CompactRoomMessages(roomId="room-1", parentMessageId="m-2");',
			'CompactRoomMessages(roomId="room-1", parentMessageId="m-2", compactionTypes=["TOOL_PRUNE"]);',
		]);
	});
});

describe("submitLlmFeedback", () => {
	it("rates a response, or clears its rating", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: true }]));

		await submitLlmFeedback("insight-1", {
			roomId: "room-1",
			messageId: "m-2",
			rating: null,
			feedbackText: "",
		});

		expect(mockRunPixel).toHaveBeenCalledWith(
			'SubmitLlmFeedback(messageId="m-2", feedbackText="", rating=null, roomId="room-1");',
			"insight-1",
		);
	});

	it("throws the backend's errors", async () => {
		mockRunPixel.mockResolvedValue(answer([], ["Denied"]));

		await expect(
			submitLlmFeedback("insight-1", {
				roomId: "room-1",
				messageId: "m-2",
				rating: true,
				feedbackText: "",
			}),
		).rejects.toThrow("Denied");
	});
});

describe("getPlaygroundRoomsPixel", () => {
	it("lists the pinned rooms, newest first", () => {
		expect(getPlaygroundRoomsPixel({ pinned: true, sort: "DESC" })).toBe(
			'META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);',
		);
	});

	it("sorts, groups, searches, filters and pages, in that order", () => {
		expect(
			getPlaygroundRoomsPixel({
				sortBy: "name",
				sort: "ASC",
				groupBy: "agent",
				search: 'say "hi"',
				searchMessages: true,
				workspaceId: "ws-1",
				roomIds: ["a", "b"],
				limit: 25,
				offset: 50,
			}),
		).toBe(
			'META | GetPlaygroundRooms(sortBy=["name"], sort=["ASC"], groupBy=["agent"], search=["<encode>say "hi"</encode>"], searchMessages=[true], workspaceId=["ws-1"], roomIds=["a","b"], limit=[25], offset=[50]);',
		);
	});

	it("lists every room with no query, and matches messages only with a search", () => {
		expect(getPlaygroundRoomsPixel()).toBe("META | GetPlaygroundRooms();");
		expect(getPlaygroundRoomsPixel({ searchMessages: true })).toBe(
			"META | GetPlaygroundRooms();",
		);
	});
});

describe("getFollowUpQuestionsPixel", () => {
	it("asks the model to follow a response, with what the room can do", () => {
		expect(
			getFollowUpQuestionsPixel({
				engineId: "model-1",
				roomId: "room-1",
				parentMessageId: "m-2",
				suggestionContext: { tools: [], unavailableReactors: ["Mail"] },
			}),
		).toBe(
			'GenerateFollowUpQuestions(engine=["model-1"], roomId=["room-1"], parentMessageId=["m-2"], suggestionContext=[{"tools":[],"unavailableReactors":["Mail"]}]);',
		);
	});
});

describe("askPlaygroundPixel", () => {
	const turn = {
		engineId: "model-1",
		roomId: "room-1",
		command: "find cats",
		context: "",
		media: [],
		parentMessageId: "",
		paramValues: {},
	};

	it("leaves out an empty context, media and parent", () => {
		expect(askPlaygroundPixel(turn)).toBe(
			'AskPlayground(engine=["model-1"],\nroomId=["room-1"],\ncommand=["<encode>find cats</encode>"],\ncontext=[],\nmedia=[],\n\nparamValues=[{}]);',
		);
	});

	it("saves a stopped turn with the same params, what streamed and the hidden note", () => {
		expect(
			askPlaygroundPixel(
				{
					...turn,
					context: "Be brief",
					media: ["/a.pdf"],
					parentMessageId: "m-1",
					paramValues: { temperature: 0.2 },
				},
				{ responseParts: [{ type: "TEXT" }], hiddenMessage: "Stopped" },
			),
		).toBe(
			'AskPlayground(engine=["model-1"],\nroomId=["room-1"],\ncommand=["<encode>find cats</encode>"],\ncontext=["<encode>Be brief</encode>"],\nmedia=["/a.pdf"],\nparentMessageId=["m-1"],\nparamValues=[{"temperature":0.2}], responseParts=[{"type":"TEXT"}], hiddenMessage=["<encode>Stopped</encode>"]);',
		);
	});
});

describe("addPlaygroundToolExecutionPixel", () => {
	it("saves a tool result, and a stopped reply with what streamed", () => {
		const result = {
			engineId: "model-1",
			roomId: "room-1",
			parentMessageId: "m-1",
			toolId: "t-1",
			toolName: "lookup",
			toolExecutionResponse: "3 cats",
			paramValues: { tools: [] },
			mcpToolStatus: "success" as const,
			toolParameterValues: { q: "cats" },
		};
		const params =
			'engine=["model-1"],\nroomId=["room-1"],\nparentMessageId=["m-1"],\ntoolId=["t-1"],\ntoolName=["lookup"],\ntoolExecutionResponse=["<encode>3 cats</encode>"],\nparamValues=[{"tools":[]}],\nmcpToolStatus="success",\ntoolParameterValues=[{"q":"cats"}]';
		expect(addPlaygroundToolExecutionPixel(result)).toBe(
			`AddPlaygroundToolExecution(${params});`,
		);
		expect(
			addPlaygroundToolExecutionPixel(result, {
				responseParts: [],
				hiddenMessage: "Stopped",
			}),
		).toBe(
			`AddPlaygroundToolExecution(${params}, responseParts=[], hiddenMessage=["<encode>Stopped</encode>"]);`,
		);
	});
});
