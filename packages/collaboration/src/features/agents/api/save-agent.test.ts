import type { InsightActions } from "@/lib/pixel";
import { AgentCreatedError, createAgent, updateAgent } from "./save-agent";

const workspace = {
	workspace_id: "workspace-1",
	name: "Existing agent",
	description: "Existing role",
	system_prompt: "Existing instructions",
	mcp: [{ type: "DATABASE", id: "database-1", name: "Warehouse" }],
	skills: [{ id: "skill-1", name: "Analysis" }],
	prompts: [{ id: "prompt-1", name: "Summarize" }],
};

function actionsReturning(...outputs: unknown[]) {
	const run = vi.fn();
	for (const output of outputs) {
		run.mockResolvedValueOnce({
			pixelReturn: [{ output, operationType: [] }],
		});
	}
	return { actions: { run } as unknown as InsightActions, run };
}

describe("agent workspace mutations", () => {
	it("creates core settings with escaped text and flat skill ids", async () => {
		const { actions, run } = actionsReturning("workspace-1");
		await expect(
			createAgent(actions, {
				name: "Research agent",
				description: 'Read "quarterly" results',
				systemPrompt: 'Line one\nPath C:\\reports; say "hello".',
				skillIds: ["skill-1", "skill-2"],
				useDefaultAgentTools: false,
			}),
		).resolves.toBe("workspace-1");
		expect(run).toHaveBeenCalledExactlyOnceWith(
			'AddWorkspace(name=["Research agent"], description=["Read \\"quarterly\\" results"], systemPrompt=["Line one\\nPath C:\\\\reports; say \\"hello\\"."], skills=["skill-1","skill-2"], useDefaultAgentTools=[false]);',
		);
	});

	it("applies execution settings after creation without removing resources", async () => {
		const { actions, run } = actionsReturning(
			"workspace-1",
			workspace,
			true,
		);
		await expect(
			createAgent(actions, {
				name: "Research team",
				description: "Research",
				systemPrompt: "Use the specialists",
				skillIds: ["skill-1"],
				maxSubagentDepth: 0,
				maxSubagentsPerRun: 2,
				maxReflections: 0,
				subagents: [{ workspaceId: "specialist-1" }],
			}),
		).resolves.toBe("workspace-1");
		expect(run).toHaveBeenCalledTimes(3);
		expect(run.mock.calls[0][0]).toMatch(/^AddWorkspace\(/);
		expect(run.mock.calls[0][0]).not.toContain("maxSubagentDepth");
		expect(run.mock.calls[1][0]).toBe(
			'GetWorkspace(workspaceId=["workspace-1"]);',
		);
		expect(run.mock.calls[2][0]).toBe(
			'EditWorkspace(workspaceId=["workspace-1"], name=["Research team"], description=["Research"], systemPrompt=["Use the specialists"], mcp=[{"type":"DATABASE","id":"database-1"}], skills=["skill-1"], prompts=["prompt-1"], maxReflections=[0], maxSubagentDepth=[0], maxSubagentsPerRun=[2], subagents=[{"workspaceId":"specialist-1"}]);',
		);
	});

	it("preserves omitted fields and resources when editing", async () => {
		const { actions, run } = actionsReturning(workspace, true);
		await updateAgent(actions, "workspace-1", { name: "Renamed agent" });
		expect(run.mock.calls[1][0]).toBe(
			'EditWorkspace(workspaceId=["workspace-1"], name=["Renamed agent"], description=["Existing role"], systemPrompt=["Existing instructions"], mcp=[{"type":"DATABASE","id":"database-1"}], skills=["skill-1"], prompts=["prompt-1"]);',
		);
	});

	it.each([0, 4])(
		"saves a per-turn spawn limit of %i after creation",
		async (limit) => {
			const { actions, run } = actionsReturning(
				"workspace-1",
				workspace,
				true,
			);
			await createAgent(actions, {
				name: "Research agent",
				maxSpawnsPerTurn: limit,
			});
			expect(run).toHaveBeenCalledTimes(3);
			expect(run.mock.calls[0][0]).not.toContain("maxSpawnsPerTurn");
			expect(run.mock.calls[2][0]).toContain(
				`maxSpawnsPerTurn=[${limit}]`,
			);
		},
	);

	it("sends selected knowledge and toolboxes on creation and its follow-up edit", async () => {
		const { actions, run } = actionsReturning(
			"workspace-1",
			workspace,
			true,
		);
		await createAgent(actions, {
			name: "Research agent",
			mcp: [
				{ type: "VECTOR", id: "vector-1" },
				{ type: "PROJECT", id: "toolbox-1" },
			],
			maxSubagentDepth: 1,
		});
		const resources =
			'mcp=[{"type":"VECTOR","id":"vector-1"},{"type":"PROJECT","id":"toolbox-1"}]';
		expect(run.mock.calls[0][0]).toContain(resources);
		expect(run.mock.calls[2][0]).toContain(resources);
		expect(run.mock.calls[2][0]).not.toContain("database-1");
		expect(run.mock.calls[2][0]).toContain(
			'skills=["skill-1"], prompts=["prompt-1"]',
		);
	});

	it("clears knowledge and toolboxes without removing other attachments", async () => {
		const { actions, run } = actionsReturning(workspace, true);
		await updateAgent(actions, "workspace-1", {
			name: "Existing agent",
			mcp: [],
		});
		expect(run.mock.calls[1][0]).toContain(
			'mcp=[], skills=["skill-1"], prompts=["prompt-1"]',
		);
	});

	it("allows explicit clearing of skills, subagents, and instructions", async () => {
		const { actions, run } = actionsReturning(workspace, true);
		await updateAgent(actions, "workspace-1", {
			name: "Existing agent",
			description: "",
			systemPrompt: "",
			skillIds: [],
			subagents: [],
		});
		const statement = run.mock.calls[1][0];
		expect(statement).toContain('description=[""], systemPrompt=[""]');
		expect(statement).toContain(
			'skills=[], prompts=["prompt-1"], subagents=[]',
		);
	});

	it.each([false, { success: true, warning: "CONFIG_JSON sync failed" }])(
		"retains the created id when the follow-up is not fully saved: %j",
		async (output) => {
			const { actions } = actionsReturning(
				"workspace-1",
				workspace,
				output,
			);
			const result = createAgent(actions, {
				name: "Research agent",
				maxSubagentDepth: 0,
			});
			await expect(result).rejects.toBeInstanceOf(AgentCreatedError);
			await expect(result).rejects.toMatchObject({
				workspaceId: "workspace-1",
			});
		},
	);

	it("does not run follow-up settings after a rejected creation", async () => {
		const { actions, run } = actionsReturning();
		run.mockResolvedValueOnce({
			pixelReturn: [{ output: "Invalid Name", operationType: ["ERROR"] }],
		});
		await expect(
			createAgent(actions, { name: "Invalid", maxSubagentDepth: 1 }),
		).rejects.toThrow("Invalid Name");
		expect(run).toHaveBeenCalledTimes(1);
	});

	it.each(["", false, { workspace_id: "workspace-1" }])(
		"rejects an invalid creation response: %j",
		async (output) => {
			const { actions } = actionsReturning(output);
			await expect(
				createAgent(actions, { name: "Research agent" }),
			).rejects.toThrow("unexpected shape");
		},
	);
});
