import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { formatMessageTime } from "@/features/messages/utils/message-metadata";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { RunDetails } from "./run-details";

// stable workbench and run reads, so nothing re-renders on its own
const mocks = vi.hoisted(() => ({
	workbench: {
		insightId: "insight",
		openRun: vi.fn(),
		openWorkbench: vi.fn(),
		pendingApprovals: [] as PendingToolApproval[],
	},
	detail: {
		run: {
			runId: "child",
			status: "COMPLETED" as const,
			pendingActions: [],
			// run rows are UTC with no zone, as the server stores them
			startedAt: "2026-10-02 13:05:00.123",
			completedAt: "2026-10-02 13:07:30",
		},
		children: [],
		error: null,
		isLoading: false,
		retry: vi.fn(),
	},
}));
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => mocks.workbench,
}));
vi.mock("../api/use-run-detail", () => ({
	useRunDetail: () => mocks.detail,
}));

it("shows when a run started and finished in the reader's own time zone", () => {
	render(<RunDetails runId="child" isActive />);
	expect(
		screen.getByText(
			`Started: ${formatMessageTime("2026-10-02T13:05:00.123Z", true)} · Finished: ${formatMessageTime("2026-10-02T13:07:30Z", true)}`,
		),
	).toBeVisible();
});
