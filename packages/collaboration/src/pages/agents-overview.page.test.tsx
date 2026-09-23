import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import { AgentsOverviewPage } from "./agents-overview.page";

const mainState = vi.hoisted(() => ({
	agents: [] as Agent[],
	keys: {} as Record<string, number>,
	sessions: [] as Session[],
	newRoom: vi.fn(),
}));

const directoryState = vi.hoisted(() => ({
	agents: [] as Agent[],
	error: null as Error | null,
	hasMore: false,
	isLoading: false,
	isRefreshing: false,
	next: vi.fn(),
	reset: vi.fn(),
}));

const useAgentDirectoryMock = vi.hoisted(() => vi.fn());

const detailState = vi.hoisted(() => ({
	agent: null as WorkspaceAgent | null,
	isLoading: false,
	error: null as Error | null,
	refresh: vi.fn(),
}));

vi.mock("@/app/main.context", () => ({
	useMain: () => mainState,
}));

vi.mock("@/features/agents/api/use-agent-detail", () => ({
	useAgentDetail: () => detailState,
}));

vi.mock("@/features/agents/api/use-agent-directory", () => ({
	useAgentDirectory: useAgentDirectoryMock,
}));

const agent: Agent = {
	id: "research-agent",
	name: "Research agent",
	description: "",
	icon: "compass",
	tone: "blue",
	instructions: "",
	skills: [],
	mcp: [],
	members: [],
};

const writingAgent: Agent = {
	...agent,
	id: "writing-agent",
	name: "Writing agent",
	description: "Editor",
	icon: "pen",
	tone: "amber",
};

describe("AgentsOverviewPage", () => {
	beforeEach(() => {
		mainState.agents = [agent];
		mainState.keys = {};
		mainState.sessions = [];
		mainState.newRoom.mockReset();
		directoryState.agents = [agent];
		directoryState.error = null;
		directoryState.hasMore = false;
		directoryState.isLoading = false;
		directoryState.isRefreshing = false;
		directoryState.next.mockReset();
		directoryState.reset.mockReset();
		useAgentDirectoryMock.mockReset();
		useAgentDirectoryMock.mockImplementation(() => directoryState);
		detailState.agent = {
			workspace_id: agent.id,
			name: agent.name,
			description: "Analyst",
			system_prompt: "Research the requested topic.",
			mcp: [],
			skills: [],
			prompts: [],
		};
		detailState.isLoading = false;
		detailState.error = null;
	});

	it("renders the team directory and starts an agent-scoped session", async () => {
		const user = userEvent.setup();
		render(
			<MemoryRouter>
				<AgentsOverviewPage />
			</MemoryRouter>,
		);

		expect(
			screen.getByText("Good people. Exceptional capabilities."),
		).toBeVisible();
		expect(
			screen.getByRole("heading", { name: "Meet your team." }),
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Create agent" }),
		).toHaveAttribute("href", "/agents/new");
		expect(
			screen.getByRole("searchbox", { name: "Search agents" }),
		).toBeVisible();
		expect(screen.getByText("Research agent")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Session" }));
		expect(mainState.newRoom).toHaveBeenCalledWith(agent.id);
	});

	it("searches agents through the directory query and clears an empty search", async () => {
		const user = userEvent.setup();
		mainState.agents = [agent, writingAgent];
		mainState.keys = { agents: 4 };
		directoryState.agents = [agent, writingAgent];
		useAgentDirectoryMock.mockImplementation((searchTerm: string) => ({
			...directoryState,
			agents:
				searchTerm === "editor"
					? [writingAgent]
					: searchTerm === "missing agent"
						? []
						: directoryState.agents,
		}));
		detailState.agent = null;
		render(
			<MemoryRouter>
				<AgentsOverviewPage />
			</MemoryRouter>,
		);

		const search = screen.getByRole("searchbox", {
			name: "Search agents",
		});
		await user.type(search, "editor");
		await waitFor(() => {
			expect(
				screen.queryByText("Research agent"),
			).not.toBeInTheDocument();
			expect(screen.getByText("Writing agent")).toBeVisible();
		});
		expect(useAgentDirectoryMock).toHaveBeenLastCalledWith("editor", 4);

		await user.clear(search);
		await user.type(search, "missing agent");
		expect(await screen.findByText("No matching agents")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Clear search" }));
		expect(search).toHaveValue("");
		expect(search).toHaveFocus();
		await waitFor(() => {
			expect(screen.getByText("Research agent")).toBeVisible();
			expect(screen.getByText("Writing agent")).toBeVisible();
		});
	});

	it("loads the next page on request", async () => {
		const user = userEvent.setup();
		directoryState.hasMore = true;
		render(
			<MemoryRouter>
				<AgentsOverviewPage />
			</MemoryRouter>,
		);

		await user.click(
			screen.getByRole("button", { name: "Load more agents" }),
		);
		expect(directoryState.next).toHaveBeenCalledOnce();
	});

	it("shows the empty state with a valid create-agent link", () => {
		mainState.agents = [];
		directoryState.agents = [];
		render(
			<MemoryRouter>
				<AgentsOverviewPage />
			</MemoryRouter>,
		);

		expect(screen.getByText("No agents yet")).toBeVisible();
		expect(
			screen.getByRole("searchbox", { name: "Search agents" }),
		).toBeVisible();
		for (const link of screen.getAllByRole("link", {
			name: "Create agent",
		})) {
			expect(link).toHaveAttribute("href", "/agents/new");
		}
	});
});
