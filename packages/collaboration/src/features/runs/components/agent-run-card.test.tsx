import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
	vi.mocked(api.readRun).mockResolvedValue(child);
	vi.mocked(api.listChildRuns).mockResolvedValue([]);
});

it.each([true, false])(
	"expands a child beneath its row without opening the workbench (compact: %s)",
	async (compact) => {
		const user = userEvent.setup();
		render(<AgentRunCard run={child} compact={compact} />);
		const trigger = screen.getByRole("button", {
			name: "Inspect Researcher run",
		});
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		expect(api.readRun).not.toHaveBeenCalled();
		await user.tab();
		await user.keyboard("{Enter}");
		expect(await screen.findByText(child.finalText ?? "")).toBeVisible();
		const details = screen.getByRole("region", {
			name: "Agent run details",
		});
		expect(details).toHaveTextContent(child.input ?? "");
		expect(
			trigger.compareDocumentPosition(details) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(trigger).toHaveFocus();
		expect(trigger).toHaveAttribute("aria-expanded", "true");
		expect(api.readRun).toHaveBeenCalledWith("insight", "child");
		expect(workbench.openRun).not.toHaveBeenCalled();
		expect(api.pollRun).not.toHaveBeenCalled();
		await user.keyboard(" ");
		expect(trigger).toHaveFocus();
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByRole("region")).not.toBeInTheDocument();
	},
);

it("opens nested children below their own rows and preserves expansion through status updates", async () => {
	const grandchild = {
		...child,
		runId: "grandchild",
		workspaceName: "Reviewer",
		finalText: "Review finished.",
	};
	vi.mocked(api.readRun).mockImplementation(async (_, id) =>
		id === "child" ? child : grandchild,
	);
	vi.mocked(api.listChildRuns).mockImplementation(async (_, id) =>
		id === "child" ? [grandchild] : [],
	);
	const view = render(<AgentRunCard run={child} compact />);
	fireEvent.click(
		screen.getByRole("button", { name: "Inspect Researcher run" }),
	);
	fireEvent.click(
		await screen.findByRole("button", { name: "Inspect Reviewer run" }),
	);
	expect(await screen.findByText("Review finished.")).toBeVisible();
	expect(
		screen.getAllByRole("region", { name: "Agent run details" }),
	).toHaveLength(2);
	view.rerender(
		<AgentRunCard run={{ ...child, status: "FAILED" }} compact />,
	);
	expect(screen.getByText("Review finished.")).toBeVisible();
	expect(
		screen.getByRole("button", { name: "Inspect Researcher run" }),
	).toHaveAttribute("aria-expanded", "true");
	expect(workbench.openRun).not.toHaveBeenCalled();
});

it("keeps errors and retry inside the expanded child", async () => {
	vi.mocked(api.readRun).mockRejectedValueOnce(
		new Error("Could not connect."),
	);
	render(<AgentRunCard run={child} compact />);
	fireEvent.click(
		screen.getByRole("button", { name: "Inspect Researcher run" }),
	);
	const alert = await screen.findByRole("alert");
	expect(alert).toHaveTextContent("Could not connect.");
	fireEvent.click(within(alert).getByRole("button", { name: "Retry" }));
	expect(await screen.findByText("The report is ready.")).toBeVisible();
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("keeps approvals attached to the original child and tool", async () => {
	workbench.pendingApprovals = [
		{
			runId: "child",
			toolId: "child-tool",
			parentMessageId: "message",
			toolName: "Search",
			arguments: {},
		},
		{
			runId: "other-child",
			toolId: "other-tool",
			parentMessageId: "message",
			toolName: "Edit",
			arguments: {},
		},
	];
	render(<AgentRunCard run={child} compact />);
	fireEvent.click(
		screen.getByRole("button", { name: "Inspect Researcher run" }),
	);
	fireEvent.click(
		await screen.findByRole("button", { name: "Review Search" }),
	);
	expect(workbench.openWorkbench).toHaveBeenCalledWith("child-tool");
	expect(
		screen.queryByRole("button", { name: "Review Edit" }),
	).not.toBeInTheDocument();
	expect(workbench.openRun).not.toHaveBeenCalled();
});

it("stops refreshing a running child when collapsed", async () => {
	vi.useFakeTimers();
	try {
		vi.mocked(api.readRun).mockResolvedValue({
			...child,
			status: "RUNNING",
		});
		render(<AgentRunCard run={{ ...child, status: "RUNNING" }} compact />);
		const trigger = screen.getByRole("button", {
			name: "Inspect Researcher run",
		});
		fireEvent.click(trigger);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1500);
		});
		expect(api.readRun).toHaveBeenCalledTimes(2);
		fireEvent.click(trigger);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(4500);
		});
		expect(api.readRun).toHaveBeenCalledTimes(2);
		fireEvent.click(trigger);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(api.readRun).toHaveBeenCalledTimes(3);
	} finally {
		vi.clearAllTimers();
		vi.useRealTimers();
	}
});

it("preserves the root run's workbench destination", () => {
	render(<AgentRunCard run={{ ...child, parentRunId: null }} compact />);
	fireEvent.click(
		screen.getByRole("button", { name: "Inspect Researcher run" }),
	);
	expect(workbench.openRun).toHaveBeenCalledWith("child");
	expect(api.readRun).not.toHaveBeenCalled();
});
