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

it("opens the current topic's assistant on demand and preserves a hidden draft", async () => {
	const user = userEvent.setup();
	const state = createInitialCollaborationState();
	const [first, second] = state.topics;
	if (!first || !second) throw new Error("Missing topic fixtures");
	first.status = "active";
	second.status = "active";
	const router = createMemoryRouter(
		[{ path: "/topics/:topicId", element: <TopicPage /> }],
		{ initialEntries: [`/topics/${first.id}`] },
	);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	expect(assistant.mounted).not.toHaveBeenCalled();
	const trigger = screen.getByRole("button", { name: "Ask assistant" });
	expect(trigger).toHaveAttribute("aria-expanded", "false");
	await user.click(trigger);
	const input = await screen.findByRole("textbox", {
		name: `Ask about ${first.id}`,
	});
	expect(assistant.mounted).toHaveBeenCalledWith(first.id);
	expect(trigger).toHaveAttribute("aria-expanded", "true");
	await user.type(input, "Which emails need my attention?");
	await user.click(screen.getByRole("button", { name: "Hide assistant" }));
	expect(input).not.toBeVisible();
	await user.keyboard("{Enter}");
	expect(input).toBeVisible();
	expect(input).toHaveValue("Which emails need my attention?");
	await act(async () => router.navigate(`/topics/${second.id}`));
	expect(
		screen.queryByRole("textbox", { name: /^Ask about/ }),
	).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "Ask assistant" }));
	expect(
		await screen.findByRole("textbox", { name: `Ask about ${second.id}` }),
	).toHaveValue("");
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
		await userEvent
			.setup()
			.click(screen.getByRole("button", { name: "Ask assistant" }));
		expect(
			screen.getByText(
				"Set this topic to Active or Dormant to start a chat.",
			),
		).toBeVisible();
		expect(assistant.mounted).not.toHaveBeenCalled();
	},
);
