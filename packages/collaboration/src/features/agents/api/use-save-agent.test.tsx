import { act, renderHook } from "@testing-library/react";
import type { InsightActions } from "@/lib/pixel";
import type { Agent } from "@/types/agent";
import { agentFromWorkspace } from "../utils/agent-from-workspace";
import { useSaveAgent } from "./use-save-agent";

const agent: Agent = {
	id: "draft-1",
	name: "Research team",
	role: "Research",
	type: "Team",
	icon: "users",
	tone: "green",
	workspace: "Conversation",
	instructions: "Delegate research",
	skills: ["Research"],
	databases: [],
	dataProducts: [],
	members: ["specialist-1"],
	depth: 3,
	concurrency: 2,
	spawn: true,
	triggers: [],
};

function createActions() {
	const run = vi.fn(async (statement: string) => ({
		pixelReturn: [
			{
				output: statement.startsWith("AddWorkspace")
					? "workspace-1"
					: statement.startsWith("GetWorkspace")
						? { workspace_id: "workspace-1", name: agent.name }
						: true,
				operationType: [],
			},
		],
	}));
	return { actions: { run } as unknown as InsightActions, run };
}

describe("useSaveAgent", () => {
	it("retries settings on the created workspace and refreshes only on full success", async () => {
		const { actions, run } = createActions();
		run.mockResolvedValueOnce({
			pixelReturn: [{ output: "workspace-1", operationType: [] }],
		});
		run.mockResolvedValueOnce({
			pixelReturn: [
				{
					output: { workspace_id: "workspace-1", name: agent.name },
					operationType: [],
				},
			],
		});
		run.mockRejectedValueOnce(new Error("Settings failed"));
		const onSaved = vi.fn();
		const { result, rerender } = renderHook(() =>
			useSaveAgent({ actions, agents: [], onSaved }),
		);

		await act(async () => {
			await expect(result.current(agent, ["skill-1"])).rejects.toThrow(
				"The agent was created",
			);
		});
		expect(onSaved).not.toHaveBeenCalled();
		rerender();
		await act(async () => {
			await expect(
				result.current(
					{ ...agent, instructions: "Revised instructions" },
					["skill-1"],
				),
			).resolves.toBe("workspace-1");
		});
		expect(
			run.mock.calls.filter(([statement]) =>
				statement.startsWith("AddWorkspace"),
			),
		).toHaveLength(1);
		expect(run.mock.lastCall?.[0]).toContain('workspaceId=["workspace-1"]');
		expect(run.mock.lastCall?.[0]).toContain(
			'systemPrompt=["Revised instructions"]',
		);
		expect(run.mock.lastCall?.[0]).toContain('skills=["skill-1"]');
		expect(run.mock.lastCall?.[0]).toContain("maxSubagentDepth=[1]");
		expect(run.mock.lastCall?.[0]).toContain("maxSpawnsPerTurn=[4]");
		expect(run.mock.lastCall?.[0]).toContain("maxTurns=[40]");
		expect(run.mock.lastCall?.[0]).toContain(
			'subagents=[{"workspaceId":"specialist-1"}]',
		);
		expect(onSaved).toHaveBeenCalledTimes(1);
	});

	it("uses the edit route id even when the agent is absent from the list", async () => {
		const { actions, run } = createActions();
		const { result } = renderHook(() =>
			useSaveAgent({ actions, agents: [], onSaved: vi.fn() }),
		);
		await act(async () => {
			await expect(
				result.current(agent, [], "workspace-1"),
			).resolves.toBe("workspace-1");
		});
		expect(run).toHaveBeenCalledTimes(2);
		expect(run.mock.calls[0][0]).toMatch(/^GetWorkspace/);
	});

	it("round-trips existing knowledge and toolbox ids without sending display metadata", async () => {
		const mcp = [
			{ type: "VECTOR", id: "vector-1", name: "Knowledge" },
			{ type: "PROJECT", id: "toolbox-1", name: "Toolbox" },
		] satisfies NonNullable<Agent["mcp"]>;
		const loaded = agentFromWorkspace({
			workspace_id: "workspace-1",
			name: agent.name,
			description: agent.role,
			system_prompt: agent.instructions,
			mcp,
			skills: [],
			prompts: [],
		});
		expect(loaded.mcp).toEqual(mcp);
		const { actions, run } = createActions();
		const { result } = renderHook(() =>
			useSaveAgent({ actions, agents: [], onSaved: vi.fn() }),
		);
		await act(async () => {
			await result.current(loaded, [], "workspace-1");
		});
		expect(run.mock.lastCall?.[0]).toContain(
			'mcp=[{"type":"VECTOR","id":"vector-1"},{"type":"PROJECT","id":"toolbox-1"}]',
		);
		expect(run.mock.lastCall?.[0]).not.toContain('"name":"Knowledge"');
	});

	it.each([{ members: [] }, { members: ["specialist-1"] }])(
		"creates agents with default execution limits: %j",
		async ({ members }) => {
			const { actions, run } = createActions();
			const { result } = renderHook(() =>
				useSaveAgent({ actions, agents: [], onSaved: vi.fn() }),
			);
			await act(async () => {
				await result.current({ ...agent, members });
			});
			expect(run.mock.lastCall?.[0]).toContain("maxSubagentDepth=[1]");
			expect(run.mock.lastCall?.[0]).toContain("maxSpawnsPerTurn=[4]");
			expect(run.mock.lastCall?.[0]).toContain("maxTurns=[40]");
			expect(run.mock.lastCall?.[0]).not.toContain("maxSubagentsPerRun");
		},
	);

	it.each(["route", "catalog"])(
		"preserves hidden limits when editing an existing agent from the %s",
		async (source) => {
			const { actions, run } = createActions();
			const { result } = renderHook(() =>
				useSaveAgent({
					actions,
					agents: source === "catalog" ? [agent] : [],
					onSaved: vi.fn(),
				}),
			);
			await act(async () => {
				await result.current(
					agent,
					[],
					source === "route" ? "workspace-1" : undefined,
				);
			});
			expect(run).toHaveBeenCalledTimes(2);
			expect(run.mock.lastCall?.[0]).toMatch(/^EditWorkspace\(/);
			expect(run.mock.lastCall?.[0]).not.toMatch(
				/maxTurns|maxSubagentDepth|maxSubagentsPerRun|maxSpawnsPerTurn/,
			);
		},
	);
});
