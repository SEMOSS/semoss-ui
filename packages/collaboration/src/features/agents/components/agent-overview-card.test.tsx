import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import { AgentOverviewCard } from "./agent-overview-card";

const detailState = vi.hoisted(() => ({
	agent: null as WorkspaceAgent | null,
	isLoading: false,
	error: null as Error | null,
	refresh: vi.fn(),
}));

vi.mock("@/features/agents/api/use-agent-detail", () => ({
	useAgentDetail: () => detailState,
}));

const leadAgent: Agent = {
	id: "research/agent",
	name: "Research agent",
	description: "",
	instructions: "",
	skills: [],
	mcp: [],
	members: [],
};

const specialists: Agent[] = [
	{
		...leadAgent,
		id: "writer",
		name: "Writer",
	},
	{
		...leadAgent,
		id: "calendar",
		name: "Calendar",
	},
];

const sessions: Session[] = [
	{
		id: "older-room",
		agentId: leadAgent.id,
		title: "Old notes",
		origin: "You",
		status: "Ready",
		updatedAt: "2026-09-20T12:00:00.000Z",
		unread: false,
		pinned: false,
		preview: "Old notes preview",
	},
	{
		id: "briefing-room",
		agentId: leadAgent.id,
		title: "Briefing board",
		origin: "You",
		status: "Ready",
		updatedAt: "2026-09-23T12:00:00.000Z",
		unread: false,
		pinned: false,
		preview: "Briefing board preview",
	},
];

function renderCard(onNewSession = vi.fn()) {
	return {
		onNewSession,
		view: render(
			<MemoryRouter>
				<AgentOverviewCard
					agent={leadAgent}
					agents={[leadAgent, ...specialists]}
					sessions={sessions}
					onNewSession={onNewSession}
				/>
			</MemoryRouter>,
		),
	};
}

describe("AgentOverviewCard", () => {
	beforeEach(() => {
		detailState.agent = {
			workspace_id: leadAgent.id,
			name: leadAgent.name,
			description: "Chief of staff",
			system_prompt:
				"Coordinates research, meetings, follow-through, and operations.",
			mcp: [
				{ id: "tool-1", name: "Tool one", type: "PROJECT" },
				{ id: "tool-2", name: "Tool two", type: "FUNCTION" },
				{ id: "tool-3", name: "Tool three", type: "DATABASE" },
			],
			skills: [
				{ id: "triage", name: "Triage & prioritize" },
				{ id: "follow-up", name: "Follow-through tracking" },
				{ id: "briefing", name: "Prepare briefings" },
			],
			prompts: [],
			config_json: {
				subagents: [
					{ workspaceId: specialists[0].id },
					{ workspaceId: specialists[1].id },
				],
				hooks: [{ kind: "before_run" }],
			},
		};
		detailState.isLoading = false;
		detailState.error = null;
		detailState.refresh.mockReset();
	});

	it("renders live details, statistics, team members, and actions", async () => {
		const user = userEvent.setup();
		const { onNewSession } = renderCard();

		expect(screen.getByText("Team agent")).toBeVisible();
		expect(
			screen.getByRole("heading", {
				name: "Research agent / Chief of staff",
			}),
		).toBeVisible();
		expect(screen.getByText("Briefing board")).toBeVisible();
		expect(screen.getByText("Triage & prioritize")).toBeVisible();
		expect(screen.getByText("Follow-through tracking")).toBeVisible();
		expect(screen.getByText("+1")).toBeVisible();
		expect(screen.getByText("3 tools")).toBeVisible();
		expect(screen.getByText("3 skills")).toBeVisible();
		expect(screen.getByText("1 triggers")).toBeVisible();
		expect(screen.getByText("2 rooms")).toBeVisible();
		expect(
			screen.getByRole("img", {
				name: "Team members: Writer, Calendar",
			}),
		).toBeVisible();
		expect(screen.getByRole("link", { name: "Configure" })).toHaveAttribute(
			"href",
			"/agents/research%2Fagent/settings",
		);
		expect(
			screen.getByRole("link", { name: "View sessions" }),
		).toHaveAttribute("href", "/room?agentId=research%2Fagent");

		await user.click(screen.getByRole("button", { name: "Session" }));
		expect(onNewSession).toHaveBeenCalledWith(leadAgent.id);
	});

	it("preserves card geometry while details load", () => {
		detailState.agent = null;
		detailState.isLoading = true;
		renderCard();

		expect(
			screen.getByText("Loading Research agent details"),
		).toBeVisible();
		expect(
			document.querySelector('[aria-busy="true"]'),
		).toBeInTheDocument();
	});

	it("surfaces detail failures and retries them", async () => {
		const user = userEvent.setup();
		detailState.agent = null;
		detailState.error = new Error("Workspace details could not be loaded.");
		renderCard();

		expect(screen.getByRole("alert")).toHaveTextContent(
			"Workspace details could not be loaded.",
		);
		await user.click(screen.getByRole("button", { name: "Try again" }));
		expect(detailState.refresh).toHaveBeenCalledOnce();
	});
});
