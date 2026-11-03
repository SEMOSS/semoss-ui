import { afterEach, describe, expect, it, vi } from "vitest";
import {
	buildAdminAgentRunRoomsPixel,
	buildAgentRunRoomsPixel,
	closeAdminAgentRunRoom,
	closeAgentRoom,
	EMPTY_AGENT_RUN_ROOM_FILTERS,
	getAdminAgentRunAgents,
	getAdminAgentRunUsers,
	getAgentRun,
	getAgentRunModelInfo,
	getAllAgentRunsForRoom,
	getSubagentRuns,
	parseAgentRunRooms,
} from "./agent-runs";

const mocks = vi.hoisted(() => ({
	runPixel: vi.fn(),
	getAgentRun: vi.fn(),
	getSubagentRuns: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({ runPixel: mocks.runPixel }));
// the user's own run reads go through the SDK's agent API
vi.mock("@semoss/sdk", () => ({
	getAgentRun: mocks.getAgentRun,
	getSubagentRuns: mocks.getSubagentRuns,
}));

/** Answers the next pixel with this output */
const answer = (output: unknown, operationType = "OPERATION") => {
	mocks.runPixel.mockResolvedValueOnce({
		pixelReturn: [{ operationType: [operationType], output }],
	});
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("buildAdminAgentRunRoomsPixel", () => {
	it("reads the first page of every room with no filters", () => {
		expect(
			buildAdminAgentRunRoomsPixel(EMPTY_AGENT_RUN_ROOM_FILTERS, 0),
		).toBe("AdminGetAgentRunRooms(limit=[25], offset=[0]);");
	});

	it("narrows to an agent, a user and the statuses of runs still going", () => {
		expect(
			buildAdminAgentRunRoomsPixel(
				{
					agentId: " agent-a ",
					userId: "alice",
					userType: "MICROSOFT",
					search: " report ",
					status: "active",
				},
				2,
			),
		).toBe(
			'AdminGetAgentRunRooms(limit=[25], offset=[50], agentId=["agent-a"], userId=["alice"], userType=["MICROSOFT"], search=["report"], status=["SUBMITTED", "RUNNING", "INPUT_REQUIRED"]);',
		);
	});

	it("narrows to a user's id alone when their login type is not known", () => {
		expect(
			buildAdminAgentRunRoomsPixel(
				{ ...EMPTY_AGENT_RUN_ROOM_FILTERS, userId: "alice" },
				0,
			),
		).toBe(
			'AdminGetAgentRunRooms(limit=[25], offset=[0], userId=["alice"]);',
		);
	});

	it("sends no login type without a user", () => {
		expect(
			buildAdminAgentRunRoomsPixel(
				{ ...EMPTY_AGENT_RUN_ROOM_FILTERS, userType: "NATIVE" },
				0,
			),
		).toBe("AdminGetAgentRunRooms(limit=[25], offset=[0]);");
	});

	it("keeps preprocessor markup out of an argument", () => {
		expect(
			buildAdminAgentRunRoomsPixel(
				{ ...EMPTY_AGENT_RUN_ROOM_FILTERS, userId: "<encode>x" },
				0,
			),
		).toContain('userId=["\\u003cencode>x"]');
	});

	it("refuses a page that is not a whole number", () => {
		expect(() =>
			buildAdminAgentRunRoomsPixel(EMPTY_AGENT_RUN_ROOM_FILTERS, -1),
		).toThrow("Invalid agent runs page.");
	});
});

describe("buildAgentRunRoomsPixel", () => {
	it("reads the first page of the user's own rooms with the agent", () => {
		expect(buildAgentRunRoomsPixel(" agent-a ", "", "all", 0)).toBe(
			'GetAgentRunRooms(limit=[25], offset=[0], agentId=["agent-a"]);',
		);
	});

	it("narrows to a room search and the statuses of failed runs", () => {
		expect(
			buildAgentRunRoomsPixel("agent-a", " report ", "failed", 1),
		).toBe(
			'GetAgentRunRooms(limit=[25], offset=[25], agentId=["agent-a"], search=["report"], status=["FAILED"]);',
		);
	});
});

describe("parseAgentRunRooms", () => {
	it("reads each room, and leaves out a room with no room or user", () => {
		const page = parseAgentRunRooms({
			rooms: [
				{
					roomId: "r1",
					roomName: "Quarterly report",
					userId: "alice",
					userName: "Alice Doe",
					userEmail: "alice@example.com",
					userType: "NATIVE",
					agentId: "agent-a",
					agentName: "Agent A",
					runCount: 2,
					activeRunCount: 1,
					failedRunCount: 0,
					isClosed: true,
					firstRunAt: "2026-10-01 10:00:00",
					lastActivityAt: "2026-10-01 11:00:00",
				},
				{ roomId: "r2" },
				"not a room",
			],
			total: 3,
		});

		expect(page.total).toBe(3);
		expect(page.rooms).toHaveLength(1);
		expect(page.rooms[0]).toMatchObject({
			roomId: "r1",
			userName: "Alice Doe",
			agentName: "Agent A",
			runCount: 2,
			activeRunCount: 1,
			isClosed: true,
		});
	});

	it("gives a room with no names or counts empty values", () => {
		const page = parseAgentRunRooms({
			rooms: [{ roomId: "r1", userId: "bob", roomName: "" }],
			total: "1",
		});
		expect(page.rooms[0]).toMatchObject({
			roomName: null,
			userName: null,
			agentId: null,
			runCount: 0,
			isClosed: false,
		});
		expect(page.total).toBe(0);
	});

	it("refuses a reply with no rooms", () => {
		expect(() => parseAgentRunRooms({ total: 0 })).toThrow(
			"The agent runs response is missing its rooms.",
		);
	});
});

describe("closeAdminAgentRunRoom", () => {
	it("closes a user's room and reads what it closed and stopped", async () => {
		answer({
			roomId: "r1",
			closedRoomIds: ["r1", "r1-sub"],
			cancelledRunIds: ["run2", 7],
		});

		await expect(
			closeAdminAgentRunRoom("r1", "alice", "NATIVE"),
		).resolves.toEqual({
			closedRoomIds: ["r1", "r1-sub"],
			cancelledRunIds: ["run2"],
		});
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'AdminCloseRoom(roomId=["r1"], userId=["alice"], userType=["NATIVE"]);',
		);
	});

	it("matches the user's id alone when their login type is not known", async () => {
		answer({ closedRoomIds: ["r1"], cancelledRunIds: [] });

		await closeAdminAgentRunRoom("r1", "alice", null);
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'AdminCloseRoom(roomId=["r1"], userId=["alice"]);',
		);
	});

	it("gives the backend's reason when the room is not closed", async () => {
		answer("This functionality is limited to only admins", "ERROR");

		await expect(
			closeAdminAgentRunRoom("r1", "alice", "NATIVE"),
		).rejects.toThrow("This functionality is limited to only admins");
	});
});

describe("the agent and user filters' choices", () => {
	it("reads the most recently active agents, keeping only those with an id", async () => {
		answer([
			{ agentId: "agent-a", agentName: "Agent A", lastActivityAt: "x" },
			{ agentId: "agent-b" },
			{ agentName: "No id" },
		]);

		await expect(getAdminAgentRunAgents("")).resolves.toEqual([
			{ agentId: "agent-a", agentName: "Agent A" },
			{ agentId: "agent-b", agentName: null },
		]);
		expect(mocks.runPixel).toHaveBeenCalledWith(
			"AdminGetAgentRunAgents(limit=[25]);",
		);
	});

	it("searches the users, each an id and the login type their runs store", async () => {
		answer([
			{
				userId: "alice",
				userType: "MICROSOFT",
				userName: "Alice Contoso",
				userEmail: "alice@contoso.com",
			},
			{ userId: "bob" },
		]);

		await expect(getAdminAgentRunUsers(" contoso ")).resolves.toEqual([
			{
				userId: "alice",
				userType: "MICROSOFT",
				userName: "Alice Contoso",
				userEmail: "alice@contoso.com",
			},
			{ userId: "bob", userType: null, userName: null, userEmail: null },
		]);
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'AdminGetAgentRunUsers(limit=[25], search=["contoso"]);',
		);
	});

	it("gives the backend's reason when the choices cannot be read", async () => {
		answer("This functionality is limited to only admins", "ERROR");

		await expect(getAdminAgentRunUsers("")).rejects.toThrow(
			"This functionality is limited to only admins",
		);
	});
});

describe("closeAgentRoom", () => {
	it("closes the signed in user's own room", async () => {
		answer({
			roomId: "r1",
			closedRoomIds: ["r1"],
			cancelledRunIds: ["run2"],
		});

		await expect(closeAgentRoom("r1")).resolves.toEqual({
			closedRoomIds: ["r1"],
			cancelledRunIds: ["run2"],
		});
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'CloseRoom(roomId=["r1"]);',
		);
	});
});

describe("the user's own room reads", () => {
	it("reads every run in one of the user's rooms", async () => {
		answer([{ runId: "run1" }, "not a run"]);

		await expect(getAllAgentRunsForRoom("r1")).resolves.toEqual([
			{ runId: "run1" },
		]);
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'GetAllAgentRunsForRoom(roomId=["r1"]);',
		);
	});

	it("reads a run with its messages through the SDK, refusing a reply that is not one", async () => {
		mocks.getAgentRun.mockResolvedValueOnce({
			runId: "run1",
			messages: [],
			pendingActions: [],
		});
		await expect(getAgentRun("run1")).resolves.toEqual({
			runId: "run1",
			messages: [],
			pendingActions: [],
		});
		expect(mocks.getAgentRun).toHaveBeenCalledWith("run1", {
			includeMessages: true,
		});

		mocks.getAgentRun.mockResolvedValueOnce("not a run");
		await expect(getAgentRun("run1")).rejects.toThrow(
			"The agent run response is missing.",
		);
	});

	it("reads a run's subagent runs through the SDK", async () => {
		mocks.getSubagentRuns.mockResolvedValueOnce([
			{ runId: "child" },
			"not a run",
		]);
		await expect(getSubagentRuns("run1")).resolves.toEqual([
			{ runId: "child" },
		]);
		expect(mocks.getSubagentRuns).toHaveBeenCalledWith("run1");

		mocks.getSubagentRuns.mockResolvedValueOnce(null);
		await expect(getSubagentRuns("run1")).resolves.toEqual([]);
	});

	it("reads a model's display name, else its name", async () => {
		answer({ engine_display_name: "GPT Model", engine_name: "gpt" });
		await expect(getAgentRunModelInfo("model-1")).resolves.toEqual({
			name: "GPT Model",
		});
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'GetEngineMetadata(engine=["model-1"], metaKeys=[["engine_display_name", "engine_name"]]);',
		);

		answer({ engine_name: "gpt" });
		await expect(getAgentRunModelInfo("model-1")).resolves.toEqual({
			name: "gpt",
		});

		answer({});
		await expect(getAgentRunModelInfo("model-1")).resolves.toBeNull();
	});
});
