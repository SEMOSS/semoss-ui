import { act, fireEvent, render, screen } from "@testing-library/react";
import * as api from "@/features/rooms/api/agent-run-api";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { AgentRunCard } from "./agent-run-card";

const workbench = vi.hoisted(() => ({
	insightId: "insight",
	openRun: vi.fn(),
	openWorkbench: vi.fn(),
	pendingApprovals: [] as PendingToolApproval[],
}));
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => workbench,
}));
vi.mock("@/features/rooms/api/agent-run-api", async (original) => ({
	...(await original<typeof import("@/features/rooms/api/agent-run-api")>()),
	readRun: vi.fn(),
	listChildRuns: vi.fn(),
	pollRun: vi.fn(),
}));

const child: api.AgentRun = {
	runId: "child",
	parentRunId: "parent",
	workspaceName: "Researcher",
	status: "COMPLETED",
	pendingActions: [],
	input: "Research the current report.",
	finalText: "The report is ready.",
};

beforeEach(() => {
	vi.resetAllMocks();
	workbench.pendingApprovals = [];
});

it("opens a sub-agent in the side panel by its real name, without reading inline", () => {
	render(<AgentRunCard run={child} compact />);
	const trigger = screen.getByRole("button", {
		name: "Open Researcher in the side panel",
	});
	fireEvent.click(trigger);
	expect(workbench.openRun).toHaveBeenCalledWith("child");
	expect(api.readRun).not.toHaveBeenCalled();
	expect(
		screen.queryByRole("region", { name: "Agent run details" }),
	).not.toBeInTheDocument();
});

it("names a sub-agent from its executor label when no workspace name is set", () => {
	render(
		<AgentRunCard
			run={{
				...child,
				workspaceName: null,
				executorLabel: "Read NIH mail",
			}}
			compact
		/>,
	);
	expect(
		screen.getByRole("button", {
			name: "Open Read NIH mail in the side panel",
		}),
	).toBeVisible();
});

it("names a sub-agent from the first line of its task when no label is set", () => {
	render(
		<AgentRunCard
			run={{
				...child,
				workspaceName: null,
				executorLabel: null,
				input: "Read NIH mail from this week\nand summarize it.",
			}}
			compact
		/>,
	);
	expect(
		screen.getByRole("button", {
			name: "Open Read NIH mail from this week in the side panel",
		}),
	).toBeVisible();
});

it("falls back to a generic sub-agent name, never 'Child agent'", () => {
	render(
		<AgentRunCard
			run={{
				...child,
				workspaceName: null,
				executorLabel: null,
				input: null,
			}}
			compact
		/>,
	);
	expect(
		screen.getByRole("button", {
			name: "Open Sub-agent in the side panel",
		}),
	).toBeVisible();
	expect(
		screen.queryByRole("button", { name: /Child agent/ }),
	).not.toBeInTheDocument();
});

it("shows a humanized status word for a sub-agent waiting on a person", () => {
	render(
		<AgentRunCard run={{ ...child, status: "INPUT_REQUIRED" }} compact />,
	);
	expect(screen.getByText("waiting for you")).toBeVisible();
});

it("shows how long a finished sub-agent took, reading the backend's UTC timestamps", () => {
	render(
		<AgentRunCard
			run={{
				...child,
				status: "COMPLETED",
				// the backend writes these without a timezone; they are UTC
				startedAt: "2026-11-11 10:00:00.0",
				completedAt: "2026-11-11 10:00:12.4",
			}}
			compact
		/>,
	);
	expect(screen.getByText(/done · 12\.4s/)).toBeVisible();
});

it("counts a running sub-agent's elapsed time upward", async () => {
	vi.useFakeTimers({ now: new Date("2026-11-11T10:00:05Z") });
	try {
		render(
			<AgentRunCard
				run={{
					...child,
					status: "RUNNING",
					startedAt: "2026-11-11 10:00:00.0",
					completedAt: null,
				}}
				compact
			/>,
		);
		expect(screen.getByText(/running · 5\.0s/)).toBeVisible();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3000);
		});
		expect(screen.getByText(/running · 8\.0s/)).toBeVisible();
	} finally {
		vi.useRealTimers();
	}
});

it("marks a failed sub-agent with a destructive status dot", () => {
	const { container } = render(
		<AgentRunCard run={{ ...child, status: "FAILED" }} compact />,
	);
	expect(screen.getByText("failed")).toBeVisible();
	expect(container.querySelector(".bg-destructive")).not.toBeNull();
});

it("opens the root run in the workbench and shows its humanized status", () => {
	render(
		<AgentRunCard
			run={{ ...child, parentRunId: null, status: "RUNNING" }}
			compact
		/>,
	);
	const trigger = screen.getByRole("button", {
		name: "Inspect Researcher run",
	});
	expect(screen.getByText("running")).toBeVisible();
	fireEvent.click(trigger);
	expect(workbench.openRun).toHaveBeenCalledWith("child");
	expect(api.readRun).not.toHaveBeenCalled();
});
