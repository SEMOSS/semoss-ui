import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { MemoryRouter } from "react-router";
import { TooltipProvider } from "@semoss/ui/next";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import type { ConversationMessage } from "@/features/messages/types/message";
import { WorkConversation } from "./work-conversation";
import { workSnapshot } from "./work-thread.test-fixtures";
import { workTimeline } from "./work-timeline";

const state = createInitialCollaborationState();
const sources: WorkspaceMessage[] = [
	{
		id: "before",
		fromId: "p",
		at: "2026-09-28T10:00:00Z",
		text: "First email",
	},
	{
		id: "after",
		fromId: "p",
		at: "2026-09-28T10:02:00Z",
		text: "Later email",
	},
];
const answers: ConversationMessage[] = [
	{
		id: "first",
		role: "assistant",
		createdAt: "2026-09-28T10:01:00Z",
		parts: [
			{ type: "text", text: "First answer" },
			{ type: "thinking", text: "More reasoning" },
		],
	},
	{
		id: "second",
		role: "assistant",
		createdAt: "2026-09-28T10:03:00Z",
		parts: [{ type: "text", text: "Second answer" }],
	},
];

function view(
	entries: ComponentProps<typeof WorkConversation>["entries"],
	props: Partial<ComponentProps<typeof WorkConversation>> = {},
) {
	return (
		<MemoryRouter>
			<TooltipProvider>
				<CollaborationSessionProvider initialState={state}>
					<WorkConversation
						thread={{ ...state.threads[0], channel: "email" }}
						entries={entries}
						resumeSignal={0}
						turn={workSnapshot().turn}
						{...props}
					/>
				</CollaborationSessionProvider>
			</TooltipProvider>
		</MemoryRouter>
	);
}

it("keeps source emails out of the assistant transcript", () => {
	render(view(workTimeline(sources, answers, "room")));
	const transcript = screen.getByRole("region", {
		name: "Conversation messages",
	});
	expect(within(transcript).getAllByRole("article")).toHaveLength(2);
	expect(transcript).toHaveTextContent("First answer");
	expect(transcript).toHaveTextContent("Second answer");
	expect(screen.queryByText("First email")).toBeNull();
	expect(screen.queryByText("Later email")).toBeNull();
	expect(screen.queryByRole("button", { name: /^Open email:/ })).toBeNull();
});

it("source refreshes do not replace assistant rows or expanded reasoning", () => {
	const active = {
		...answers[0],
		live: { phase: "streaming" as const, hasObservationIssue: false },
	};
	const turn = {
		...workSnapshot().turn,
		isRunning: true,
		phase: "streaming" as const,
	};
	const { rerender } = render(
		view(workTimeline([], [active], "room"), { turn }),
	);
	const answer = screen.getByText("First answer");
	const thinking = screen.getByRole("button", { name: "Thinking" });
	fireEvent.click(thinking);
	thinking.focus();
	rerender(view(workTimeline([], [active, answers[1]], "room"), { turn }));
	expect(screen.getByText("First answer")).toBe(answer);
	expect(thinking).toHaveAttribute("aria-expanded", "true");
	expect(thinking).toHaveFocus();
});

it("shows the chat empty state without an email empty state", () => {
	render(view([]));
	expect(screen.getByText("Ask a question or start a task.")).toBeVisible();
	expect(screen.queryByText("No source messages are available.")).toBeNull();
});
