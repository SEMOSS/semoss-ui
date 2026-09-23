import { act, renderHook } from "@testing-library/react";
import type { InsightActions } from "@/lib/pixel";
import type { Agent } from "@/types/agent";
import { agentFromWorkspace } from "../utils/agent-from-workspace";
import { deleteAgentImage, uploadAgentImage } from "./agent-image";
import { useSaveAgent } from "./use-save-agent";

vi.mock("./agent-image", async (importOriginal) => ({
	...(await importOriginal<typeof import("./agent-image")>()),
	uploadAgentImage: vi.fn().mockResolvedValue(undefined),
	deleteAgentImage: vi.fn().mockResolvedValue(undefined),
}));

const agent: Agent = {
	id: "draft-1",
	name: "Research team",
	description: "Research",
	icon: "users",
	tone: "green",
	instructions: "Delegate research",
	skills: [{ id: "skill-1", name: "Research" }],
	mcp: [],
	members: ["specialist-1"],
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
	beforeEach(() => {
		vi.mocked(uploadAgentImage).mockReset().mockResolvedValue(undefined);
		vi.mocked(deleteAgentImage).mockReset().mockResolvedValue(undefined);
	});

	it("uploads only after creation, and retries the photo without creating a second agent", async () => {
		const { actions, run } = createActions();
		const onSaved = vi.fn();
		const file = new File(["image"], "photo.png", { type: "image/png" });
		vi.mocked(uploadAgentImage).mockImplementationOnce(async (id) => {
			expect(id).toBe("workspace-1");
			expect(run.mock.lastCall?.[0]).toMatch(/^EditWorkspace/);
			throw new Error("Upload unavailable");
		});
		const { result, rerender } = renderHook(() =>
			useSaveAgent({ actions, agents: [], onSaved }),
		);
		await act(async () => {
			await expect(
				result.current(agent, undefined, file),
			).rejects.toThrow("agent was saved, but its photo");
		});
		expect(onSaved).not.toHaveBeenCalled();
		rerender();
		await act(async () => {
			await expect(result.current(agent, undefined, file)).resolves.toBe(
				"workspace-1",
			);
		});
		expect(uploadAgentImage).toHaveBeenNthCalledWith(
			1,
			"workspace-1",
			file,
		);
		expect(uploadAgentImage).toHaveBeenNthCalledWith(
			2,
			"workspace-1",
			file,
		);
		expect(
			run.mock.calls.filter(([statement]) =>
				statement.startsWith("AddWorkspace"),
			),
		).toHaveLength(1);
		expect(onSaved).toHaveBeenCalledTimes(1);
	});

	it("waits for the photo upload before refreshing the agent catalog", async () => {
		const { actions } = createActions();
		const onSaved = vi.fn();
		let resolveUpload: () => void = () => undefined;
		vi.mocked(uploadAgentImage).mockReturnValue(
			new Promise<void>((resolve) => {
				resolveUpload = resolve;
			}),
		);
		const { result } = renderHook(() =>
			useSaveAgent({ actions, agents: [], onSaved }),
		);
		await act(async () => {
			const pending = result.current(
				agent,
				undefined,
				new File(["image"], "photo.png", { type: "image/png" }),
			);
			await vi.waitFor(() =>
				expect(uploadAgentImage).toHaveBeenCalledTimes(1),
			);
			expect(onSaved).not.toHaveBeenCalled();
			resolveUpload();
			await pending;
		});
		expect(onSaved).toHaveBeenCalledTimes(1);
	});

	it("does not upload if creating the agent fails", async () => {
		const { actions, run } = createActions();
		run.mockRejectedValueOnce(new Error("Create failed"));
		const { result } = renderHook(() =>
			useSaveAgent({ actions, agents: [], onSaved: vi.fn() }),
		);
		await act(async () => {
			await expect(
				result.current(
					agent,
					undefined,
					new File(["image"], "photo.png"),
				),
			).rejects.toThrow("Create failed");
		});
		expect(uploadAgentImage).not.toHaveBeenCalled();
	});

	it("removes a photo only when explicitly requested", async () => {
		const { actions } = createActions();
		const { result } = renderHook(() =>
			useSaveAgent({ actions, agents: [], onSaved: vi.fn() }),
		);
		await act(async () => {
			await result.current(agent, "workspace-1");
		});
		expect(deleteAgentImage).not.toHaveBeenCalled();
		await act(async () => {
			await result.current(agent, "workspace-1", null);
		});
		expect(deleteAgentImage).toHaveBeenCalledWith("workspace-1");
		expect(uploadAgentImage).not.toHaveBeenCalled();
	});
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
			await expect(result.current(agent)).rejects.toThrow(
				"The agent was created",
			);
		});
		expect(onSaved).not.toHaveBeenCalled();
		rerender();
		await act(async () => {
			await expect(
				result.current({
					...agent,
					instructions: "Revised instructions",
				}),
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
		expect(run.mock.lastCall?.[0]).toContain('description=["Research"]');
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
			await expect(result.current(agent, "workspace-1")).resolves.toBe(
				"workspace-1",
			);
		});
		expect(run).toHaveBeenCalledTimes(2);
		expect(run.mock.calls[0][0]).toMatch(/^GetWorkspace/);
	});

	it("round-trips existing knowledge and toolbox ids without sending display metadata", async () => {
		const mcp = [
			{ type: "VECTOR", id: "vector-1", name: "Knowledge" },
			{ type: "PROJECT", id: "toolbox-1", name: "Toolbox" },
		] satisfies Agent["mcp"];
		const loaded = agentFromWorkspace({
			workspace_id: "workspace-1",
			name: agent.name,
			description: agent.description,
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
			await result.current(loaded, "workspace-1");
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
