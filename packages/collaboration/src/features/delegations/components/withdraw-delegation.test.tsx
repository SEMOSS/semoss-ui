import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import * as api from "@/features/rooms/api/agent-run-api";
import { WithdrawDelegation } from "./withdraw-delegation";

// one stable insight, as the SDK provides
const sdk = vi.hoisted(() => ({ insight: { insightId: "insight-1" } }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => sdk.insight }));
vi.mock("@/features/rooms/api/agent-run-api", async (original) => ({
	...(await original<typeof import("@/features/rooms/api/agent-run-api")>()),
	cancelRun: vi.fn(),
}));

const stopped = (overrides: Partial<api.AgentRun>): api.AgentRun => ({
	runId: "ask-dana",
	status: "CANCELLED",
	pendingActions: [],
	...overrides,
});

beforeEach(() => {
	vi.spyOn(toast, "success").mockReturnValue(1);
	vi.spyOn(toast, "info").mockReturnValue(2);
	vi.spyOn(toast, "error").mockReturnValue(3);
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

it.each([
	[
		"took it back",
		stopped({}),
		"success",
		"Withdrawn. Dana will see it was withdrawn.",
	],
	[
		"was already answered",
		stopped({ status: "COMPLETED" }),
		"info",
		"Dana already responded, so nothing was withdrawn.",
	],
	[
		"was already declined",
		stopped({ status: "FAILED", errorMessage: "Declined: on leave" }),
		"info",
		"Dana already declined it, so nothing was withdrawn.",
	],
	[
		"had already ended",
		stopped({ status: "FAILED", errorMessage: "Not answered in time" }),
		"info",
		"This request had already ended, so nothing was withdrawn.",
	],
] as const)(
	"says what Withdraw did when the request %s",
	async (_case, run, kind, message) => {
		const user = userEvent.setup();
		vi.mocked(api.cancelRun).mockResolvedValue(run);
		render(<WithdrawDelegation runId="ask-dana" assignee="Dana" />);
		await user.click(screen.getByRole("button", { name: "Withdraw" }));
		await user.click(screen.getByRole("button", { name: "Yes" }));
		expect(api.cancelRun).toHaveBeenCalledWith("insight-1", "ask-dana");
		expect(toast[kind]).toHaveBeenCalledExactlyOnceWith(message);
		expect(
			toast[kind === "success" ? "info" : "success"],
		).not.toHaveBeenCalled();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	},
);

it("offers Withdraw again when the stop did not take", async () => {
	const user = userEvent.setup();
	vi.mocked(api.cancelRun).mockResolvedValue(
		stopped({ status: "INPUT_REQUIRED" }),
	);
	render(<WithdrawDelegation runId="ask-dana" assignee="Dana" />);
	await user.click(screen.getByRole("button", { name: "Withdraw" }));
	await user.click(screen.getByRole("button", { name: "Yes" }));
	expect(toast.success).not.toHaveBeenCalled();
	expect(toast.error).toHaveBeenCalledExactlyOnceWith(
		"The request to Dana could not be withdrawn. Please try again.",
	);
	expect(screen.getByRole("button", { name: "Yes" })).toBeEnabled();
});
