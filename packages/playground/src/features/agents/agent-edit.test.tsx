import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import {
	type ChatConfig,
	ChatConfigProvider,
	ChatSessionProvider,
	type ChatStore,
} from "@semoss/chat";
import { toast } from "@semoss/ui/next";
import { AgentDetailPage } from "@/pages/agent-detail.page";
import { AgentEditPage } from "@/pages/agent-edit.page";

/** The stubs the mocked modules call, reset before each test. */
const mocks = vi.hoisted(() => ({
	workspaceId: "agent-1",
	workspace: {} as Record<string, unknown>,
	editWorkspace: vi.fn(),
	navigate: vi.fn(),
}));
/** The session's insight, running each task in one insight. */
const mockSessionInsight = vi.hoisted(() => ({
	withInsight: (task: (insightId: string) => Promise<unknown>) =>
		task("insight-1"),
}));
/** Answers each pixel the pages read with this test's fixtures. */
const mockPixel = vi.hoisted(() => () => ({
	status: "SUCCESS",
	data: [],
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}));
vi.mock("react-router", async (original) => ({
	...(await original<typeof import("react-router")>()),
	useParams: () => ({ workspaceId: mocks.workspaceId }),
	useNavigate: () => mocks.navigate,
}));
// the edit page saves through the agent actions
vi.mock("@/features/agents/agent-actions", () => ({
	editAgent: mocks.editWorkspace,
}));
vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getUserProjectPermission: async () => "OWNER",
	// the agent the pages read, as the SDK reads it
	getWorkspace: async () => mocks.workspace,
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	usePixel: mockPixel,
	useSessionPixel: mockPixel,
	// stable, as the SDK's is
	useSessionInsight: () => mockSessionInsight,
	useIteratorPixel: () => ({
		data: [],
		next: vi.fn(),
		isLoading: false,
		hasMore: false,
	}),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	MCPSelector: () => null,
	PromptSelector: () => null,
	SkillSelector: () => null,
	MembersTable: () => null,
	AppCatalogAvatar: () => null,
}));
vi.mock("@/features/agents/workspace-chat-list", () => ({
	WorkspaceChatList: () => null,
}));

/** The chat providers the pages read from, over this test's stub chat store. */
const chatWrapper = ({ children }: { children: ReactNode }) => (
	<ChatSessionProvider store={{} as unknown as ChatStore}>
		<ChatConfigProvider
			config={
				{
					theme: { featureFlags: {} },
					options: {},
					callbacks: {},
				} as unknown as ChatConfig
			}
		>
			{children}
		</ChatConfigProvider>
	</ChatSessionProvider>
);

beforeEach(() => {
	vi.clearAllMocks();
	mocks.workspaceId = "agent-1";
	mocks.workspace = {
		workspace_id: "agent-1",
		name: "Research agent",
		description: "Research notes",
		system_prompt: "First\\nSecond",
		mcp: [
			{ id: "knowledge", name: "Notes", type: "VECTOR" },
			{ id: "toolbox", name: "Files", type: "PROJECT" },
		],
		skills: [{ id: "skill-1", name: "Writing" }],
		prompts: [{ id: "prompt-1", name: "Summarize", type: "PROMPT" }],
		known_hook_kinds: ["pixel"],
		default_tools: [{ name: "read_file", title: "Read file" }],
		config_json: {
			model_id: "model-1",
			greeting: "Welcome",
			greeting_enabled: true,
			use_default_agent_tools: true,
			tool_policy: { default_tools: { disabled: ["read_file"] } },
			budgets: { max_turns: 12, max_reflections: 2, max_seconds: 60 },
			spawn_policy: {
				max_subagent_depth: 2,
				max_subagents_per_run: 3,
				max_spawns_per_turn: 1,
			},
			subagents: [{ workspaceId: "helper-1" }],
			hooks: [
				{
					kind: "pixel",
					pixel: 'Echo("ready")',
					events: ["beforeRun"],
				},
			],
		},
	};
});

test("the existing editor saves all agent settings, retains failed edits, and retries", async () => {
	let rejectSave: (error: Error) => void = () => {};
	mocks.editWorkspace
		.mockImplementationOnce(
			() =>
				new Promise((_, reject) => {
					rejectSave = reject;
				}),
		)
		.mockResolvedValueOnce(undefined);
	render(<AgentEditPage />, { wrapper: chatWrapper });
	const name = await screen.findByLabelText("form.name");
	expect(name).toHaveValue("Research agent");
	expect(screen.getByLabelText("about.instructions")).toHaveValue(
		"First\nSecond",
	);
	expect(
		screen.getByRole("combobox", { name: "about.defaultModel" }),
	).toBeEnabled();
	fireEvent.change(name, { target: { value: "Updated agent" } });
	fireEvent.change(screen.getByLabelText("about.greeting"), {
		target: { value: "Updated welcome" },
	});
	fireEvent.click(
		screen.getByRole("button", { name: "workspace:actions.save" }),
	);
	await waitFor(() => expect(mocks.editWorkspace).toHaveBeenCalledTimes(1));
	expect(mocks.editWorkspace).toHaveBeenCalledWith(
		"agent-1",
		expect.objectContaining({
			name: "Updated agent",
			instructions: "First\nSecond",
			greeting: "Updated welcome",
			greetingEnabled: true,
			modelId: "model-1",
			useDefaultAgentTools: true,
			disabledDefaultTools: ["read_file"],
			maxTurns: "12",
			maxReflections: "2",
			maxSeconds: "60",
			maxSubagentDepth: "2",
			maxSubagentsPerRun: "3",
			maxSpawnsPerTurn: "1",
			prompts: ["prompt-1"],
			skills: [{ id: "skill-1", name: "Writing" }],
			knowledge: [{ id: "knowledge", name: "Notes", type: "VECTOR" }],
			toolboxes: [{ id: "toolbox", name: "Files", type: "PROJECT" }],
			subagents: [{ workspaceId: "helper-1" }],
			hooks: [
				{
					kind: "pixel",
					pixel: 'Echo("ready")',
					events: ["beforeRun"],
				},
			],
		}),
	);
	expect(name).toBeDisabled();
	expect(
		screen.getByRole("combobox", { name: "about.defaultModel" }),
	).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "form.subagents.add" }),
	).toBeDisabled();
	await act(async () => rejectSave(new Error("Save unavailable")));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Save unavailable",
	);
	expect(name).toHaveValue("Updated agent");
	expect(mocks.navigate).not.toHaveBeenCalled();
	fireEvent.click(
		screen.getByRole("button", { name: "workspace:actions.save" }),
	);
	await waitFor(() =>
		expect(mocks.navigate).toHaveBeenCalledWith("/agent/agent-1"),
	);
	expect(mocks.editWorkspace).toHaveBeenCalledTimes(2);
});

test("refreshes preserve dirty edits while switching agents resets the full configuration", async () => {
	const warning = vi
		.spyOn(toast, "warning")
		.mockImplementation(() => "warning");
	mocks.editWorkspace.mockResolvedValue("Some resources were skipped");
	const view = render(<AgentEditPage />, { wrapper: chatWrapper });
	fireEvent.change(await screen.findByLabelText("form.name"), {
		target: { value: "Unsaved name" },
	});
	mocks.workspace = { ...mocks.workspace, name: "Refetched name" };
	view.rerender(<AgentEditPage />);
	expect(screen.getByLabelText("form.name")).toHaveValue("Unsaved name");
	mocks.workspaceId = "agent-2";
	mocks.workspace = {
		...mocks.workspace,
		workspace_id: "agent-2",
		name: "Second agent",
		config_json: {},
		prompts: [],
	};
	view.rerender(<AgentEditPage />);
	await waitFor(() =>
		expect(screen.getByLabelText("form.name")).toHaveValue("Second agent"),
	);
	expect(screen.getByLabelText("about.greeting")).toHaveValue("");
	fireEvent.change(screen.getByLabelText("form.name"), {
		target: { value: "Second edited" },
	});
	fireEvent.click(
		screen.getByRole("button", { name: "workspace:actions.save" }),
	);
	await waitFor(() =>
		expect(mocks.editWorkspace).toHaveBeenCalledWith(
			"agent-2",
			expect.objectContaining({
				modelId: "",
				subagents: [],
				hooks: [],
				prompts: [],
			}),
		),
	);
	expect(warning).toHaveBeenCalledWith("Some resources were skipped");
	warning.mockRestore();
});

test("the detail view shows the shared agent definition with its attached resources", async () => {
	render(<AgentDetailPage />, { wrapper: chatWrapper });
	await screen.findByRole("button", { name: "workspace:actions.edit" });
	expect(screen.getByText("Notes")).toBeVisible();
	expect(screen.getByText("Files")).toBeVisible();
	expect(screen.getByText("Writing")).toBeVisible();
	expect(screen.getByText("Summarize")).toBeVisible();
	expect(screen.getByText("Welcome")).toBeVisible();
	expect(screen.getByText(/First\s+Second/)).toBeVisible();
	expect(screen.getByText("sections.executionLimits.title")).toBeVisible();
	expect(screen.getByText("sections.hooks.title")).toBeVisible();
});
