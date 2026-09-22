import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SidebarProvider, useSidebar } from "@semoss/ui/next";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import { AgentsOverviewPage } from "./agents-overview.page";

const mainState = vi.hoisted(() => ({
	agents: [] as Agent[],
	sessions: [] as Session[],
}));

vi.mock("@/app/main.context", () => ({
	useMain: () => mainState,
}));

const agent: Agent = {
	id: "research-agent",
	name: "Research agent",
	role: "Analyst",
	type: "Individual",
	icon: "compass",
	tone: "blue",
	workspace: "Conversation",
	instructions: "Research the requested topic.",
	skills: [],
	databases: [],
	dataProducts: [],
	members: [],
	depth: 0,
	concurrency: 1,
	spawn: false,
	triggers: [],
};

function SidebarState() {
	const { state } = useSidebar();
	return <output aria-label="Workspace sidebar state">{state}</output>;
}

describe("AgentsOverviewPage", () => {
	beforeAll(() => {
		vi.stubGlobal("matchMedia", (media: string) => ({
			media,
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));
	});

	afterAll(() => vi.unstubAllGlobals());

	beforeEach(() => {
		mainState.agents = [agent];
		mainState.sessions = [];
	});

	it("collapses the workspace sidebar when an agent is selected", async () => {
		const user = userEvent.setup();
		render(
			<MemoryRouter>
				<SidebarProvider defaultOpen>
					<SidebarState />
					<AgentsOverviewPage />
				</SidebarProvider>
			</MemoryRouter>,
		);

		expect(
			screen.getByRole("status", { name: "Workspace sidebar state" }),
		).toHaveTextContent("expanded");
		await user.click(
			screen.getByRole("link", { name: "Open Research agent" }),
		);
		expect(
			screen.getByRole("status", { name: "Workspace sidebar state" }),
		).toHaveTextContent("collapsed");
	});
});
