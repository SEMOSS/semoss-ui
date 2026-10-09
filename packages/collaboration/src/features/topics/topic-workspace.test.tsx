import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { directItem, savedTopic } from "./topic-test-fixtures";
import { TopicWorkspace } from "./topic-workspace";

const mocks = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: mocks.actions }),
}));
vi.mock("@/features/attention/attention.context", () => ({
	useAttention: () => ({
		items: [],
		isLoading: false,
		isComplete: true,
		errors: [],
		refresh: vi.fn(),
	}),
}));
vi.mock("@/features/dashboard/topic-sessions", () => ({
	TopicSessions: () => <p>Source-linked rooms</p>,
}));

function renderWorkspace(empty = false) {
	const topic = {
		...savedTopic,
		isSample: true,
		description: "Prepare for client meetings",
		goals: [
			{
				noteId: "done",
				text: "Choose a destination",
				status: "done" as const,
			},
			{
				noteId: "open",
				text: "Be ready before departure",
				status: "open" as const,
			},
		],
	};
	const base = {
		...directItem,
		isSample: true,
		assignee: null,
		roomId: null,
		threadId: "",
		topicIds: [],
		linkTopicId: topic.id,
		status: "open" as const,
	};
	const state = {
		...createInitialCollaborationState(),
		topics: [topic],
		threads: [],
		reviews: [],
		memories: [],
		items: empty
			? []
			: [
					{
						...base,
						id: "review",
						askType: "approve" as const,
						title: "Approve travel outline",
					},
					{
						...base,
						id: "next",
						askType: "fyi" as const,
						title: "Flight options",
					},
					{
						...base,
						id: "waiting",
						assignee: "person",
						title: "Confirm attendees",
					},
				],
	};
	return render(
		<MemoryRouter>
			<CollaborationSessionProvider initialState={state}>
				<TopicWorkspace topicId={topic.id} />
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
}

it("shows scoped direct reviews even before global attention has them, with separate next and waiting groups", async () => {
	const user = userEvent.setup();
	renderWorkspace();
	expect(
		within(
			screen.getByRole("region", { name: "Needs your input" }),
		).getByText("Approve travel outline"),
	).toBeVisible();
	expect(
		within(screen.getByRole("list", { name: "Next up" })).getByText(
			"Flight options",
		),
	).toBeVisible();
	expect(screen.queryByText("Confirm attendees")).not.toBeInTheDocument();
	await user.click(
		screen.getByRole("button", { name: "Show waiting tasks" }),
	);
	expect(
		within(screen.getByRole("list", { name: "Waiting" })).getByText(
			"Confirm attendees",
		),
	).toBeVisible();
	expect(screen.getByText("Be ready before departure")).toBeVisible();
	await user.click(screen.getByRole("button", { name: "1 more goal" }));
	expect(screen.getByText("Choose a destination")).toBeVisible();
});

it("retains empty topics, honest unavailable actions, and keyboard-accessible context tabs", async () => {
	const user = userEvent.setup();
	renderWorkspace(true);
	expect(
		screen.getByRole("heading", { name: savedTopic.name, level: 1 }),
	).toBeVisible();
	expect(
		screen.getByText("Nothing needs your input in this topic right now."),
	).toBeVisible();
	expect(screen.getByRole("button", { name: "New chat" })).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "Add an action item" }),
	).toBeDisabled();
	expect(
		screen.getByRole("heading", { name: "Topic activity" }),
	).toBeVisible();
	act(() => screen.getByRole("tab", { name: "Overview" }).focus());
	await user.keyboard("{ArrowRight}");
	expect(screen.getByRole("tab", { name: "Context" })).toHaveFocus();
	await user.keyboard("{Enter}");
	expect(screen.getByText("Prepare for client meetings")).toBeVisible();
	await user.click(screen.getByRole("tab", { name: "Chat" }));
	expect(screen.getByRole("link", { name: /Home/ })).toHaveAttribute(
		"href",
		"/",
	);
});
