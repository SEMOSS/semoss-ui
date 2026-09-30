import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAgentRunsForRoom, runAgent } from "./agent";
import { runPixel } from "./base";

vi.mock("./base", () => ({
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);

/** The pixel the last runAgent call ran. */
const lastPixel = (): string => String(mockRunPixel.mock.calls.at(-1)?.[0]);

describe("runAgent", () => {
	beforeEach(() => {
		mockRunPixel.mockReset();
		mockRunPixel.mockResolvedValue({
			errors: [],
			insightId: "insight-1",
			pixelReturn: [
				{
					output: {
						runId: "run-1",
						roomId: "room-1",
						status: "SUBMITTED",
					},
				},
			],
		} as unknown as Awaited<ReturnType<typeof runPixel>>);
	});

	it("sends what it always did when no space is given", async () => {
		await runAgent(
			{
				roomId: "room-1",
				command: "hi",
				harnessType: "semoss",
				paramValues: { tools: [] },
			},
			"insight-1",
		);
		expect(lastPixel()).toBe(
			'RunAgent(roomId=["room-1"],\ncommand=["hi"],\nharnessType="semoss",\nparamValues=[{"tools":[]}],\nwait=false);',
		);
		expect(mockRunPixel).toHaveBeenCalledWith(lastPixel(), "insight-1");
	});

	it("sends the space as its own argument and the subdir with the params", async () => {
		await runAgent({
			roomId: "room-1",
			command: "hi",
			space: "USER",
			subdir: "reports/2026",
			paramValues: { subdir: "old", effort: "high" },
		});
		expect(lastPixel()).toContain('space=["USER"]');
		expect(lastPixel()).toContain(
			'paramValues=[{"subdir":"reports/2026","effort":"high"}]',
		);
	});

	it("sends a subdir even without other params", async () => {
		await runAgent({ roomId: "room-1", command: "hi", subdir: "notes" });
		expect(lastPixel()).toContain('paramValues=[{"subdir":"notes"}]');
		expect(lastPixel()).not.toContain("space=");
	});
});

describe("getAgentRunsForRoom", () => {
	it("queries durable top-level runs for transfer reconciliation", async () => {
		mockRunPixel.mockResolvedValue({
			errors: [],
			insightId: "insight-1",
			pixelReturn: [{ output: [] }],
		} as unknown as Awaited<ReturnType<typeof runPixel>>);

		await getAgentRunsForRoom("room-1", "insight-1");

		expect(mockRunPixel).toHaveBeenCalledWith(
			'GetAgentRunsForRoom(roomId=["room-1"]);',
			"insight-1",
		);
	});
});
