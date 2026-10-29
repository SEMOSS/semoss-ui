import "@testing-library/jest-dom";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { AgentRuns } from "./agent-runs";

const mocks = vi.hoisted(() => ({
	usePixel: vi.fn(),
	runPixel: vi.fn(),
	refresh: vi.fn(),
	graph: vi.fn(),
	downloadBlob: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	usePixel: mocks.usePixel,
	runPixel: mocks.runPixel,
}));
vi.mock("@semoss/utility/browser", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/utility/browser")>()),
	downloadBlob: mocks.downloadBlob,
}));
// the graph draws with React Flow; what it is handed is what matters here
vi.mock("@/features/agent-activity/agent-run-graph", () => ({
	AgentRunGraph: (props: { runs: unknown[]; isReadOnly?: boolean }) => {
		mocks.graph(props);
		return (
			<div data-testid="agent-run-graph">{props.runs.length} runs</div>
		);
	},
}));

const ROOM = {
	roomId: "r1",
	roomName: "Quarterly report",
	userId: "alice",
	userName: "Alice Doe",
	userEmail: "alice@example.com",
	userType: "NATIVE",
	agentId: "agent-a",
	agentName: "Agent A",
	runCount: 1,
	activeRunCount: 1,
	failedRunCount: 0,
	isClosed: false,
	firstRunAt: "2026-10-01 10:00:00",
	lastActivityAt: "2026-10-01 11:00:00",
};

const RUN = {
	runId: "run1",
	roomId: "r1",
	userId: "alice",
	workspaceId: "agent-a",
	modelId: "model-1",
	modelName: "GPT Model",
	harnessType: "semoss",
	jobId: "run1",
	status: "RUNNING",
	input: "Summarize",
	dateCreated: "2026-10-01 11:00:00",
	startedAt: "2026-10-01 11:00:00",
	artifacts: [],
};

/** What each admin reactor answers, by the start of its pixel */
const ANSWERS: [string, unknown][] = [
	[
		"AdminCloseRoom",
		{ roomId: "r1", closedRoomIds: ["r1"], cancelledRunIds: ["run1"] },
	],
	["AdminGetAllAgentRunsForRoom", [RUN]],
	["AdminGetAgentRun(", { ...RUN, messages: [] }],
	["AdminGetAgentRunAgents", [{ agentId: "agent-a", agentName: "Agent A" }]],
	[
		"AdminGetAgentRunUsers",
		[
			{
				userId: "alice",
				userType: "NATIVE",
				userName: "Alice Doe",
				userEmail: "alice@example.com",
			},
		],
	],
];

/** Answers each admin read the page makes, and closing the room */
const answer = (pixel: string) => {
	const output =
		ANSWERS.find(([start]) => pixel.startsWith(start))?.[1] ?? [];
	return Promise.resolve({
		pixelReturn: [{ operationType: ["OPERATION"], output }],
	});
};

/** The room list's last read */
const lastRoomsPixel = (): string => mocks.usePixel.mock.lastCall?.[0];

// the filter lists are cmdk lists, which scroll to their choice and watch their size
const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
});
afterAll(() => {
	vi.unstubAllGlobals();
	Element.prototype.scrollIntoView = scrollIntoView;
});

describe("AgentRuns", () => {
	beforeEach(() => {
		mocks.usePixel.mockReturnValue({
			status: "SUCCESS",
			data: { rooms: [ROOM], total: 1 },
			error: undefined,
			refresh: mocks.refresh,
		});
		mocks.runPixel.mockImplementation(answer);
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("lists every user's rooms with who they belong to and their agent", () => {
		render(<AgentRuns />);

		expect(
			screen.getByRole("button", { name: "Quarterly report" }),
		).toBeInTheDocument();
		expect(screen.getByText("id: r1")).toBeInTheDocument();
		expect(screen.getByText("Agent A")).toBeInTheDocument();
		expect(screen.getByText("id: agent-a")).toBeInTheDocument();
		expect(screen.getByText("Alice Doe")).toBeInTheDocument();
		expect(screen.getByText("1 in progress")).toBeInTheDocument();
		expect(screen.getByText("Showing 1-1 of 1 rooms")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Show only/ }),
		).not.toBeInTheDocument();
	});

	it("reads the next page and counts its rooms across the pages", () => {
		mocks.usePixel.mockReturnValue({
			status: "SUCCESS",
			data: { rooms: [ROOM], total: 30 },
			error: undefined,
			refresh: mocks.refresh,
		});
		render(<AgentRuns />);
		expect(screen.getByText("Showing 1-1 of 30 rooms")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Next" }));

		expect(lastRoomsPixel()).toBe(
			"AdminGetAgentRunRooms(limit=[25], offset=[25]);",
		);
		expect(
			screen.getByText("Showing 26-26 of 30 rooms"),
		).toBeInTheDocument();
	});

	it("narrows to a user picked from the user filter, by id and login type", async () => {
		render(<AgentRuns />);

		fireEvent.click(screen.getByRole("combobox", { name: /User/ }));
		fireEvent.click(
			await screen.findByRole("option", { name: /Alice Doe/ }),
		);

		expect(lastRoomsPixel()).toContain(
			'userId=["alice"], userType=["NATIVE"]',
		);
		expect(
			screen.getByRole("combobox", { name: "User: Alice Doe" }),
		).toBeInTheDocument();
		expect(mocks.runPixel).toHaveBeenCalledWith(
			"AdminGetAgentRunUsers(limit=[25]);",
		);

		fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
		expect(lastRoomsPixel()).toBe(
			"AdminGetAgentRunRooms(limit=[25], offset=[0]);",
		);
		expect(
			screen.getByRole("combobox", { name: "User: All users" }),
		).toBeInTheDocument();
	});

	it("narrows to an agent picked from the agent filter", async () => {
		render(<AgentRuns />);

		fireEvent.click(screen.getByRole("combobox", { name: /Agent/ }));
		fireEvent.click(await screen.findByRole("option", { name: /Agent A/ }));

		expect(lastRoomsPixel()).toContain('agentId=["agent-a"]');
		expect(
			screen.getByRole("combobox", { name: "Agent: Agent A" }),
		).toBeInTheDocument();
	});

	it("searches a filter's choices on the backend as the admin types", async () => {
		render(<AgentRuns />);

		fireEvent.click(screen.getByRole("combobox", { name: /User/ }));
		fireEvent.change(await screen.findByPlaceholderText("Search users"), {
			target: { value: "ali" },
		});

		await waitFor(() =>
			expect(mocks.runPixel).toHaveBeenCalledWith(
				'AdminGetAgentRunUsers(limit=[25], search=["ali"]);',
			),
		);
	});

	it("searches rooms by name or id once typing pauses", async () => {
		render(<AgentRuns />);

		fireEvent.change(
			screen.getByRole("textbox", { name: "Search rooms" }),
			{
				target: { value: " quarterly " },
			},
		);

		await waitFor(() =>
			expect(lastRoomsPixel()).toBe(
				'AdminGetAgentRunRooms(limit=[25], offset=[0], search=["quarterly"]);',
			),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Clear the room search" }),
		);
		await waitFor(() =>
			expect(lastRoomsPixel()).toBe(
				"AdminGetAgentRunRooms(limit=[25], offset=[0]);",
			),
		);
	});

	it("opens a room from the top of the page, and goes back to where the list was", async () => {
		const { container } = render(<AgentRuns />);
		container.scrollTop = 400;

		fireEvent.click(
			screen.getByRole("button", { name: "Quarterly report" }),
		);
		await screen.findByTestId("agent-run-graph");
		expect(container.scrollTop).toBe(0);

		fireEvent.click(screen.getByRole("button", { name: "Back to list" }));
		expect(container.scrollTop).toBe(400);
	});

	it("opens a room read only through the admin reads", async () => {
		render(<AgentRuns />);

		fireEvent.click(
			screen.getByRole("button", { name: "Quarterly report" }),
		);

		expect(await screen.findByTestId("agent-run-graph")).toHaveTextContent(
			"1 runs",
		);
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'AdminGetAllAgentRunsForRoom(roomId=["r1"], userId=["alice"], userType=["NATIVE"]);',
		);
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'AdminGetAgentRun(runId=["run1"], includeMessages=[true]);',
		);
		expect(mocks.graph).toHaveBeenLastCalledWith(
			expect.objectContaining({ isReadOnly: true }),
		);

		fireEvent.click(screen.getByRole("button", { name: "Back to list" }));
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Quarterly report" }),
			).toBeInTheDocument(),
		);
	});

	it("shows who the room belongs to and how its runs stand", async () => {
		render(<AgentRuns />);

		fireEvent.click(
			screen.getByRole("button", { name: "Quarterly report" }),
		);

		await screen.findByTestId("agent-run-graph");
		const summary = screen.getByText("Last activity").closest("dl");
		if (!summary) {
			throw new Error("The room summary is missing.");
		}
		const details = within(summary);
		expect(details.getByText("Alice Doe")).toBeInTheDocument();
		expect(details.getByText("Agent A")).toBeInTheDocument();
		expect(details.getByText("id: agent-a")).toBeInTheDocument();
		expect(details.getByText("1 run")).toBeInTheDocument();
		expect(details.getByText("1 in progress")).toBeInTheDocument();
	});

	it("exports the room's runs as Markdown, named by the room", async () => {
		render(<AgentRuns />);
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

	it("closes the room once the admin confirms, and reads the list again", async () => {
		render(<AgentRuns />);
		fireEvent.click(
			screen.getByRole("button", { name: "Quarterly report" }),
		);
		await screen.findByTestId("agent-run-graph");

		fireEvent.click(screen.getByRole("button", { name: "Close Room" }));
		const dialog = await screen.findByRole("dialog");
		expect(dialog).toHaveTextContent("Alice Doe");
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Close Room" }),
		);

		await waitFor(() =>
			expect(mocks.runPixel).toHaveBeenCalledWith(
				'AdminCloseRoom(roomId=["r1"], userId=["alice"], userType=["NATIVE"]);',
			),
		);
		// it stays focusable, so its tooltip can say the room is closed
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Close Room" }),
			).toHaveAttribute("aria-disabled", "true"),
		);
		expect(screen.getByText("Closed")).toBeInTheDocument();
		expect(mocks.refresh).toHaveBeenCalled();
	});

	it("leaves the room open when the admin cancels", async () => {
		render(<AgentRuns />);
		fireEvent.click(
			screen.getByRole("button", { name: "Quarterly report" }),
		);
		await screen.findByTestId("agent-run-graph");

		fireEvent.click(screen.getByRole("button", { name: "Close Room" }));
		fireEvent.click(
			within(await screen.findByRole("dialog")).getByRole("button", {
				name: "Cancel",
			}),
		);

		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(mocks.runPixel).not.toHaveBeenCalledWith(
			expect.stringContaining("AdminCloseRoom"),
		);
		expect(
			screen.getByRole("button", { name: "Close Room" }),
		).not.toHaveAttribute("aria-disabled", "true");
	});
});
