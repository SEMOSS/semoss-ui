import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { Engine } from "@semoss/shared";
import { TooltipProvider } from "@semoss/ui/next";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import { agentFromWorkspace } from "@/features/agents/utils/agent-from-workspace";
import { NewRoomPage } from "./new-room.page";

interface AgentDetail {
	agent: WorkspaceAgent | null;
	isLoading: boolean;
	error: Error | null;
}

const researchAgent: WorkspaceAgent = {
	workspace_id: "research-agent",
	name: "Research agent",
	description: "Research",
	system_prompt: "Check sources.",
	mcp: [{ id: "research-source", name: "Research source", type: "VECTOR" }],
	skills: [],
	prompts: [],
	config_json: { model_id: "research-model", budgets: { max_turns: 12 } },
};
const writingAgent: WorkspaceAgent = {
	...researchAgent,
	workspace_id: "writing-agent",
	name: "Writing agent",
	system_prompt: "Write clearly.",
	mcp: [{ id: "writing-source", name: "Writing source", type: "VECTOR" }],
	config_json: { model_id: "writing-model", budgets: { max_turns: 8 } },
};
const engines: Engine[] = [
	{
		engine_id: "research-model",
		engine_name: "Research model",
		engine_type: "MODEL",
	},
	{
		engine_id: "writing-model",
		engine_name: "Writing model",
		engine_type: "MODEL",
	},
	{
		engine_id: "custom-model",
		engine_name: "Custom model",
		engine_type: "MODEL",
	},
];
const harness = vi.hoisted(() => ({
	details: {} as Record<string, AgentDetail>,
	createRoom: vi.fn(),
	submitAgentTurn: vi.fn(),
	addPendingRoom: vi.fn(),
	refresh: vi.fn(),
}));

vi.mock("@/app/main.context", () => ({
	useMain: () => ({
		agents: [researchAgent, writingAgent].map(agentFromWorkspace),
		sessions: [],
		openRoom: vi.fn(),
		addPendingRoom: harness.addPendingRoom,
		trackGeneratedRoomName: vi.fn(),
	}),
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: { run: vi.fn() }, insightId: "insight-1" }),
	useIteratorPixel: () => ({
		data: engines,
		isLoading: false,
		hasMore: false,
		next: vi.fn(),
	}),
}));
vi.mock("@/features/agents/api/use-agent-detail", () => ({
	useAgentDetail: (agentId: string) => ({
		...harness.details[agentId],
		refresh: harness.refresh,
	}),
}));
vi.mock("@/features/rooms/api/use-room-model", () => ({
	useRoomModel: (modelId: string) => ({
		engine: engines.find((engine) => engine.engine_id === modelId) ?? null,
		isLoading: false,
		error: null,
	}),
}));
vi.mock("@/features/rooms/api/create-room", () => ({
	createRoom: harness.createRoom,
}));
vi.mock("@/features/rooms/api/use-agent-turn", () => ({
	submitAgentTurn: harness.submitAgentTurn,
}));
vi.mock("@/features/rooms/api/optimize-prompt", () => ({
	optimizePrompt: vi.fn(),
}));

async function renderPage(
	initialEntry = "/new?agentId=research-agent&model=custom-model",
) {
	const router = createMemoryRouter(
		[
			{ path: "/new", Component: NewRoomPage },
			{ path: "/room/:roomId", element: <div>Room opened</div> },
		],
		{ initialEntries: [initialEntry] },
	);
	render(
		<TooltipProvider>
			<RouterProvider router={router} />
		</TooltipProvider>,
	);
	await waitFor(() =>
		expect(
			screen.getByRole("textbox", { name: /^Message / }),
		).toHaveFocus(),
	);
	return router;
}

function pasteDraft(text: string): HTMLElement {
	const editor = screen.getByRole("textbox", { name: /^Message / });
	fireEvent.paste(editor, {
		clipboardData: {
			items: [],
			types: ["text/plain"],
			getData: (type: string) => (type === "text/plain" ? text : ""),
		},
	});
	return editor;
}

async function selectAgent(
	user: ReturnType<typeof userEvent.setup>,
	name: string,
): Promise<void> {
	await user.click(screen.getByRole("combobox", { name: /^Choose agent:/ }));
	await user.type(
		screen.getByRole("combobox", { name: "Search agents" }),
		name,
	);
	await user.click(screen.getByRole("option", { name: new RegExp(name) }));
}

async function openSettings(
	user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
	await user.click(
		screen.getByRole("button", { name: "Open composer actions" }),
	);
	await user.click(screen.getByRole("button", { name: "Open settings" }));
}

describe("New-room controls", () => {
	beforeAll(() => {
		HTMLElement.prototype.hasPointerCapture = () => false;
		HTMLElement.prototype.releasePointerCapture = vi.fn();
	});
	beforeEach(() => {
		harness.details = {
			"research-agent": {
				agent: researchAgent,
				isLoading: false,
				error: null,
			},
			"writing-agent": {
				agent: writingAgent,
				isLoading: false,
				error: null,
			},
		};
		harness.createRoom.mockReset().mockResolvedValue("room-1");
		harness.submitAgentTurn.mockReset().mockResolvedValue(undefined);
		harness.addPendingRoom.mockReset();
		harness.refresh.mockReset();
	});

	it("preserves the message, attachments and room settings while applying a new agent's default", async () => {
		const user = userEvent.setup();
		const router = await renderPage();
		const editor = pasteDraft("Keep this message");
		const attachment = new File(["Reference"], "reference.txt", {
			type: "text/plain",
		});
		await user.upload(
			screen.getByLabelText("Choose attachments"),
			attachment,
		);
		await openSettings(user);
		const drawer = screen.getByRole("dialog", { name: "Room settings" });
		expect(drawer).toHaveAttribute("data-slot", "sheet-content");
		expect(drawer).toHaveAccessibleDescription(
			"Configure the model, instructions and resources for this room only.",
		);
		await user.type(
			screen.getByRole("textbox", { name: "Instructions" }),
			"Keep my room instructions",
		);
		await user.click(screen.getByRole("button", { name: "Save settings" }));
		await selectAgent(user, "Writing agent");

		expect(
			screen.getByRole("textbox", { name: "Message Writing agent" }),
		).toBe(editor);
		expect(editor).toHaveTextContent("Keep this message");
		expect(screen.getByText("reference.txt")).toBeVisible();
		expect(router.state.location.search).toBe(
			"?agentId=writing-agent&model=writing-model",
		);
		expect(
			await screen.findByRole("combobox", { name: "Writing model" }),
		).toBeEnabled();
		await openSettings(user);
		expect(
			screen.getByRole("textbox", { name: "Instructions" }),
		).toHaveValue("Keep my room instructions");
		expect(screen.getByText("Writing source")).toBeVisible();
		expect(screen.queryByText("Research source")).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(harness.createRoom).not.toHaveBeenCalled();
		await user.click(
			screen.getByRole("button", {
				name: "Send message to Writing agent",
			}),
		);
		await screen.findByText("Room opened");
		expect(harness.createRoom).toHaveBeenCalledWith(
			expect.anything(),
			"insight-1",
			expect.objectContaining({
				workspaceId: "writing-agent",
				modelId: "writing-model",
				instructions: "Keep my room instructions",
			}),
			expect.anything(),
		);
		expect(harness.submitAgentTurn).toHaveBeenCalledWith(
			expect.objectContaining({
				agentId: "writing-agent",
				engine: "writing-model",
				maxTurns: 8,
			}),
			{ text: "Keep this message", files: [attachment] },
		);
	});

	it("keeps explicit model choices through refresh and switches to agents without defaults", async () => {
		const user = userEvent.setup();
		harness.details["writing-agent"] = {
			agent: { ...writingAgent, config_json: {} },
			isLoading: false,
			error: null,
		};
		const router = await renderPage("/new?agentId=research-agent");
		expect(router.state.location.search).toBe(
			"?agentId=research-agent&model=research-model",
		);
		await user.click(
			screen.getByRole("combobox", { name: "Research model" }),
		);
		await user.click(screen.getByRole("option", { name: /Custom model/ }));
		expect(router.state.location.search).toContain("model=custom-model");
		await selectAgent(user, "Writing agent");
		expect(router.state.location.search).toBe(
			"?agentId=writing-agent&model=custom-model",
		);
		harness.details["writing-agent"] = {
			agent: writingAgent,
			isLoading: false,
			error: null,
		};
		await act(() =>
			router.navigate(`/new${router.state.location.search}`, {
				replace: true,
			}),
		);
		expect(
			screen.getByRole("combobox", { name: "Custom model" }),
		).toBeEnabled();
		expect(router.state.location.search).toContain("model=custom-model");
		await selectAgent(user, "Research agent");
		expect(router.state.location.search).toContain("model=research-model");
	});

	it("blocks stale agent submissions, preserves the draft after a load error and allows recovery", async () => {
		const user = userEvent.setup();
		const router = await renderPage();
		const editor = pasteDraft("Retain my draft");
		harness.details["writing-agent"] = {
			agent: researchAgent,
			isLoading: true,
			error: null,
		};
		await selectAgent(user, "Writing agent");
		expect(screen.getByText("Loading selected agent…")).toBeVisible();
		expect(
			screen.getByRole("button", {
				name: "Send message to Writing agent",
			}),
		).toBeDisabled();
		expect(editor).toHaveTextContent("Retain my draft");
		expect(router.state.location.search).toContain("model=custom-model");
		harness.details["writing-agent"] = {
			agent: null,
			isLoading: false,
			error: new Error("Agent unavailable"),
		};
		await act(() =>
			router.navigate(`/new${router.state.location.search}`, {
				replace: true,
			}),
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Agent unavailable",
		);
		await user.click(screen.getByRole("button", { name: "Try again" }));
		expect(harness.refresh).toHaveBeenCalledOnce();
		await selectAgent(user, "Research agent");
		expect(
			screen.getByRole("textbox", { name: "Message Research agent" }),
		).toBe(editor);
		expect(
			screen.getByRole("button", {
				name: "Send message to Research agent",
			}),
		).toBeEnabled();
		expect(harness.createRoom).not.toHaveBeenCalled();
	});

	it("applies a delayed incoming default once and keeps later manual model choices", async () => {
		const user = userEvent.setup();
		const router = await renderPage();
		harness.details["writing-agent"] = {
			agent: researchAgent,
			isLoading: true,
			error: null,
		};
		await selectAgent(user, "Writing agent");
		harness.details["writing-agent"] = {
			agent: writingAgent,
			isLoading: false,
			error: null,
		};
		await act(() =>
			router.navigate(`/new${router.state.location.search}`, {
				replace: true,
			}),
		);
		expect(router.state.location.search).toContain("model=writing-model");
		await user.click(
			await screen.findByRole("combobox", { name: "Writing model" }),
		);
		await user.click(screen.getByRole("option", { name: /Custom model/ }));
		await act(() =>
			router.navigate(`/new${router.state.location.search}`, {
				replace: true,
			}),
		);
		expect(router.state.location.search).toContain("model=custom-model");
	});

	it("synchronizes settings model changes with the toolbar and first submission", async () => {
		const user = userEvent.setup();
		const router = await renderPage();
		await openSettings(user);
		await user.click(
			screen.getByRole("combobox", { name: "Custom model" }),
		);
		await user.click(screen.getByRole("option", { name: /Writing model/ }));
		await user.click(screen.getByRole("button", { name: "Save settings" }));
		expect(router.state.location.search).toContain("model=writing-model");
		expect(
			await screen.findByRole("combobox", { name: "Writing model" }),
		).toBeEnabled();
		pasteDraft("Use the selected model");
		await user.click(
			screen.getByRole("button", {
				name: "Send message to Research agent",
			}),
		);
		await screen.findByText("Room opened");
		expect(harness.submitAgentTurn).toHaveBeenCalledWith(
			expect.objectContaining({ engine: "writing-model" }),
			expect.anything(),
		);
	});

	it("locks selections during creation and reuses the allocated room after a failed turn", async () => {
		const user = userEvent.setup();
		let finishCreation: ((roomId: string) => void) | undefined;
		harness.createRoom.mockImplementation(
			() =>
				new Promise<string>((resolve) => {
					finishCreation = resolve;
				}),
		);
		harness.submitAgentTurn
			.mockRejectedValueOnce(new Error("Turn failed"))
			.mockResolvedValueOnce(undefined);
		await renderPage();
		pasteDraft("Retry this message");
		await user.click(
			screen.getByRole("button", {
				name: "Send message to Research agent",
			}),
		);
		expect(
			screen.getByRole("combobox", { name: /^Choose agent:/ }),
		).toBeDisabled();
		expect(
			screen.getByRole("combobox", { name: "Custom model" }),
		).toBeDisabled();
		await act(async () => finishCreation?.("room-1"));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Turn failed",
		);
		expect(
			screen.getByRole("combobox", { name: /^Choose agent:/ }),
		).toBeDisabled();
		expect(
			screen.getByRole("combobox", { name: "Custom model" }),
		).toBeDisabled();
		expect(
			screen.getByRole("textbox", { name: "Message Research agent" }),
		).toHaveTextContent("Retry this message");
		await user.click(
			screen.getByRole("button", {
				name: "Send message to Research agent",
			}),
		);
		await waitFor(() =>
			expect(harness.submitAgentTurn).toHaveBeenCalledTimes(2),
		);
		expect(harness.createRoom).toHaveBeenCalledOnce();
	});
});
