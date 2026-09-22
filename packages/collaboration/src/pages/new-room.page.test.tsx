import { act, render, screen } from "@testing-library/react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { Engine } from "@semoss/shared";
import type { RoomViewProps } from "@/features/rooms/types/room";
import { NewRoomPage } from "./new-room.page";

const harness = vi.hoisted(() => ({
	props: null as RoomViewProps | null,
	actions: { run: vi.fn() },
	addPendingRoom: vi.fn(),
	trackGeneratedRoomName: vi.fn(),
	createRoom: vi.fn(),
	submitAgentTurn: vi.fn(),
}));

vi.mock("@/app/agent.context", () => ({
	useAgent: () => ({
		agent: {
			id: "agent-1",
			name: "Research agent",
			system_prompt: "Check sources.",
			config_json: {
				model_id: "model-default",
				budgets: { max_turns: 12, max_reflections: 3 },
			},
		},
	}),
}));
vi.mock("@/app/main.context", () => ({
	useMain: () => ({
		addPendingRoom: harness.addPendingRoom,
		trackGeneratedRoomName: harness.trackGeneratedRoomName,
		newRoom: vi.fn(),
	}),
}));
vi.mock("@/app/room.context", () => ({
	useRoom: () => ({ openRoomsList: vi.fn() }),
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
vi.mock("@/features/rooms/components/room-view", () => ({
	RoomView: (props: RoomViewProps) => {
		harness.props = props;
		return <div>Draft composer</div>;
	},
}));

const routes: RouteObject[] = [
	{
		path: "/agents/:agentId/new/:draftId",
		Component: NewRoomPage,
	},
	{
		path: "/agents/:agentId/:roomId",
		element: <div>Room opened</div>,
	},
];

function renderDraft() {
	const router = createMemoryRouter(routes, {
		initialEntries: ["/agents/agent-1/new/draft-1?model=model-2"],
	});
	render(<RouterProvider router={router} />);
	return router;
}

function roomProps(): RoomViewProps {
	if (!harness.props) throw new Error("RoomView did not render");
	return harness.props;
}

describe("NewRoomPage", () => {
	beforeEach(() => {
		harness.props = null;
		harness.addPendingRoom.mockReset();
		harness.trackGeneratedRoomName.mockReset();
		harness.createRoom.mockReset().mockResolvedValue("room-1");
		harness.submitAgentTurn.mockReset().mockResolvedValue(undefined);
	});

	it("stays client-only until the first message is submitted", async () => {
		const router = renderDraft();

		expect(screen.getByText("Draft composer")).toBeInTheDocument();
		expect(roomProps().modelId).toBe("model-2");
		expect(roomProps().showToolWorkbench).toBe(false);
		expect(harness.createRoom).not.toHaveBeenCalled();

		await act(() =>
			roomProps().onSendMessage({ text: "Plan the quarter", files: [] }),
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
		expect(router.state.location.pathname).toBe("/agents/agent-1/room-1");
		expect(router.state.historyAction).toBe("REPLACE");
	});

	it("reuses a created room when submission is retried", async () => {
		harness.submitAgentTurn
			.mockRejectedValueOnce(new Error("Could not submit"))
			.mockResolvedValueOnce(undefined);
		renderDraft();

		await expect(
			act(() =>
				roomProps().onSendMessage({ text: "Retry me", files: [] }),
			),
		).rejects.toThrow("Could not submit");
		await act(() =>
			roomProps().onSendMessage({ text: "Retry me", files: [] }),
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
			act(() =>
				roomProps().onSendMessage({ text: "Retry me", files: [] }),
			),
		).rejects.toThrow("Could not configure room");
		await act(() =>
			roomProps().onSendMessage({ text: "Retry me", files: [] }),
		);

		expect(harness.createRoom).toHaveBeenCalledTimes(2);
		expect(harness.createRoom.mock.calls[1]?.[3]).toEqual(
			expect.objectContaining({ roomId: "room-1" }),
		);
		expect(harness.addPendingRoom).toHaveBeenCalledTimes(1);
		expect(harness.submitAgentTurn).toHaveBeenCalledTimes(1);
	});

	it("keeps a changed model on the same draft URL", async () => {
		const router = renderDraft();
		const nextEngine: Engine = {
			engine_id: "model-3",
			engine_name: "model-three",
			engine_type: "MODEL",
		};

		await act(() => roomProps().onModelChange(nextEngine));

		expect(router.state.location.pathname).toBe(
			"/agents/agent-1/new/draft-1",
		);
		expect(router.state.location.search).toBe("?model=model-3");
		expect(roomProps().modelId).toBe("model-3");
		expect(harness.createRoom).not.toHaveBeenCalled();
	});
});
