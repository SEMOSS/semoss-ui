import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import type { Agent } from "@/types/agent";
import { NewRoomPage } from "./new-room.page";

const researchAgent: Agent = {
	id: "research-agent",
	name: "Research agent",
	description: "Analyst",
	instructions: "Research the requested topic.",
	skills: [],
	mcp: [],
	members: [],
};

const loadedAgent: WorkspaceAgent = {
	workspace_id: researchAgent.id,
	name: researchAgent.name,
	description: researchAgent.description,
	system_prompt: researchAgent.instructions,
	mcp: [],
	skills: [],
	prompts: [],
	config_json: { model_id: "model-default" },
};

const harness = vi.hoisted(() => ({
	agents: [] as Agent[],
	agent: null as WorkspaceAgent | null,
	isLoading: false,
	error: null as Error | null,
	refresh: vi.fn(),
}));

vi.mock("@/app/main.context", () => ({
	useMain: () => ({ agents: harness.agents }),
}));
vi.mock("@/features/agents/api/use-agent-detail", () => ({
	useAgentDetail: (agentId: string) => ({
		agent: agentId ? harness.agent : null,
		isLoading: agentId ? harness.isLoading : false,
		error: agentId ? harness.error : null,
		refresh: harness.refresh,
	}),
}));
vi.mock("@/features/rooms/components/new-room-start", () => ({
	NewRoomStart: ({
		agent,
		agents,
		selectedAgentId,
		isAgentReady,
	}: {
		agent: WorkspaceAgent;
		agents: Agent[];
		selectedAgentId: string;
		isAgentReady: boolean;
	}) => (
		<div>
			Composer for {agent.name}; {agents.length} agents available
			<span>
				Selected {selectedAgentId}; {isAgentReady ? "ready" : "loading"}
			</span>
		</div>
	),
}));

const routes: RouteObject[] = [
	{ path: "/new", Component: NewRoomPage },
	{ path: "/agents/new", element: <div>Add agent page</div> },
];

function renderPage(initialEntry = "/new") {
	const router = createMemoryRouter(routes, {
		initialEntries: [initialEntry],
	});
	const view = render(<RouterProvider router={router} />);
	return { router, ...view };
}

describe("NewRoomPage", () => {
	beforeEach(() => {
		harness.agents = [researchAgent];
		harness.agent = loadedAgent;
		harness.isLoading = false;
		harness.error = null;
		harness.refresh.mockReset();
	});

	it("opens the composer immediately with the first available agent", () => {
		const { router } = renderPage();

		expect(
			screen.getByText("Composer for Research agent; 1 agents available"),
		).toBeVisible();
		expect(router.state.location.pathname).toBe("/new");
		expect(router.state.location.search).toBe("");
	});

	it("loads an agent directly from the URL even when it is absent from the list", () => {
		harness.agents = [];
		renderPage("/new?agentId=research-agent");

		expect(
			screen.getByText("Composer for Research agent; 0 agents available"),
		).toBeVisible();
	});

	it("keeps the page mounted while a different agent loads", async () => {
		const { router } = renderPage(
			"/new?agentId=research-agent&model=model-default",
		);
		const composer = screen.getByText(
			"Composer for Research agent; 1 agents available",
		);
		harness.agent = null;
		harness.isLoading = true;

		await act(() =>
			router.navigate("/new?agentId=writing-agent&model=model-default"),
		);

		expect(
			screen.getByText("Composer for Research agent; 1 agents available"),
		).toBe(composer);
		expect(
			screen.getByText("Selected writing-agent; loading"),
		).toBeVisible();
		expect(
			screen.queryByRole("status", { name: "Loading agent" }),
		).not.toBeInTheDocument();
	});

	it("shows stable loading and recoverable error states", async () => {
		harness.agent = null;
		harness.isLoading = true;
		const { unmount } = renderPage("/new?agentId=research-agent");
		expect(
			screen.getByRole("status", { name: "Loading agent" }),
		).toBeVisible();

		unmount();
		harness.isLoading = false;
		harness.agent = null;
		harness.error = new Error("Workspace unavailable");
		const user = userEvent.setup();
		renderPage("/new?agentId=missing-agent");

		expect(
			screen.getByRole("heading", {
				name: "Could not load this agent",
			}),
		).toBeVisible();
		expect(screen.getByText("Workspace unavailable")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Try again" }));
		expect(harness.refresh).toHaveBeenCalledOnce();
	});

	it("shows an invalid-agent state when an id no longer exists", () => {
		harness.agent = null;
		renderPage("/new?agentId=missing-agent");

		expect(
			screen.getByRole("heading", { name: "Agent not found" }),
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Choose another agent" }),
		).toHaveAttribute("href", "/new");
	});

	it("offers agent creation when no agents exist", async () => {
		harness.agents = [];
		harness.agent = null;
		const user = userEvent.setup();
		const { router } = renderPage();

		expect(
			screen.getByRole("heading", { name: "No agents yet" }),
		).toBeVisible();
		await user.click(screen.getByRole("link", { name: "Add agent" }));
		expect(router.state.location.pathname).toBe("/agents/new");
	});
});
