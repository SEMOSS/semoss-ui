import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { EditWorkspacePage } from "@/pages/edit-workspace-page";
import { WorkspaceDetailPage } from "@/pages/workspace-detail-page";

const mocks = vi.hoisted(() => ({
	workspaceId: "agent-1",
	workspace: {} as Record<string, unknown>,
	editWorkspace: vi.fn(),
	navigate: vi.fn(),
}));
// Query snapshots are supplied through rerender instead of an SDK subscription.
vi.mock("mobx-react-lite", () => ({
	observer: <T,>(component: T) => component,
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
vi.mock("@/hooks/use-chat", () => ({
	useChat: () => ({ chat: { editWorkspace: mocks.editWorkspace } }),
}));
vi.mock("@/hooks/use-root", () => ({
	useRoot: () => ({ root: { theme: { featureFlags: {} } } }),
}));
vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getUserProjectPermission: async () => "OWNER",
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	usePixel: (pixel: string) => ({
		status: "SUCCESS",
		data: pixel.startsWith("GetWorkspace") ? mocks.workspace : [],
	}),
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
vi.mock("@/components/workspace/workspace-chat-list", () => ({
	WorkspaceChatList: () => null,
}));

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
		hook_capabilities: {
			pixel: {
				events: ["beforeRun", "afterRun"],
				binding_sources: [
					{ source: "event", events: ["beforeRun", "afterRun"] },
					{ source: "result.finalText", events: ["afterRun"] },
				],
			},
		},
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
	render(<EditWorkspacePage />);
	const name = screen.getByLabelText("form.name");
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
	const view = render(<EditWorkspacePage />);
	fireEvent.change(screen.getByLabelText("form.name"), {
		target: { value: "Unsaved name" },
	});
	mocks.workspace = { ...mocks.workspace, name: "Refetched name" };
	view.rerender(<EditWorkspacePage />);
	expect(screen.getByLabelText("form.name")).toHaveValue("Unsaved name");
	mocks.workspaceId = "agent-2";
	mocks.workspace = {
		...mocks.workspace,
		workspace_id: "agent-2",
		name: "Second agent",
		config_json: {},
		prompts: [],
	};
	view.rerender(<EditWorkspacePage />);
	expect(screen.getByLabelText("form.name")).toHaveValue("Second agent");
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

test("an incompatible hook binding blocks the external Save action", async () => {
	mocks.workspace = {
		...mocks.workspace,
		config_json: {
			...(mocks.workspace.config_json as Record<string, unknown>),
			hooks: [
				{
					kind: "pixel",
					pixel: "Echo([hookOutput])",
					events: ["beforeRun"],
					bindings: { hookOutput: "result.finalText" },
				},
			],
		},
	};
	render(<EditWorkspacePage />);
	fireEvent.change(screen.getByLabelText("form.name"), {
		target: { value: "Updated agent" },
	});

	expect(await screen.findByRole("alert")).toHaveTextContent(
		"result.finalText is not available at every selected hook event.",
	);
	expect(
		screen.getByRole("button", { name: "workspace:actions.save" }),
	).toBeDisabled();
	fireEvent.click(
		screen.getByRole("button", { name: "workspace:actions.save" }),
	);
	expect(mocks.editWorkspace).not.toHaveBeenCalled();
});

test("the detail view shows the shared agent definition with its attached resources", async () => {
	render(<WorkspaceDetailPage />);
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
