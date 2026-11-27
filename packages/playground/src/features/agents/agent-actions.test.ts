import { beforeEach, expect, test, vi } from "vitest";
import { deleteAgent } from "./agent-actions";

const mocks = vi.hoisted(() => ({ deleteWorkspace: vi.fn() }));

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	deleteWorkspace: mocks.deleteWorkspace,
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	Session: {
		insight: {
			withInsight: <T>(run: (insightId: string) => T) => run("insight-1"),
		},
	},
}));

beforeEach(() => {
	mocks.deleteWorkspace.mockReset();
});

test("deleting an agent runs in the session's insight", async () => {
	mocks.deleteWorkspace.mockResolvedValue(undefined);
	await deleteAgent("agent-1");
	expect(mocks.deleteWorkspace).toHaveBeenCalledWith("insight-1", "agent-1");
});

test("a failed delete reaches the caller, so its page can say so", async () => {
	mocks.deleteWorkspace.mockRejectedValue(
		new Error("No access to that agent"),
	);
	await expect(deleteAgent("agent-1")).rejects.toThrow(
		"No access to that agent",
	);
});
