import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "./base";
import {
	addWorkspace,
	addWorkspacePixel,
	deleteWorkspace,
	type EditWorkspaceParams,
	editWorkspace,
	editWorkspacePixel,
	getWorkspace,
	getWorkspaceRooms,
	getWorkspaceRoomsPixel,
	readWorkspaceSaveWarning,
} from "./workspace";

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

/** An agent's whole configuration, as the agent form sends it. */
const CONFIG: EditWorkspaceParams = {
	name: "Researcher",
	description: 'Finds "things"',
	systemPrompt: "Line one\nLine two",
	mcp: [{ id: "vec-1", name: "Policies", type: "VECTOR" }],
	skills: ["skill-1"],
	prompts: ["prompt-1"],
	modelId: "model-1",
	useDefaultAgentTools: false,
	disabledDefaultTools: ["WebSearch"],
	maxTurns: "12",
	maxReflections: "",
	maxSeconds: "600",
	maxSubagentDepth: "",
	maxSubagentsPerRun: "",
	maxSpawnsPerTurn: "",
	subagents: [{ workspaceId: "agent-2" }],
	hooks: [{ kind: "log_tools" }],
	greeting: "Hello",
	greetingEnabled: true,
};

beforeEach(() => {
	mockRunPixel.mockReset();
});

describe("getWorkspace", () => {
	it("reads an agent in the insight it is given", async () => {
		mockRunPixel.mockResolvedValue(
			answer([
				{
					output: {
						workspace_id: "agent-1",
						name: "agent",
						display_name: "Agent",
						mcp: [
							{ id: "tool-1", name: "Search", type: "FUNCTION" },
						],
						config_json: { model_id: "model-1" },
					},
				},
			]),
		);

		const workspace = await getWorkspace("insight-1", "agent-1");

		expect(mockRunPixel).toHaveBeenCalledWith(
			'GetWorkspace(workspaceId=["agent-1"]);',
			"insight-1",
		);
		expect(workspace).toMatchObject({
			workspace_id: "agent-1",
			display_name: "Agent",
			mcp: [{ id: "tool-1", name: "Search", type: "FUNCTION" }],
			// lists the backend leaves out read as empty
			skills: [],
			prompts: [],
			config_json: { model_id: "model-1" },
		});
	});

	it("parses settings that arrive as a string, and drops ones it cannot read", async () => {
		mockRunPixel.mockResolvedValueOnce(
			answer([
				{
					output: {
						workspace_id: "agent-1",
						name: "Agent",
						config_json:
							'{"greeting":"Hi","greeting_enabled":true}',
					},
				},
			]),
		);
		await expect(
			getWorkspace("insight-1", "agent-1"),
		).resolves.toMatchObject({
			config_json: { greeting: "Hi", greeting_enabled: true },
		});

		mockRunPixel.mockResolvedValueOnce(
			answer([
				{
					output: {
						workspace_id: "agent-1",
						name: "Agent",
						config_json: "{not json",
					},
				},
			]),
		);
		const broken = await getWorkspace("insight-1", "agent-1");
		expect(broken.config_json).toBeUndefined();
	});

	it("throws for an error or a missing agent", async () => {
		mockRunPixel.mockResolvedValueOnce(answer([], ["No access"]));
		await expect(getWorkspace("insight-1", "agent-1")).rejects.toThrow(
			"No access",
		);

		mockRunPixel.mockResolvedValueOnce(answer([{ output: null }]));
		await expect(getWorkspace("insight-1", "agent-1")).rejects.toThrow(
			"No agent agent-1",
		);
	});
});

describe("adding and editing agents", () => {
	it("builds the AddWorkspace and EditWorkspace pixels", () => {
		expect(addWorkspacePixel(CONFIG)).toBe(
			'AddWorkspace(name="Researcher", description="Finds \\"things\\"", systemPrompt="Line one\\nLine two", mcp=[{"id":"vec-1","name":"Policies","type":"VECTOR"}], skills=["skill-1"], prompts=["prompt-1"]);',
		);
		expect(editWorkspacePixel("agent-1", CONFIG)).toBe(
			'EditWorkspace(workspaceId=["agent-1"], name="Researcher", description="Finds \\"things\\"", systemPrompt="Line one\\nLine two", mcp=[{"id":"vec-1","name":"Policies","type":"VECTOR"}], skills=["skill-1"], prompts=["prompt-1"], modelId="model-1", useDefaultAgentTools=false, disabledDefaultTools=["WebSearch"], maxTurns="12", maxReflections="", maxSeconds="600", maxSubagentDepth="", maxSubagentsPerRun="", maxSpawnsPerTurn="", subagents=[{"workspaceId":"agent-2"}], hooks=[{"kind":"log_tools"}], greeting="Hello", greetingEnabled=true);',
		);
	});

	it("creates an agent and returns its id, and throws when there is none", async () => {
		mockRunPixel.mockResolvedValueOnce(answer([{ output: "agent-9" }]));
		await expect(addWorkspace("insight-1", CONFIG)).resolves.toBe(
			"agent-9",
		);
		expect(mockRunPixel).toHaveBeenCalledWith(
			addWorkspacePixel(CONFIG),
			"insight-1",
		);

		mockRunPixel.mockResolvedValueOnce(answer([{ output: "" }]));
		await expect(addWorkspace("insight-1", CONFIG)).rejects.toThrow();
	});

	it("saves an agent and returns its partial-save warning", async () => {
		mockRunPixel.mockResolvedValueOnce(
			answer([{ output: { warning: "Hooks were not saved" } }]),
		);
		await expect(
			editWorkspace("insight-1", "agent-1", CONFIG),
		).resolves.toBe("Hooks were not saved");
		expect(mockRunPixel).toHaveBeenCalledWith(
			editWorkspacePixel("agent-1", CONFIG),
			"insight-1",
		);

		mockRunPixel.mockResolvedValueOnce(answer([{ output: true }]));
		await expect(
			editWorkspace("insight-1", "agent-1", CONFIG),
		).resolves.toBeUndefined();

		mockRunPixel.mockResolvedValueOnce(answer([{ output: null }]));
		await expect(
			editWorkspace("insight-1", "agent-1", CONFIG),
		).rejects.toThrow();
	});

	it("reads a warning only when it is a string", () => {
		expect(readWorkspaceSaveWarning({ warning: "w" })).toBe("w");
		expect(readWorkspaceSaveWarning({ warning: 1 })).toBeUndefined();
		expect(readWorkspaceSaveWarning(true)).toBeUndefined();
		expect(readWorkspaceSaveWarning(null)).toBeUndefined();
	});
});

describe("deleteWorkspace", () => {
	it("deletes an agent and throws what the backend reports", async () => {
		mockRunPixel.mockResolvedValueOnce(answer([{ output: true }]));
		await deleteWorkspace("insight-1", "agent-1");
		expect(mockRunPixel).toHaveBeenCalledWith(
			"DeleteWorkspace(workspaceId=['agent-1'])",
			"insight-1",
		);

		mockRunPixel.mockResolvedValueOnce(answer([], ["Only owners"]));
		await expect(deleteWorkspace("insight-1", "agent-1")).rejects.toThrow(
			"Only owners",
		);
	});
});

describe("getWorkspaceRooms", () => {
	it("builds one page's pixel, with a search when there is one", () => {
		expect(
			getWorkspaceRoomsPixel({
				workspaceId: "agent-1",
				limit: 25,
				offset: 0,
			}),
		).toBe(
			'GetWorkspaceRooms(workspaceId=["agent-1"],  limit=[25], offset=[0]);',
		);
		expect(
			getWorkspaceRoomsPixel({
				workspaceId: "agent-1",
				search: "plan",
				limit: 25,
				offset: 50,
			}),
		).toBe(
			'GetWorkspaceRooms(workspaceId=["agent-1"], filters=[Filter(ROOM__ROOM_NAME ?like "<encode>plan</encode>")], limit=[25], offset=[50]);',
		);
	});

	it("reads a page, and an empty one when the backend sends none", async () => {
		const room = {
			room_id: "room-1",
			room_name: "Plan",
			date_updated: "2026-01-01 00:00:00",
		};
		mockRunPixel.mockResolvedValueOnce(
			answer([{ output: { total_count: 3, rooms: [room] } }]),
		);
		await expect(
			getWorkspaceRooms("insight-1", {
				workspaceId: "agent-1",
				limit: 1,
				offset: 0,
			}),
		).resolves.toEqual({ total_count: 3, rooms: [room] });

		mockRunPixel.mockResolvedValueOnce(answer([{ output: null }]));
		await expect(
			getWorkspaceRooms("insight-1", {
				workspaceId: "agent-1",
				limit: 1,
				offset: 0,
			}),
		).resolves.toEqual({ total_count: 0, rooms: [] });
	});
});
