import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { TopicPage } from "./topic.page";

const assistant = vi.hoisted(() => ({ mounted: vi.fn() }));
vi.mock("@/features/daily-chat/landing-chat-composer", () => ({
	LandingChatComposer: ({ topicId }: { topicId: string }) => {
		assistant.mounted(topicId);
		return <input aria-label={`Ask about ${topicId}`} />;
	},
}));
vi.mock("@/features/dashboard/topic-sessions", () => ({
	TopicSessions: () => null,
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

it("shows the current topic's assistant without a toggle and starts each topic fresh", async () => {
	const user = userEvent.setup();
	const state = createInitialCollaborationState();
	const [first, second] = state.topics;
	if (!first || !second) throw new Error("Missing topic fixtures");
	first.status = "active";
	second.status = "dormant";
	const router = createMemoryRouter(
		[{ path: "/topics/:topicId", element: <TopicPage /> }],
		{ initialEntries: [`/topics/${first.id}`] },
	);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	const input = await screen.findByRole("textbox", {
		name: `Ask about ${first.id}`,
	});
	expect(assistant.mounted).toHaveBeenCalledWith(first.id);
	// shown on load without taking focus from the page
	expect(input).not.toHaveFocus();
	expect(
		screen.queryByRole("button", { name: /^(Ask|Hide) assistant$/ }),
	).not.toBeInTheDocument();
	await user.type(input, "Which emails need my attention?");
	await act(async () => router.navigate(`/topics/${second.id}`));
	expect(
		await screen.findByRole("textbox", { name: `Ask about ${second.id}` }),
	).toHaveValue("");
	expect(
		screen.queryByRole("textbox", { name: `Ask about ${first.id}` }),
	).not.toBeInTheDocument();
});

it.each(["archived", "suggested"] as const)(
	"explains how to enable the assistant for a %s topic without allocating a chat",
	async (status) => {
		const state = createInitialCollaborationState();
		const [topic] = state.topics;
		if (!topic) throw new Error("Missing topic fixture");
		topic.status = status;
		const router = createMemoryRouter(
			[{ path: "/topics/:topicId", element: <TopicPage /> }],
			{ initialEntries: [`/topics/${topic.id}`] },
		);
		render(
			<CollaborationSessionProvider initialState={state}>
				<RouterProvider router={router} />
			</CollaborationSessionProvider>,
		);
		expect(
			screen.getByText(
				"Set this topic to Active or Dormant to start a chat.",
			),
		).toBeVisible();
		expect(assistant.mounted).not.toHaveBeenCalled();
	},
);
