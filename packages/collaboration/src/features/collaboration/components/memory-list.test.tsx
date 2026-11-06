import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { MemoryRow } from "./memory-list";

it("links a memory about a conversation to the conversation's page", () => {
	const state = createInitialCollaborationState();
	const [thread] = state.threads;
	const [memory] = state.memories;
	render(
		<CollaborationSessionProvider initialState={state}>
			<MemoryRouter>
				<MemoryRow
					memory={{
						...memory,
						about: [{ type: "thread", id: thread.id }],
					}}
				/>
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	expect(screen.getByRole("link", { name: thread.subject })).toHaveAttribute(
		"href",
		`/thread/${encodeURIComponent(thread.id)}`,
	);
});
