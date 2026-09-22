import {
	decideAgentRunAction,
	getAgentRun,
	pollAgentRun,
	runAgent,
	runPixel,
	stopAgentRun,
} from "@semoss/sdk";
import {
	cancelRun,
	decideRunAction,
	listRoomRuns,
	pollRun,
	readRun,
	startAgentRun,
} from "./agent-run-api";

vi.mock("@semoss/sdk", () => ({
	decideAgentRunAction: vi.fn(),
	getAgentRun: vi.fn(),
	getSubagentRuns: vi.fn(),
	pollAgentRun: vi.fn(),
	runAgent: vi.fn(),
	runPixel: vi.fn(),
	stopAgentRun: vi.fn(),
}));

const run = {
	runId: "run-1",
	roomId: "room-1",
	status: "RUNNING" as const,
	pendingActions: [],
};
const action = {
	actionId: "action-1",
	runId: "child-1",
	toolName: "tool",
	toolArgs: { query: "original" },
};
beforeEach(() => vi.resetAllMocks());

it("uses RunAgent with the SEMOSS harness and preserves literal percent/plus text", async () => {
	vi.mocked(runAgent).mockResolvedValue({ ...run, status: "SUBMITTED" });
	const command = 'Review 50% + %20 and "日本語"\nC:\\work';
	await startAgentRun("insight-1", {
		roomId: "room-1",
		agentId: "workspace-1",
		engine: "model-1",
		command,
		media: ["/uploads/brief.pdf"],
		maxTurns: 40,
	});
	expect(runAgent).toHaveBeenCalledExactlyOnceWith(
		{
			roomId: "room-1",
			agentId: "workspace-1",
			engine: "model-1",
			harnessType: "semoss",
			command: encodeURIComponent(command),
			media: ["/uploads/brief.pdf"],
			maxTurns: 40,
		},
		"insight-1",
	);
	expect(
		decodeURIComponent(vi.mocked(runAgent).mock.calls[0][0].command),
	).toBe(command);
});

it("loads room runs through the active insight and validates the reply", async () => {
	vi.mocked(runPixel).mockResolvedValue({
		errors: [],
		pixelReturn: [{ output: [run] }],
	} as never);
	await expect(listRoomRuns("insight-1", "room-1")).resolves.toEqual([run]);
	expect(runPixel).toHaveBeenCalledExactlyOnceWith(
		'GetAgentRunsForRoom(roomId=["room-1"]);',
		"insight-1",
	);
	vi.mocked(runPixel).mockResolvedValue({
		errors: ["Access denied"],
		pixelReturn: [],
	} as never);
	await expect(listRoomRuns("insight-1", "room-1")).rejects.toThrow(
		"Access denied",
	);
});

it("uses run polling, durable reconciliation, and StopAgentRun with the correct insight", async () => {
	vi.mocked(pollAgentRun).mockResolvedValue({
		run,
		events: [],
		droppedEvents: 0,
	});
	vi.mocked(getAgentRun).mockResolvedValue({ ...run, messages: [] });
	vi.mocked(stopAgentRun).mockResolvedValue({ ...run, status: "CANCELLED" });
	await pollRun("run-1");
	await readRun("insight-1", "run-1");
	await cancelRun("insight-1", "run-1");
	expect(pollAgentRun).toHaveBeenCalledExactlyOnceWith("run-1");
	expect(getAgentRun).toHaveBeenCalledExactlyOnceWith(
		"run-1",
		{ includeMessages: true },
		"insight-1",
	);
	expect(stopAgentRun).toHaveBeenCalledExactlyOnceWith("run-1", "insight-1");
});

it.each([
	{
		decision: "submit" as const,
		parameters: { query: "original" },
		expected: "approve",
	},
	{
		decision: "submit" as const,
		parameters: { query: "edited" },
		expected: "edit",
	},
	{ decision: "reject" as const, parameters: undefined, expected: "reject" },
	{
		decision: "respond" as const,
		parameters: { query: "answer" },
		expected: "respond",
	},
])(
	"sends $expected using the pending action ID",
	async ({ decision, parameters, expected }) => {
		await decideRunAction("insight-1", action, decision, parameters);
		expect(decideAgentRunAction).toHaveBeenCalledExactlyOnceWith(
			{
				actionId: "action-1",
				decision: expected,
				paramValues: expected === "edit" ? parameters : undefined,
				mcpToolResult:
					expected === "respond"
						? JSON.stringify(parameters)
						: undefined,
			},
			"insight-1",
		);
	},
);

it("rejects invalid run statuses instead of reporting a successful turn", async () => {
	vi.mocked(pollAgentRun).mockResolvedValue({
		run: { ...run, status: "unexpected" },
		events: [],
		droppedEvents: 0,
	} as never);
	await expect(pollRun("run-1")).rejects.toThrow();
});
