import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailConversationButton } from "./email-conversation-button";
import { WorkComposerSession } from "./work-composer-session";
import { workSnapshot } from "./work-thread.test-fixtures";

const composer = new WorkComposerSession();
const snapshot = workSnapshot();
vi.mock("./work-thread-context", () => ({
	useWorkThread: () => ({ snapshot, title: "New session" }),
}));
vi.mock("./work-email.context", () => ({ useWorkEmail: () => ({ composer }) }));
it("opens an editable new email from visible text, excluding hidden messages and reasoning", async () => {
	const user = userEvent.setup();
	snapshot.turn.messages = [
		{
			id: "u",
			role: "user",
			parts: [{ type: "text", text: "Prepare a launch update" }],
		},
		{
			id: "a",
			role: "assistant",
			parts: [
				{ type: "thinking", text: "Internal reasoning" },
				{ type: "text", text: "The launch is ready for review." },
			],
		},
		{
			id: "hidden",
			role: "assistant",
			visible: false,
			parts: [{ type: "text", text: "Hidden context" }],
		},
	];
	render(<EmailConversationButton />);
	await user.click(
		screen.getByRole("button", { name: "Email this conversation" }),
	);
	const draft = composer.getSnapshot().emailDrafts[0];
	expect(draft.seed.mode).toBe("new");
	expect(draft.seed.subject).toBe("Conversation update");
	expect(draft.getSnapshot().values.body).toContain(
		"The launch is ready for review.",
	);
	expect(draft.getSnapshot().values.body).not.toContain("Internal reasoning");
	expect(draft.getSnapshot().values.body).not.toContain("Hidden context");
	expect(draft.getSnapshot().isSent).toBe(false);
	expect(draft.getSnapshot().saved).toBeNull();
});
