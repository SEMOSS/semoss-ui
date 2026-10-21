import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { ThreadActionItems } from "./thread-action-items";

function Harness() {
	const { state } = useCollaborationSession();
	const thread = state.threads[0];
	return (
		<ThreadActionItems
			thread={thread}
			workspace={state.workspaces[thread.id]}
		/>
	);
}
function setup() {
	const state = createInitialCollaborationState();
	state.workspaces[state.threads[0].id].steps = [];
	return render(
		<CollaborationSessionProvider initialState={state}>
			<Harness />
		</CollaborationSessionProvider>,
	);
}
it("keeps an empty focused row after Enter and ignores whitespace", async () => {
	const user = userEvent.setup();
	setup();
	const entry = screen.getByRole("textbox", { name: "Add an action item" });
	await user.type(entry, "  Prepare the review  {Enter}");
	expect(
		await screen.findByRole("button", {
			name: "Edit action item: Prepare the review",
		}),
	).toBeVisible();
	expect(entry).toHaveValue("");
	expect(entry).toHaveFocus();
	await user.type(entry, "   {Enter}");
	expect(screen.getAllByRole("checkbox")).toHaveLength(1);
	await user.clear(entry);
	await user.type(entry, "Send the notes{Enter}");
	expect(screen.getAllByRole("checkbox")).toHaveLength(2);
	expect(entry).toHaveFocus();
	expect(entry).toHaveValue("");
});
it("edits text and date, restores keyboard focus, and keeps completed items collapsed", async () => {
	const user = userEvent.setup();
	setup();
	await user.type(
		screen.getByRole("textbox", { name: "Add an action item" }),
		"Review{Enter}",
	);
	await user.click(
		screen.getByRole("button", { name: "Edit action item: Review" }),
	);
	const text = screen.getByRole("textbox", { name: /Action item/ });
	await user.clear(text);
	await user.type(text, "Review proposal");
	fireEvent.change(screen.getByLabelText("Due date"), {
		target: { value: "2026-10-05" },
	});
	await user.click(screen.getByRole("button", { name: "Save" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", {
				name: "Edit action item: Review proposal",
			}),
		).toHaveFocus(),
	);
	await user.click(
		screen.getByRole("checkbox", {
			name: "Complete action item: Review proposal",
		}),
	);
	expect(
		screen.queryByRole("button", {
			name: "Edit action item: Review proposal",
		}),
	).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "Show completed" }));
	expect(
		screen.getByRole("checkbox", {
			name: "Complete action item: Review proposal",
		}),
	).toBeChecked();
});
