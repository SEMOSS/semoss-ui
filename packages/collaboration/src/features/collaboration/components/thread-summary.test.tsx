import { fireEvent, render, screen } from "@testing-library/react";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { ThreadSummary } from "./thread-summary";

function Harness() {
	const { state } = useCollaborationSession();
	const thread = state.threads[0];
	return (
		<ThreadSummary
			thread={thread}
			workspace={state.workspaces[thread.id]}
		/>
	);
}

// jsdom has no layout; the clamped paragraph reports its full height only while it overflows
function renderSummary(overflowing: boolean) {
	const scroll = vi
		.spyOn(HTMLElement.prototype, "scrollHeight", "get")
		.mockReturnValue(overflowing ? 408 : 168);
	const client = vi
		.spyOn(HTMLElement.prototype, "clientHeight", "get")
		.mockReturnValue(168);
	const state = createInitialCollaborationState();
	state.threads[0].summary = "A long summary of where the thread stands.";
	const view = render(
		<CollaborationSessionProvider initialState={state}>
			<Harness />
		</CollaborationSessionProvider>,
	);
	return {
		...view,
		restore: () => {
			scroll.mockRestore();
			client.mockRestore();
		},
	};
}

it("clamps a long summary and expands it on Show more", () => {
	const view = renderSummary(true);
	const summary = screen.getByText(
		"A long summary of where the thread stands.",
	);
	expect(summary).toHaveClass("line-clamp-7");
	const toggle = screen.getByRole("button", { name: "Show more" });
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(toggle).toHaveAttribute("aria-controls", summary.id);
	fireEvent.click(toggle);
	expect(summary).not.toHaveClass("line-clamp-7");
	fireEvent.click(screen.getByRole("button", { name: "Show less" }));
	expect(summary).toHaveClass("line-clamp-7");
	view.restore();
});

it("offers no toggle when the summary fits", () => {
	const view = renderSummary(false);
	expect(screen.queryByRole("button", { name: "Show more" })).toBeNull();
	view.restore();
});
