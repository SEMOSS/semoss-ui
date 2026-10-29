import "@testing-library/jest-dom";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentActivityPage } from "./agent-activity-page";

const mocks = vi.hoisted(() => ({
	usePixel: vi.fn(),
	runPixel: vi.fn(),
	refresh: vi.fn(),
	downloadBlob: vi.fn(),
	getAgentRun: vi.fn(),
	getSubagentRuns: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	usePixel: mocks.usePixel,
	runPixel: mocks.runPixel,
}));
// a run and its subagents are read with the SDK's agent API
vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	getAgentRun: mocks.getAgentRun,
	getSubagentRuns: mocks.getSubagentRuns,
}));
vi.mock("@semoss/utility/browser", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/utility/browser")>()),
	downloadBlob: mocks.downloadBlob,
}));
vi.mock("@/hooks/use-project", () => ({
	useProject: () => ({
		project: { project_id: "agent-a", project_name: "Agent A" },
	}),
}));
// the graph draws with React Flow; what it is handed is what matters here
vi.mock("@/features/agent-activity/agent-run-graph", () => ({
	AgentRunGraph: (props: { runs: unknown[] }) => (
		<div data-testid="agent-run-graph">{props.runs.length} runs</div>
	),
}));

const ROOM = {
	roomId: "r1",
	roomName: "Quarterly report",
	userId: "alice",
	userType: "NATIVE",
	agentId: "agent-a",
	runCount: 1,
	activeRunCount: 0,
	failedRunCount: 0,
	isClosed: false,
	firstRunAt: "2026-10-01 10:00:00",
	lastActivityAt: "2026-10-01 10:05:00",
};

const RUN = {
	runId: "run1",
	roomId: "r1",
	roomName: "Quarterly report",
	userId: "alice",
	workspaceId: "agent-a",
	modelId: "model-1",
	harnessType: "semoss",
	jobId: "run1",
	status: "COMPLETED",
	input: "Summarize",
	dateCreated: "2026-10-01 10:00:00",
	startedAt: "2026-10-01 10:00:00",
	completedAt: "2026-10-01 10:05:00",
	artifacts: [],
};

/** What each read answers by default, by the start of its pixel */
const ANSWERS: [string, unknown][] = [
	["GetAllAgentRunsForRoom", [RUN]],
	["GetEngineMetadata", { engine_display_name: "GPT Model" }],
	["CloseRoom", { roomId: "r1", closedRoomIds: ["r1"], cancelledRunIds: [] }],
];

/** What each read answers in the running test; the first match wins */
let answers: [string, unknown][] = ANSWERS;

/** Lists these rooms */
const listRooms = (rooms: unknown[]) =>
	mocks.usePixel.mockReturnValue({
		status: "SUCCESS",
		data: { rooms, total: rooms.length },
		error: undefined,
		refresh: mocks.refresh,
	});

/** The room list's last read */
const lastRoomsPixel = (): string => mocks.usePixel.mock.lastCall?.[0];

const renderPage = (path = "/") =>
	render(
		<MemoryRouter initialEntries={[path]}>
			<AgentActivityPage />
		</MemoryRouter>,
	);

describe("AgentActivityPage", () => {
	beforeEach(() => {
		answers = ANSWERS;
		listRooms([ROOM]);
		mocks.getAgentRun.mockResolvedValue({
			...RUN,
			messages: [],
			pendingActions: [],
		});
		mocks.getSubagentRuns.mockResolvedValue([]);
		mocks.runPixel.mockImplementation((pixel: string) =>
			Promise.resolve({
				pixelReturn: [
					{
						operationType: ["OPERATION"],
						output:
							answers.find(([start]) =>
								pixel.startsWith(start),
							)?.[1] ?? null,
					},
				],
			}),
		);
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("lists the user's own rooms with the agent, each with its id", () => {
		renderPage();

		expect(lastRoomsPixel()).toBe(
			'GetAgentRunRooms(limit=[25], offset=[0], agentId=["agent-a"]);',
		);
		const [, firstRow] = screen.getAllByRole("row");
		expect(
			within(firstRow).getByRole("button", { name: "Quarterly report" }),
		).toBeInTheDocument();
		expect(within(firstRow).getByText("id: r1")).toBeInTheDocument();
		expect(screen.getByText("Showing 1-1 of 1 rooms")).toBeInTheDocument();
	});

	it("searches the user's rooms by name or id once typing pauses", async () => {
		renderPage();

		fireEvent.change(
			screen.getByRole("textbox", { name: "Search rooms" }),
			{ target: { value: " quarterly " } },
		);

		await waitFor(() =>
			expect(lastRoomsPixel()).toBe(
				'GetAgentRunRooms(limit=[25], offset=[0], agentId=["agent-a"], search=["quarterly"]);',
			),
		);
	});

	it("opens a room from the top of the page, and goes back to where the list was", async () => {
		const { container } = renderPage();
		container.scrollTop = 300;

		fireEvent.click(
			screen.getByRole("button", { name: "Quarterly report" }),
		);
		await screen.findByTestId("agent-run-graph");
		expect(container.scrollTop).toBe(0);
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'GetAllAgentRunsForRoom(roomId=["r1"]);',
		);
		expect(mocks.getAgentRun).toHaveBeenCalledWith("run1", {
			includeMessages: true,
		});

		fireEvent.click(screen.getByRole("button", { name: "Back to list" }));
		expect(
			screen.getByRole("button", { name: "Quarterly report" }),
		).toHaveFocus();
		expect(container.scrollTop).toBe(300);
	});

	it("opens the room a link names, with its name from its runs", async () => {
		renderPage("/?roomId=r1&runId=run1");

		expect(await screen.findByTestId("agent-run-graph")).toHaveTextContent(
			"1 runs",
		);
		expect(
			screen.getByRole("heading", { name: "Quarterly report" }),
		).toBeInTheDocument();
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'GetAllAgentRunsForRoom(roomId=["r1"]);',
		);
	});

	it("goes back to the list when a linked run is another agent's", async () => {
		mocks.getAgentRun.mockResolvedValue({
			...RUN,
			runId: "run9",
			workspaceId: "agent-b",
			messages: [],
			pendingActions: [],
		});
		renderPage("/?roomId=r1&runId=run9");

		expect(
			await screen.findByRole("textbox", { name: "Search rooms" }),
		).toBeInTheDocument();
		expect(screen.queryByTestId("agent-run-graph")).not.toBeInTheDocument();
	});

	it("goes back to the list when a linked room holds no runs of this agent", async () => {
		answers = [
			["GetAllAgentRunsForRoom", [{ ...RUN, workspaceId: "agent-b" }]],
			...ANSWERS,
		];
		renderPage("/?roomId=r1");

		expect(
			await screen.findByRole("textbox", { name: "Search rooms" }),
		).toBeInTheDocument();
		expect(screen.queryByTestId("agent-run-graph")).not.toBeInTheDocument();
		expect(mocks.getAgentRun).not.toHaveBeenCalled();
	});

	it("exports the room's runs as Markdown, named by the room", async () => {
		renderPage();
		fireEvent.click(
			screen.getByRole("button", { name: "Quarterly report" }),
		);
		await screen.findByTestId("agent-run-graph");

		fireEvent.click(screen.getByRole("button", { name: "Export" }));

		expect(mocks.downloadBlob).toHaveBeenCalledWith(
			expect.any(Blob),
			"quarterly-report-r1.md",
		);
	});

	it("closes the user's own room once they confirm", async () => {
		renderPage();
		fireEvent.click(
			screen.getByRole("button", { name: "Quarterly report" }),
		);
		await screen.findByTestId("agent-run-graph");

		fireEvent.click(screen.getByRole("button", { name: "Close Room" }));
		const dialog = await screen.findByRole("dialog");
		expect(dialog).toHaveTextContent(
			"you no longer see them in your conversations",
		);
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Close Room" }),
		);

		await waitFor(() =>
			expect(mocks.runPixel).toHaveBeenCalledWith(
				'CloseRoom(roomId=["r1"]);',
			),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Close Room" }),
			).toHaveAttribute("aria-disabled", "true"),
		);
		expect(mocks.refresh).toHaveBeenCalled();
	});

	it("marks a closed room in the list", () => {
		listRooms([{ ...ROOM, isClosed: true }]);
		renderPage();

		const [, firstRow] = screen.getAllByRole("row");
		expect(within(firstRow).getByText("Closed")).toBeInTheDocument();
	});

	it("says when the user has no rooms with the agent yet", () => {
		listRooms([]);
		renderPage();

		expect(
			screen.getByText("No activity yet for this agent"),
		).toBeInTheDocument();
	});
});
