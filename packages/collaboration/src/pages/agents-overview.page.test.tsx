import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import { AgentsOverviewPage } from "./agents-overview.page";

const mainState = vi.hoisted(() => ({
	agents: [] as Agent[],
	sessions: [] as Session[],
	newRoom: vi.fn(),
}));

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

describe("AgentsOverviewPage", () => {
	beforeEach(() => {
		mainState.agents = [agent];
		mainState.sessions = [];
		mainState.newRoom.mockReset();
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
		expect(screen.getByText("Research agent")).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Session" }));
		expect(mainState.newRoom).toHaveBeenCalledWith(agent.id);
	});

	it("shows the empty state with a valid create-agent link", () => {
		mainState.agents = [];
		render(
			<MemoryRouter>
				<AgentsOverviewPage />
			</MemoryRouter>,
		);

		expect(screen.getByText("No agents yet")).toBeVisible();
		for (const link of screen.getAllByRole("link", {
			name: "Create agent",
		})) {
			expect(link).toHaveAttribute("href", "/agents/new");
		}
	});
});
