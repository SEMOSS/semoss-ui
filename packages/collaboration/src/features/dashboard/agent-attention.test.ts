import { readRun } from "@/features/rooms/api/agent-run-api";
import { scanAgentAttention } from "./agent-attention";

vi.mock("@/features/rooms/api/agent-run-api", () => ({ readRun: vi.fn() }));
vi.mock("@/features/thread-assistant/thread-context", () => ({
	getThreadAgent: () => null,
}));
const response = (output: unknown) => ({
	pixelReturn: [{ output, operationType: [] }],
});

it("discovers pending actions beyond the first activity page using durable snapshots only", async () => {
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("MyProjects"))
			return response([{ project_id: "agent", project_name: "Agent" }]);
		return response(
			statement.includes("offset=[0]")
				? Array.from({ length: 50 }, (_, index) => ({
						runId: `done-${index}`,
						status: "COMPLETED",
					}))
				: [{ runId: "waiting", status: "INPUT_REQUIRED" }],
		);
	});
	const pending = {
		runId: "waiting",
		roomId: "original-room",
		status: "INPUT_REQUIRED" as const,
		pendingActions: [
			{
				actionId: "decision",
				runId: "waiting",
				toolCallId: "original-tool",
			},
		],
	};
	vi.mocked(readRun).mockResolvedValue(pending);
	const onRun = vi.fn();
	const onProgress = vi.fn();
	await scanAgentAttention({
		actions: { run } as never,
		insightId: "insight",
		previous: [],
		isCancelled: () => false,
		onRun,
		onProgress,
	});
	expect(readRun).toHaveBeenCalledWith("insight", "waiting", false);
	expect(onRun).toHaveBeenCalledWith(pending);
	expect(onProgress).toHaveBeenLastCalledWith({
		checked: 51,
		complete: true,
		errors: [],
	});
	expect(run.mock.calls.map((call) => call[0]).join(" ")).not.toMatch(
		/PollAgent|RunAgent/,
	);
});

it("reports partial coverage without retracting discoveries when one workspace fails", async () => {
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("MyProjects"))
			return response([
				{ project_id: "blocked", project_name: "Blocked" },
			]);
		throw new Error("unavailable");
	});
	const onProgress = vi.fn();
	await scanAgentAttention({
		actions: { run } as never,
		insightId: "insight",
		previous: [],
		isCancelled: () => false,
		onRun: vi.fn(),
		onProgress,
	});
	expect(onProgress).toHaveBeenLastCalledWith({
		checked: 0,
		complete: false,
		errors: ["Some agent activity could not be read."],
	});
});
