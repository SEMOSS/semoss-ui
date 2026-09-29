import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
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
		<TooltipProvider>
			<CollaborationSessionProvider initialState={state}>
				<WorkConversation
					thread={{ ...state.threads[0], channel: "email" }}
					entries={entries}
					allowedSources={
						new Set(sources.map((message) => message.id))
					}
					resumeSignal={0}
					turn={workSnapshot().turn}
					{...props}
				/>
			</CollaborationSessionProvider>
		</TooltipProvider>
	);
}

it("renders separate email and assistant sections in chronological order", () => {
	render(view(workTimeline(sources, answers, "room")));
	const transcript = screen.getByRole("region", {
		name: "Conversation messages",
	});
	const articles = within(transcript).getAllByRole("article");
	expect(articles).toHaveLength(4);
	for (const [index, text] of [
		"First email",
		"First answer",
		"Later email",
		"Second answer",
	].entries()) {
		expect(articles[index]).toHaveTextContent(text);
	}
	const groups = within(transcript).getAllByRole("region", {
		name: /^(Email|Assistant) conversation$/,
	});
	expect(groups.map((group) => group.getAttribute("aria-label"))).toEqual([
		"Email conversation",
		"Assistant conversation",
		"Email conversation",
		"Assistant conversation",
	]);
	expect(
		screen.getAllByRole("button", { name: "Collapse email conversation" }),
	).toHaveLength(2);
	expect(
		screen.getAllByRole("button", {
			name: "Collapse assistant conversation",
		}),
	).toHaveLength(2);
	expect(
		screen.getAllByRole("region", { name: "Conversation messages" }),
	).toHaveLength(1);
});

it("inserts a later email during streaming without replacing existing rows or expanded reasoning", () => {
	const active: ConversationMessage = {
		...answers[0],
		live: { phase: "streaming", hasObservationIssue: false },
	};
	const turn = {
		...workSnapshot().turn,
		isRunning: true,
		phase: "streaming" as const,
	};
	const { rerender } = render(
		view(workTimeline([sources[0]], [active], "room"), { turn }),
	);
	const firstEmail = screen.getByText("First email");
	const firstAnswer = screen.getByText("First answer");
	const thinking = screen.getByRole("button", { name: "Thinking" });
	fireEvent.click(thinking);
	thinking.focus();
	rerender(
		view(workTimeline(sources, [active, answers[1]], "room"), { turn }),
	);
	expect(screen.getByText("First email")).toBe(firstEmail);
	expect(screen.getByText("First answer")).toBe(firstAnswer);
	expect(screen.getByRole("button", { name: "Thinking" })).toBe(thinking);
	expect(thinking).toHaveAttribute("aria-expanded", "true");
	expect(thinking).toHaveFocus();
	const rows = within(
		screen.getByRole("region", { name: "Conversation messages" }),
	).getAllByRole("article");
	expect(rows[2]).toHaveTextContent("Later email");
	expect(rows[3]).toHaveTextContent("Second answer");
});

it("keeps fresh-thread actions after the emails and only reveals the assistant prompt when selected", () => {
	const entries = workTimeline(sources, [], "room");
	const actions = <button type="button">Ask Assistant</button>;
	const { rerender } = render(
		view(entries, { showAssistant: false, actions }),
	);
	expect(screen.getByRole("button", { name: "Ask Assistant" })).toBeVisible();
	expect(screen.queryByText("Ask a question or work on a reply.")).toBeNull();
	expect(
		screen
			.getByText("Later email")
			.compareDocumentPosition(
				screen.getByRole("button", { name: "Ask Assistant" }),
			) & Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();
	rerender(view(entries, { showAssistant: true }));
	expect(
		screen.getByText("Ask a question or work on a reply."),
	).toBeVisible();
	expect(screen.queryByRole("button", { name: "Ask Assistant" })).toBeNull();
});

it("preserves source and assistant empty-state messages in their sections", () => {
	render(view([]));
	expect(screen.getByText("No source messages are available.")).toBeVisible();
	expect(
		screen.getByText("Ask a question or work on a reply."),
	).toBeVisible();
});

it("collapses each section independently and retains its state as messages append", () => {
	const { rerender } = render(view(workTimeline(sources, answers, "room")));
	const firstEmail = screen.getByText("First email");
	const toggle = screen.getAllByRole("button", {
		name: "Collapse email conversation",
	})[0];
	fireEvent.click(toggle);
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(firstEmail).not.toBeVisible();
	expect(firstEmail.isConnected).toBe(true);
	expect(screen.getByText("Later email")).toBeVisible();
	expect(screen.getByText("First answer")).toBeVisible();
	const added: WorkspaceMessage = {
		...sources[0],
		id: "added",
		at: "2026-09-28T10:00:30Z",
		text: "Another early email",
	};
	rerender(view(workTimeline([...sources, added], answers, "room")));
	expect(
		screen.getByRole("button", { name: "Expand email conversation" }),
	).toBe(toggle);
	expect(screen.getByText("Another early email")).not.toBeVisible();
	fireEvent.click(toggle);
	expect(screen.getByText("First email")).toBe(firstEmail);
	expect(firstEmail).toBeVisible();
	expect(screen.getByText("Another early email")).toBeVisible();
	expect(
		screen.getAllByRole("region", { name: "Email conversation" }),
	).toHaveLength(2);
});

it("retains expanded thinking when its assistant section is collapsed and reopened", () => {
	render(view(workTimeline(sources, answers, "room")));
	const thinking = screen.getByRole("button", { name: "Thinking" });
	fireEvent.click(thinking);
	const reasoning = screen.getByText("More reasoning");
	const toggle = screen.getAllByRole("button", {
		name: "Collapse assistant conversation",
	})[0];
	fireEvent.click(toggle);
	expect(reasoning).not.toBeVisible();
	expect(reasoning.isConnected).toBe(true);
	expect(screen.getByText("Second answer")).toBeVisible();
	fireEvent.click(toggle);
	expect(screen.getByRole("button", { name: "Thinking" })).toBe(thinking);
	expect(thinking).toHaveAttribute("aria-expanded", "true");
	expect(reasoning).toBeVisible();
});
