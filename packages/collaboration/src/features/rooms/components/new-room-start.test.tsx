import { act, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { Engine } from "@semoss/shared";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import type { Agent } from "@/types/agent";
import { NewRoomStart } from "./new-room-start";
import type { RoomComposer } from "./room-composer";

const agent: WorkspaceAgent = {
	workspace_id: "agent-1",
	name: "Research agent",
	description: "Researches complex topics",
	system_prompt: "Check sources.",
	mcp: [],
	skills: [],
	prompts: [],
	config_json: {
		model_id: "model-default",
		budgets: { max_turns: 12, max_reflections: 3 },
	},
};

const agentSummary: Agent = {
	id: "agent-1",
	name: "Research agent",
	description: "Researches complex topics",
	icon: "compass",
	tone: "blue",
	instructions: "Check sources.",
	skills: [],
	mcp: [],
	members: [],
};

const writingAgent: Agent = {
	...agentSummary,
	id: "agent-2",
	name: "Writing agent",
};

const harness = vi.hoisted(() => ({
	props: null as ComponentProps<typeof RoomComposer> | null,
	actions: { run: vi.fn() },
	addPendingRoom: vi.fn(),
	trackGeneratedRoomName: vi.fn(),
	createRoom: vi.fn(),
	submitAgentTurn: vi.fn(),
}));

vi.mock("@/app/main.context", () => ({
	useMain: () => ({
		addPendingRoom: harness.addPendingRoom,
		trackGeneratedRoomName: harness.trackGeneratedRoomName,
	}),
}));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: harness.actions, insightId: "insight-1" }),
}));
vi.mock("@/features/rooms/api/create-room", () => ({
	createRoom: harness.createRoom,
}));
vi.mock("@/features/rooms/api/use-agent-turn", () => ({
	submitAgentTurn: harness.submitAgentTurn,
}));
vi.mock("@/features/rooms/api/use-room-model", () => ({
	useRoomModel: (modelId: string) => ({
		engine: modelId
			? { engine_id: modelId, engine_display_name: `Name ${modelId}` }
			: null,
		isLoading: false,
		error: null,
	}),
}));
vi.mock("@/features/rooms/api/optimize-prompt", () => ({
	optimizePrompt: vi.fn(async () => "Optimized"),
}));
vi.mock("@/features/rooms/components/room-composer", () => ({
	RoomComposer: (props: ComponentProps<typeof RoomComposer>) => {
		harness.props = props;
		return <div>Landing composer</div>;
	},
}));

const routes: RouteObject[] = [
	{
		path: "/new",
		element: (
			<NewRoomStart
				agent={agent}
				agents={[agentSummary, writingAgent]}
				selectedAgentId="agent-1"
				isAgentReady
				agentError={null}
				onRetryAgent={vi.fn()}
			/>
		),
	},
	{
		path: "/room/:roomId",
		element: <div>Room opened</div>,
	},
];

function renderDraft(initialEntry = "/new?agentId=agent-1&model=model-2") {
	const router = createMemoryRouter(routes, {
		initialEntries: [initialEntry],
	});
	render(<RouterProvider router={router} />);
	return router;
}

function composerProps(): ComponentProps<typeof RoomComposer> {
	if (!harness.props) throw new Error("RoomComposer did not render");
	return harness.props;
}

describe("NewRoomStart", () => {
	beforeAll(() => {
		HTMLElement.prototype.hasPointerCapture = () => false;
		HTMLElement.prototype.releasePointerCapture = vi.fn();
	});

	beforeEach(() => {
		harness.props = null;
		harness.addPendingRoom.mockReset();
		harness.trackGeneratedRoomName.mockReset();
		harness.createRoom.mockReset().mockResolvedValue("room-1");
		harness.submitAgentTurn.mockReset().mockResolvedValue(undefined);
	});

	it("stays client-only until the first message is submitted", async () => {
		const router = renderDraft();

		expect(screen.getByText("Landing composer")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				name: "Start a conversation with Research agent",
			}),
		).toBeVisible();
		expect(composerProps().modelId).toBe("model-2");
		expect(composerProps().variant).toBe("landing");
		expect(composerProps().agentId).toBe("agent-1");
		expect(composerProps().agentOptions).toEqual([
			{ id: "agent-1", name: "Research agent" },
			{ id: "agent-2", name: "Writing agent" },
		]);
		expect(composerProps().modelName).toBe("Name model-2");
		expect(harness.createRoom).not.toHaveBeenCalled();

		await act(() =>
			composerProps().onSend({
				text: "Plan the quarter",
				files: [],
			}),
		);

		expect(harness.createRoom).toHaveBeenCalledWith(
			harness.actions,
			"insight-1",
			{
				workspaceId: "agent-1",
				workspaceName: "Research agent",
				instructions: "Check sources.",
				modelId: "model-2",
			},
			expect.objectContaining({
				roomId: undefined,
				onCreated: expect.any(Function),
			}),
		);
		expect(harness.addPendingRoom).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "room-1",
				agentId: "agent-1",
				modelId: "model-2",
				title: "New session",
			}),
		);
		expect(harness.submitAgentTurn).toHaveBeenCalledWith(
			{
				insightId: "insight-1",
				roomId: "room-1",
				agentId: "agent-1",
				engine: "model-2",
				maxTurns: 12,
				maxReflections: 3,
			},
			{ text: "Plan the quarter", files: [] },
		);
		expect(harness.trackGeneratedRoomName).toHaveBeenCalledWith(
			"agent-1",
			"room-1",
		);
		expect(router.state.location.pathname).toBe("/room/room-1");
		expect(router.state.historyAction).toBe("REPLACE");
	});

	it("reuses a created room when submission is retried", async () => {
		harness.submitAgentTurn
			.mockRejectedValueOnce(new Error("Could not submit"))
			.mockResolvedValueOnce(undefined);
		renderDraft();

		await expect(
			act(() => composerProps().onSend({ text: "Retry me", files: [] })),
		).rejects.toThrow("Could not submit");
		await act(() =>
			composerProps().onSend({ text: "Retry me", files: [] }),
		);

		expect(harness.createRoom).toHaveBeenCalledTimes(1);
		expect(harness.submitAgentTurn).toHaveBeenCalledTimes(2);
	});

	it("resumes setup for a room allocated by a failed creation attempt", async () => {
		harness.createRoom
			.mockImplementationOnce(
				async (
					_actions: unknown,
					_insightId: string,
					_options: unknown,
					attempt: { onCreated?: (roomId: string) => void },
				) => {
					attempt.onCreated?.("room-1");
					throw new Error("Could not configure room");
				},
			)
			.mockResolvedValueOnce("room-1");
		renderDraft();

		await expect(
			act(() => composerProps().onSend({ text: "Retry me", files: [] })),
		).rejects.toThrow("Could not configure room");
		await act(() =>
			composerProps().onSend({ text: "Retry me", files: [] }),
		);

		expect(harness.createRoom).toHaveBeenCalledTimes(2);
		expect(harness.createRoom.mock.calls[1]?.[3]).toEqual(
			expect.objectContaining({ roomId: "room-1" }),
		);
		expect(harness.addPendingRoom).toHaveBeenCalledTimes(1);
		expect(harness.submitAgentTurn).toHaveBeenCalledTimes(1);
	});

	it("keeps a changed model on the new-room URL", async () => {
		const router = renderDraft();
		const nextEngine: Engine = {
			engine_id: "model-3",
			engine_name: "model-three",
			engine_type: "MODEL",
		};

		await act(() => composerProps().onModelChange(nextEngine));

		expect(router.state.location.pathname).toBe("/new");
		expect(router.state.location.search).toBe(
			"?agentId=agent-1&model=model-3",
		);
		expect(composerProps().modelId).toBe("model-3");
		expect(harness.createRoom).not.toHaveBeenCalled();
	});

	it("adds the default model to the URL without remounting the page", async () => {
		const router = renderDraft("/new?agentId=agent-1");
		const composer = screen.getByText("Landing composer");

		await waitFor(() =>
			expect(router.state.location.search).toBe(
				"?agentId=agent-1&model=model-default",
			),
		);
		expect(screen.getByText("Landing composer")).toBe(composer);
		expect(router.state.historyAction).toBe("REPLACE");
	});

	it("switches agents on the same new-room page", () => {
		const router = renderDraft();

		act(() => composerProps().onAgentChange?.("agent-2"));

		expect(router.state.location.pathname).toBe("/new");
		expect(router.state.location.search).toBe(
			"?agentId=agent-2&model=model-2",
		);
		expect(router.state.historyAction).toBe("REPLACE");
		expect(harness.createRoom).not.toHaveBeenCalled();
	});
});
