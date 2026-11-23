import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { RoomSession, type RoomSessionSnapshot } from "../room-session";
import type { RoomViewProps } from "../types/room";
import { RoomSessionView } from "./room-session-view";

// the room below it shows the agent it was handed, as every surface of the room names it
vi.mock("./room-view", () => ({
	RoomView: ({ agent, roomInstructions }: RoomViewProps) => (
		<>
			<output aria-label="Agent in the room">{agent.name}</output>
			<output aria-label="Room instructions">{roomInstructions}</output>
		</>
	),
}));
vi.mock("@/features/delegations/api/use-delegation-status", () => ({
	useDelegationStatus: () => (messages: unknown) => messages,
}));
vi.mock("@/features/delegations/components/delegation-response-panel", () => ({
	DelegationResponsePanel: () => null,
}));

const SEEDED: WorkspaceAgent = {
	workspace_id: "collaboration-agent",
	name: "Collaboration Agent",
	description: "",
	system_prompt: "Help the owner with their work.",
	mcp: [],
	skills: [],
	prompts: [],
};

afterEach(cleanup);

/** The room as its saved state describes it, for someone whose twin has a name. */
function renderRoom(changes: Partial<RoomSessionSnapshot>) {
	const session = new RoomSession("session-view-test", "room-1");
	const snapshot = { ...session.getSnapshot(), ...changes };
	render(
		<CollaborationSessionProvider
			initialState={{
				...createInitialCollaborationState(),
				mainTwin: {
					name: "Robin's Digital Twin",
					avatar: "",
					agentId: "collaboration-agent",
				},
			}}
		>
			<MemoryRouter>
				<RoomSessionView session={session} snapshot={snapshot} />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	session.dispose();
	return snapshot;
}
const settings = (agentId: string): RoomSessionSnapshot["settings"] => ({
	modelId: "model-1",
	agentId,
	instructions: "",
	temperature: null,
	mcp: [],
});
const named = () => screen.getByLabelText("Agent in the room").textContent;

it("names the seeded agent as the person's own twin in every part of the room, and keeps what is saved with the room", () => {
	const snapshot = renderRoom({
		agent: SEEDED,
		settings: settings("collaboration-agent"),
	});
	expect(named()).toBe("Robin's Digital Twin");
	// only the name changes: the agent's own instructions still stand behind the room's
	expect(screen.getByLabelText("Room instructions")).toHaveTextContent(
		"Help the owner with their work.",
	);
	// what the room session saves with the room reads the snapshot, which keeps the agent's own name
	expect(snapshot.agent?.name).toBe("Collaboration Agent");
});

it("names a room with no agent as the person's own twin, and one whose agent has not loaded as an agent", () => {
	renderRoom({ agent: null, settings: settings("") });
	expect(named()).toBe("Robin's Digital Twin");
	cleanup();
	renderRoom({ agent: null, settings: settings("research") });
	expect(named()).toBe("Agent");
});

it("leaves any other agent under its own name, and never shows the seeded agent's in a delegated task's room", () => {
	const research = {
		...SEEDED,
		workspace_id: "research",
		name: "Research assistant",
	};
	renderRoom({ agent: research, settings: settings("research") });
	expect(named()).toBe("Research assistant");
	cleanup();

	const session = new RoomSession("session-view-options", "room-1");
	renderRoom({
		agent: SEEDED,
		settings: settings("collaboration-agent"),
		options: {
			...session.getSnapshot().options,
			delegation_action_id: "action-1",
		} as never,
	});
	session.dispose();
	// not the person's own twin there, and not "Collaboration Agent", which no screen shows
	expect(named()).toBe("Agent");
});
